import { Component, Input, Output, EventEmitter, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Role, RolesService } from '@services/roles.service';

@Component({
    standalone: true,
    selector: 'ui-role-select',
    imports: [CommonModule, MatIconModule],
    template: `
        <div class="role-field">
            <label *ngIf="label" class="role-field-label">
                <mat-icon *ngIf="icon" class="role-field-icon">{{ icon }}</mat-icon>
                {{ label }}
            </label>

            <div class="role-field-control" [class.error]="!!error">
                <button type="button" *ngFor="let role of roles" class="role-option"
                    [class.selected]="isSelected(role)" [class.disabled]="isDisabled(role)"
                    [disabled]="saving || isDisabled(role)" (click)="onToggle(role)">
                    <span class="role-dot" [style.background-color]="color(role)"></span>
                    <span class="role-name text-sm">{{ name(role) }}</span>
                    <mat-icon class="role-check" *ngIf="isSelected(role)">check_circle</mat-icon>
                </button>
            </div>

            <small class="field-error" *ngIf="error">{{ error }}</small>
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }

        .role-field {
            display: flex;
            flex-direction: column;
            gap: var(--space-2);
        }

        .role-field-label {
            display: inline-flex;
            align-items: center;
            gap: var(--space-2);
            color: var(--text-secondary);
        }

        .role-field-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            line-height: 18px;
            color: var(--text-secondary);
        }

        .role-field-control {
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: var(--space-1);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            background: var(--bg-card);
            transition: border-color .15s;
        }

        .role-field-control.error {
            border-color: var(--error-fill);
        }

        .role-option {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            width: 100%;
            padding: var(--space-2) var(--space-3);
            border: none;
            border-radius: var(--radius-xs);
            background: transparent;
            color: var(--text-primary);
            font-family: inherit;
            text-align: left;
            cursor: pointer;
            transition: background-color .15s;
        }

        .role-option:hover:not(:disabled) {
            background: var(--hover-bg);
        }

        .role-option.selected {
            background: var(--secondary-50);
        }

        .role-option.disabled,
        .role-option:disabled {
            opacity: .45;
            cursor: not-allowed;
        }

        .role-dot {
            width: 6px;
            height: 6px;
            border-radius: var(--radius-full);
            flex-shrink: 0;
        }

        .role-name {
            flex: 1;
            min-width: 0;
        }

        .role-check {
            color: var(--secondary);
            font-size: 20px;
            width: 20px;
            height: 20px;
        }

        .field-error {
            color: var(--error-fill);
        }
    `]
})
export class UiRoleSelectComponent {
    @Input() label = 'Roles';
    @Input() icon = 'admin_panel_settings';
    @Input() roles: Role[] = [];
    @Input() selected: Role[] = [];
    @Input() error = '';
    @Input({ transform: booleanAttribute }) saving = false;

    @Output() selectedChange = new EventEmitter<Role[]>();
    @Output() conflict = new EventEmitter<Role>();

    constructor(private rolesService: RolesService) { }

    name(role: Role): string {
        return role.displayName || role.name || role.role;
    }

    color(role: Role): string {
        return role.color || this.rolesService.getRoleColor(role.role);
    }

    isSelected(role: Role): boolean {
        return this.selected.some(selected => selected.role === role.role);
    }

    isDisabled(role: Role): boolean {
        if (this.isSelected(role)) { return false; }
        const hasPharmacist = this.selected.some(r => this.rolesService.isPharmacistRole(r.role));
        const hasProfessional = this.selected.some(r => this.rolesService.isProfessionalRole(r.role));
        if (hasProfessional && this.rolesService.isPharmacistRole(role.role)) { return true; }
        if (hasPharmacist && this.rolesService.isProfessionalRole(role.role)) { return true; }
        return false;
    }

    onToggle(role: Role): void {
        if (this.saving) { return; }
        if (this.isSelected(role)) {
            this.selectedChange.emit(this.selected.filter(selected => selected.role !== role.role));
            return;
        }
        if (this.isDisabled(role)) {
            this.conflict.emit(role);
            return;
        }
        this.selectedChange.emit([...this.selected, role]);
    }
}
