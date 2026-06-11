import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth/services/auth.service';
import { SidebarItem } from '@shared/components/layout/sidebar/sidebar.component';

@Component({
    selector: 'app-dashboard-home',
    templateUrl: './dashboard-home.component.html',
    styleUrls: ['./dashboard-home.component.sass'],
    standalone: false
})
export class DashboardHomeComponent implements OnInit {
    isProfessional = false;
    isPharmacist = false;
    isAudit = false;
    sidebarItems: SidebarItem[] = [];

    constructor(private authService: AuthService) {}

    ngOnInit(): void {
        this.isProfessional = this.authService.isProfessionalRole() || this.authService.isProfessionalPublicRole();
        this.isPharmacist = this.authService.isPharmacistsRole() || this.authService.isPharmacistsPublicRole();
        this.isAudit = this.authService.isAuditRole();
        this.buildSidebarItems();
    }

    private buildSidebarItems(): void {
        this.sidebarItems = [
            { icon: 'home', label: 'Inicio', route: '/dashboard' },
        ];

        if (this.isProfessional) {
            this.sidebarItems.push(
                { icon: 'note_add', label: 'Nueva receta', route: '/profesionales/recetas/nueva' },
                { icon: 'inventory_2', label: 'Productos', route: '/profesionales/productos' },
            );
        }

        if (this.isPharmacist) {
            this.sidebarItems.push(
                { icon: 'medication', label: 'Dispensar', route: '/farmacias/recetas/dispensar' },
            );
        }

        if (this.isAudit) {
            this.sidebarItems.push(
                { icon: 'fact_check', label: 'Auditar recetas', route: '/audit/recetas/auditar' },
                { icon: 'people', label: 'Usuarios', route: '/audit/users' },
            );
        }
    }
}
