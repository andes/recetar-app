import { Injectable } from '@angular/core';
import { SubOrganizacion } from '@interfaces/organizaciones';
import { UserService } from '@services/users.service';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class OrganizacionFormSessionService {
    private userId: string | null = null;
    private initialized = false;
    private pendingChanges = false;
    private snapshotOrganizaciones: SubOrganizacion[] = [];
    private workingOrganizaciones: SubOrganizacion[] = [];

    constructor(private userService: UserService) { }

    initialize(userId: string): Observable<SubOrganizacion[]> {
        if (this.initialized && this.userId === userId) {
            return of(this.cloneOrganizaciones(this.workingOrganizaciones));
        }

        this.userId = userId;
        return this.userService.getUserById(userId).pipe(
            map(user => (user && user.organizaciones) ? user.organizaciones : []),
            tap(organizaciones => {
                const cloned = this.cloneOrganizaciones(organizaciones);
                this.snapshotOrganizaciones = cloned;
                this.workingOrganizaciones = this.cloneOrganizaciones(cloned);
                this.pendingChanges = false;
                this.initialized = true;
            })
        );
    }

    getOrganizaciones(): SubOrganizacion[] {
        return this.cloneOrganizaciones(this.workingOrganizaciones);
    }

    getPreferredOrganizacion(): SubOrganizacion | null {
        return this.workingOrganizaciones.length > 0 ? this.cloneOrganizaciones([this.workingOrganizaciones[0]])[0] : null;
    }

    hasPendingChanges(): boolean {
        return this.pendingChanges;
    }

    markSelectedOrganizacion(selectedOrganizacion: SubOrganizacion): void {
        if (!selectedOrganizacion || this.workingOrganizaciones.length <= 1) {
            return;
        }

        const selectedIndex = this.workingOrganizaciones.findIndex(e => this.isSameOrganizacion(e, selectedOrganizacion));
        if (selectedIndex <= 0) {
            return;
        }

        const selected = this.workingOrganizaciones[selectedIndex];
        this.workingOrganizaciones = [
            selected,
            ...this.workingOrganizaciones.filter((_, index) => index !== selectedIndex)
        ];
        this.pendingChanges = true;
    }

    addOrganizacion(newOrganizacion: SubOrganizacion): void {
        if (!newOrganizacion) {
            return;
        }

        const exists = this.workingOrganizaciones.some(organizacion => this.isSameOrganizacion(organizacion, newOrganizacion));
        if (!exists) {
            this.workingOrganizaciones = [...this.workingOrganizaciones, this.cloneOrganizaciones([newOrganizacion])[0]];
            this.pendingChanges = true;
        }

        this.markSelectedOrganizacion(newOrganizacion);
    }

    commitChanges(): Observable<any> {
        if (!this.initialized || !this.userId || !this.pendingChanges) {
            return of(null);
        }

        const organizacionesParaServidor = this.workingOrganizaciones.map(organizacion => this.prepareOrganizacionForServer(organizacion));

        return this.userService.updateUserOrganizaciones(this.userId, organizacionesParaServidor).pipe(
            tap(updatedUser => {
                const updatedOrganizaciones = updatedUser && updatedUser.organizaciones ? updatedUser.organizaciones : this.workingOrganizaciones;
                const cloned = this.cloneOrganizaciones(updatedOrganizaciones);
                this.snapshotOrganizaciones = cloned;
                this.workingOrganizaciones = this.cloneOrganizaciones(cloned);
                this.pendingChanges = false;
            })
        );
    }

    rollbackChanges(): Observable<SubOrganizacion[]> {
        if (!this.initialized || !this.userId) {
            return of([]);
        }

        if (this.snapshotOrganizaciones && this.snapshotOrganizaciones.length > 0) {
            this.workingOrganizaciones = this.cloneOrganizaciones(this.snapshotOrganizaciones);
            this.pendingChanges = false;
            return of(this.cloneOrganizaciones(this.workingOrganizaciones));
        }

        return this.userService.getUserById(this.userId).pipe(
            map(user => (user && user.organizaciones) ? user.organizaciones : []),
            tap(organizaciones => {
                const cloned = this.cloneOrganizaciones(organizaciones);
                this.snapshotOrganizaciones = cloned;
                this.workingOrganizaciones = this.cloneOrganizaciones(cloned);
                this.pendingChanges = false;
            })
        );
    }

    resetSession(): void {
        this.userId = null;
        this.initialized = false;
        this.pendingChanges = false;
        this.snapshotOrganizaciones = [];
        this.workingOrganizaciones = [];
    }

    private cloneOrganizaciones(organizaciones: SubOrganizacion[]): SubOrganizacion[] {
        return JSON.parse(JSON.stringify(organizaciones || []));
    }

    private isSameOrganizacion(a: SubOrganizacion, b: SubOrganizacion): boolean {
        if (!a || !b) {
            return false;
        }

        if (a._id && b._id) {
            return a._id === b._id;
        }

        return a.nombre === b.nombre && JSON.stringify(a.direccion) === JSON.stringify(b.direccion);
    }

    private prepareOrganizacionForServer(organizacion: SubOrganizacion): any {
        const result: any = {
            nombre: organizacion.nombre,
            direccion: organizacion.direccion
        };

        if (organizacion._id && organizacion._id.trim() !== '') {
            result._id = organizacion._id;
        }

        return result;
    }
}
