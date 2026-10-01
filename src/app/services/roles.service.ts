import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Role {
    _id: string;
    role: string;
    name?: string;
    color?: string;
    displayName?: string; // Nombre traducido al español
    [key: string]: unknown;
}

@Injectable({
    providedIn: 'root'
})
export class RolesService {

    // Mapeo de traducciones y colores para los roles
    private roleTranslations: { [key: string]: { displayName: string; color: string } } = {
        'admin': { displayName: 'Administrador', color: 'var(--role-admin)' },
        'professional': { displayName: 'Profesional Privado', color: 'var(--role-professional)' },
        'professional-public': { displayName: 'Profesional Público', color: 'var(--role-professional-public)' },
        'pharmacist': { displayName: 'Farmacéutico', color: 'var(--role-pharmacist)' },
        'auditor': { displayName: 'Auditor', color: 'var(--role-auditor)' },
        'app': { displayName: 'Aplicación', color: 'var(--role-app)' },
    };

    constructor(private http: HttpClient) { }

    getRoleTypes(): Observable<Role[]> {
        return this.http.get<Role[]>(`${environment.API_END_POINT}/auth/role-types`);
    }

    getFilteredRoleTypes(): Observable<Role[]> {
        return this.getRoleTypes().pipe(
            map((roles: Role[]) =>
                roles
                    .filter(role => role.role !== 'pharmacist-public')
                    .map(role => this.enhanceRoleWithTranslation(role))
                    .sort((a, b) => a.role.localeCompare(b.role))
            )
        );
    }

    private enhanceRoleWithTranslation(role: Role): Role {
        const translation = this.roleTranslations[role.role];
        return {
            ...role,
            displayName: translation?.displayName || role.name || role.role,
            color: translation?.color || 'var(--text-disabled)' // Color gris por defecto
        };
    }

    getRoleDisplayName(roleKey: string): string {
        return this.roleTranslations[roleKey]?.displayName || roleKey;
    }

    getRoleColor(roleKey: string): string {
        return this.roleTranslations[roleKey]?.color || 'var(--text-disabled)';
    }

    isPharmacistRole(roleKey: string): boolean {
        return roleKey === 'pharmacist' || roleKey === 'pharmacist-public';
    }

    isProfessionalRole(roleKey: string): boolean {
        return roleKey === 'professional' || roleKey === 'professional-public';
    }

    validateRoleCompatibility(selectedRoles: Role[]): { isValid: boolean; conflictingRoles?: string[] } {
        const hasPharmacistRole = selectedRoles.some(role => this.isPharmacistRole(role.role));
        const hasProfessionalRole = selectedRoles.some(role => this.isProfessionalRole(role.role));

        if (hasPharmacistRole && hasProfessionalRole) {
            const conflictingRoles = selectedRoles
                .filter(role => this.isPharmacistRole(role.role) || this.isProfessionalRole(role.role))
                .map(role => role.displayName || role.name || role.role);

            return {
                isValid: false,
                conflictingRoles
            };
        }

        return { isValid: true };
    }
}
