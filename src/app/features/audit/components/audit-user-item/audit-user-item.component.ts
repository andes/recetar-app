import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User } from '@interfaces/users';
import { RolesService } from '@services/roles.service';

@Component({
    selector: 'app-audit-user-item',
    standalone: false,
    templateUrl: './audit-user-item.component.html',
    styleUrls: ['./audit-user-item.component.sass']
})
export class AuditUserItemComponent {
    @Input() user!: User;
    @Input() selected = false;

    @Output() select = new EventEmitter<User>();

    constructor(private rolesService: RolesService) { }

    get primaryRole(): { _id?: string; role: string } | null {
        return this.user?.roles?.length ? this.user.roles[0] : null;
    }

    get roleName(): string {
        return this.primaryRole ? this.rolesService.getRoleDisplayName(this.primaryRole.role) : '';
    }

    get roleColor(): string {
        return this.primaryRole ? this.rolesService.getRoleColor(this.primaryRole.role) : 'var(--text-disabled)';
    }

    get extraRolesCount(): number {
        return Math.max(0, (this.user?.roles?.length || 0) - 1);
    }

    get roleIcon(): string {
        const roleKey = this.primaryRole?.role;
        const iconMap: Record<string, string> = {
            'admin': 'admin_panel_settings',
            'pharmacist': 'local_pharmacy',
            'pharmacist-public': 'local_pharmacy',
            'auditor': 'fact_check',
            'professional': 'medical_services',
            'professional-public': 'medical_services'
        };
        return (roleKey && iconMap[roleKey]) || 'person';
    }

    get statusLabel(): string {
        return this.user?.isActive ? 'Activo' : 'Inactivo';
    }

    get statusVariant(): string {
        return this.user?.isActive ? 'success' : 'error';
    }

    onSelect(): void {
        this.select.emit(this.user);
    }
}
