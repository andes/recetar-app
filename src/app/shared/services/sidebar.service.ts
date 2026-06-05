import { Injectable } from '@angular/core';
import { AuthService } from '@auth/services/auth.service';
import { SidebarItem } from '@shared/components/layout/sidebar/sidebar.component';

@Injectable({
    providedIn: 'root',
})
export class SidebarService {
    constructor(private authService: AuthService) { }

    getItems(): SidebarItem[] {
        const items: SidebarItem[] = [
            { icon: 'home', label: 'Inicio', route: '/dashboard' },
            { icon: 'note_add', label: 'Nueva receta', route: '/prescription/new' },
        ];

        const isProfessional = this.authService.isProfessionalRole() || this.authService.isProfessionalPublicRole();
        const isPharmacist = this.authService.isPharmacistsRole() || this.authService.isPharmacistsPublicRole();
        const isAudit = this.authService.isAuditRole();

        if (isProfessional) {
            items.push(
                // { icon: 'note_add', label: 'Nueva receta (old)', route: '/profesionales/recetas/nueva' },
                { icon: 'description', label: 'Documentos', route: '/documentos' },
                // { icon: 'inventory_2', label: 'Productos', route: '/profesionales/productos' },
            );
        }

        if (isPharmacist) {
            items.push(
                { icon: 'medication', label: 'Dispensar', route: '/farmacias/recetas/dispensar' },
            );
        }

        if (isAudit) {
            items.push(
                { icon: 'fact_check', label: 'Auditar recetas', route: '/audit/recetas/auditar' },
                { icon: 'people', label: 'Usuarios', route: '/audit/users' },
            );
        }

        return items;
    }
}
