import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '@auth/services/auth.service';
import { UserService } from '@services/users.service';
import { OrganizationsAndesService } from '@services/organizations-andes.service';
import { OrganizationsSisaService } from '@services/organizations-sisa.service';
import { SubOrganization, Organization } from '@interfaces/organizations';

@Injectable({
    providedIn: 'root'
})
export class OrganizationsService {

    constructor(
        private authService: AuthService,
        private userService: UserService,
        private organizationsAndesService: OrganizationsAndesService,
        private organizationsSisaService: OrganizationsSisaService,
    ) { }

    loadUserOrganizations(): Observable<SubOrganization[]> {
        const userId = this.authService.getLoggedUserId();
        return new Observable<SubOrganization[]>(observer => {
            this.userService.getUserById(userId).subscribe({
                next: (user) => {
                    observer.next(user.organizaciones || []);
                    observer.complete();
                },
                error: (error) => observer.error(error)
            });
        });
    }

    searchAndesOrganizations(nombre: string): Observable<Organization[]> {
        return this.organizationsAndesService.get(nombre);
    }

    searchSisaOrganizations(name: string): Observable<Organization[]> {
        return this.organizationsSisaService.get(name);
    }

    saveOrganizations(organizaciones: SubOrganization[]): Observable<SubOrganization[]> {
        const userId = this.authService.getLoggedUserId();
        return new Observable<SubOrganization[]>(observer => {
            this.userService.updateUserOrganizaciones(userId, organizaciones).subscribe({
                next: (user) => {
                    observer.next(user.organizaciones || []);
                    observer.complete();
                },
                error: (error) => observer.error(error)
            });
        });
    }

    mapToSubOrganization(organizacion: Organization): SubOrganization {
        return {
            _id: organizacion._id,
            nombre: organizacion.nombre,
            direccion: organizacion.direccion?.valor || '',
            provincia: organizacion.direccion?.ubicacion?.provincia?.nombre || ''
        };
    }
}
