import { Injectable } from '@angular/core';
import { Efector } from '@interfaces/efectores';
import { UserService } from '@services/users.service';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class EfectorFormSessionService {
    private userId: string;
    private initialized = false;
    private pendingChanges = false;
    private snapshotEfectores: Efector[] = [];
    private workingEfectores: Efector[] = [];

    constructor(private userService: UserService) {}

    initialize(userId: string): Observable<Efector[]> {
        if (this.initialized && this.userId === userId) {
            return of(this.cloneEfectores(this.workingEfectores));
        }

        this.userId = userId;
        return this.userService.getUserById(userId).pipe(
            map(user => (user && user.efectores) ? user.efectores : []),
            tap(efectores => {
                const cloned = this.cloneEfectores(efectores);
                this.snapshotEfectores = cloned;
                this.workingEfectores = this.cloneEfectores(cloned);
                this.pendingChanges = false;
                this.initialized = true;
            })
        );
    }

    getEfectores(): Efector[] {
        return this.cloneEfectores(this.workingEfectores);
    }

    getPreferredEfector(): Efector {
        return this.workingEfectores.length > 0 ? this.cloneEfectores([this.workingEfectores[0]])[0] : null;
    }

    hasPendingChanges(): boolean {
        return this.pendingChanges;
    }

    markSelectedEfector(selectedEfector: Efector): void {
        if (!selectedEfector || this.workingEfectores.length <= 1) {
            return;
        }

        const selectedIndex = this.workingEfectores.findIndex(e => this.isSameEfector(e, selectedEfector));
        if (selectedIndex <= 0) {
            return;
        }

        const selected = this.workingEfectores[selectedIndex];
        this.workingEfectores = [
            selected,
            ...this.workingEfectores.filter((_, index) => index !== selectedIndex)
        ];
        this.pendingChanges = true;
    }

    addEfector(newEfector: Efector): void {
        if (!newEfector) {
            return;
        }

        const exists = this.workingEfectores.some(efector => this.isSameEfector(efector, newEfector));
        if (!exists) {
            this.workingEfectores = [...this.workingEfectores, this.cloneEfectores([newEfector])[0]];
            this.pendingChanges = true;
        }

        this.markSelectedEfector(newEfector);
    }

    commitChanges(): Observable<any> {
        if (!this.initialized || !this.userId || !this.pendingChanges) {
            return of(null);
        }

        const efectoresParaServidor = this.workingEfectores.map(efector => this.prepareEfectorForServer(efector));

        return this.userService.updateUserEfectores(this.userId, efectoresParaServidor).pipe(
            tap(updatedUser => {
                const updatedEfectores = updatedUser && updatedUser.efectores ? updatedUser.efectores : this.workingEfectores;
                const cloned = this.cloneEfectores(updatedEfectores);
                this.snapshotEfectores = cloned;
                this.workingEfectores = this.cloneEfectores(cloned);
                this.pendingChanges = false;
            })
        );
    }

    rollbackChanges(): Observable<Efector[]> {
        if (!this.initialized || !this.userId) {
            return of([]);
        }

        if (this.snapshotEfectores && this.snapshotEfectores.length > 0) {
            this.workingEfectores = this.cloneEfectores(this.snapshotEfectores);
            this.pendingChanges = false;
            return of(this.cloneEfectores(this.workingEfectores));
        }

        return this.userService.getUserById(this.userId).pipe(
            map(user => (user && user.efectores) ? user.efectores : []),
            tap(efectores => {
                const cloned = this.cloneEfectores(efectores);
                this.snapshotEfectores = cloned;
                this.workingEfectores = this.cloneEfectores(cloned);
                this.pendingChanges = false;
            })
        );
    }

    resetSession(): void {
        this.userId = null;
        this.initialized = false;
        this.pendingChanges = false;
        this.snapshotEfectores = [];
        this.workingEfectores = [];
    }

    private cloneEfectores(efectores: Efector[]): Efector[] {
        return JSON.parse(JSON.stringify(efectores || []));
    }

    private isSameEfector(a: Efector, b: Efector): boolean {
        if (!a || !b) {
            return false;
        }

        if (a._id && b._id) {
            return a._id === b._id;
        }

        return a.nombre === b.nombre && JSON.stringify(a.direccion) === JSON.stringify(b.direccion);
    }

    private prepareEfectorForServer(efector: Efector): any {
        const result: any = {
            nombre: efector.nombre,
            direccion: efector.direccion
        };

        if (efector._id && efector._id.trim() !== '') {
            result._id = efector._id;
        }

        return result;
    }
}
