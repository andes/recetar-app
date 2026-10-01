import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { User } from '@interfaces/users';
import { Role, RolesService } from '@services/roles.service';
import { NotificationService } from '@shared/services/notification.service';
import { ToggleOption } from '@shared/ui/toggle.component';

export interface AuditUserSavePayload {
    _id: string;
    businessName: string;
    username: string;
    email: string;
    roles: Array<{ _id: string; role: string }>;
    isActive: boolean;
}

interface UserSnapshot {
    businessName: string;
    username: string;
    email: string;
    isActive: boolean;
    roleIds: string;
}

@Component({
    selector: 'app-audit-user-detail-panel',
    standalone: false,
    templateUrl: './audit-user-detail-panel.component.html',
    styleUrls: ['./audit-user-detail-panel.component.sass']
})
export class AuditUserDetailPanelComponent implements OnChanges, OnDestroy {
    @Input() user: User | null = null;
    @Input() roles: Role[] = [];
    @Input() saving = false;

    @Output() save = new EventEmitter<AuditUserSavePayload>();
    @Output() formStateChange = new EventEmitter<{ canSave: boolean }>();

    form: FormGroup;
    readonly statusOptions: ToggleOption[] = [
        { value: 'active', label: 'Activo', icon: 'check_circle', color: 'success' },
        { value: 'inactive', label: 'Inactivo', icon: 'block', color: 'error' }
    ];

    private snapshot: UserSnapshot | null = null;
    private formSubs: Subscription[] = [];
    serverErrors: Record<string, string> = {};

    constructor(
        private fb: FormBuilder,
        private rolesService: RolesService,
        private notificationService: NotificationService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['user']) {
            this.buildForm();
            return;
        }
        if (changes['roles'] && this.form) {
            this.syncRoleObjects();
        }
    }

    ngOnDestroy(): void {
        this.unsubscribeFormSubs();
    }

    setServerErrors(errors: Record<string, string>): void {
        this.serverErrors = { ...errors };
        Object.keys(errors).forEach(field => {
            this.form?.get(field)?.markAsTouched();
        });
    }

    get canSave(): boolean {
        if (!this.form || this.saving || this.form.invalid) { return false; }
        return this.computeHasChanges();
    }

    get statusValue(): string {
        return this.form?.get('isActive')?.value ? 'active' : 'inactive';
    }

    onRolesChange(roles: Role[]): void {
        this.rolesControl?.setValue(roles);
    }

    onRoleConflict(): void {
        const hasPharmacist = this.selectedRoles.some(r => this.rolesService.isPharmacistRole(r.role));
        const conflict = hasPharmacist ? 'farmacéutico' : 'profesional';
        this.notificationService.warning(
            `No se puede seleccionar un rol incompatible con el rol ${conflict} ya seleccionado.`
        );
    }

    onStatusChange(value: string): void {
        if (this.saving) { return; }
        this.form.get('isActive')?.setValue(value === 'active');
    }

    showError(field: string): boolean {
        if (this.serverErrors[field]) { return true; }
        const control = this.form?.get(field);
        return !!control && control.invalid && (control.touched || control.dirty);
    }

    getError(field: string): string {
        if (this.serverErrors[field]) { return this.serverErrors[field]; }
        const control = this.form?.get(field);
        if (!control?.errors) { return ''; }
        if (control.errors['required']) { return 'Este campo es obligatorio'; }
        if (control.errors['email']) { return 'Ingrese un email válido'; }
        if (control.errors['minlength']) {
            return `Debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
        }
        return 'Valor inválido';
    }

    submit(): void {
        if (!this.user) { return; }
        if (!this.canSave) {
            Object.values(this.form.controls).forEach(control => control.markAsTouched());
            return;
        }
        const value = this.form.getRawValue();
        this.save.emit({
            _id: this.user._id,
            businessName: (value.businessName || '').trim(),
            username: (value.username || '').trim(),
            email: (value.email || '').trim(),
            roles: (value.roles as Role[]).map(role => ({ _id: role._id || '', role: role.role })),
            isActive: !!value.isActive
        });
    }

    private get rolesControl() {
        return this.form?.get('roles');
    }

    get selectedRoles(): Role[] {
        return (this.rolesControl?.value as Role[]) || [];
    }

    private buildForm(): void {
        this.unsubscribeFormSubs();
        this.serverErrors = {};
        this.form = this.fb.group({
            businessName: [this.user?.businessName || '', [Validators.required, Validators.minLength(2)]],
            username: [this.user?.username || '', [Validators.minLength(3)]],
            email: [this.user?.email || '', [Validators.required, Validators.email]],
            roles: [this.currentRoles(), [Validators.required]],
            isActive: [this.user?.isActive ?? true]
        });
        this.snapshot = this.toSnapshot(this.form.getRawValue());
        this.formSubs.push(this.form.valueChanges.subscribe(() => this.emitState()));
        Object.keys(this.form.controls).forEach(field => {
            const subscription = this.form.get(field)?.valueChanges.subscribe(() => {
                delete this.serverErrors[field];
            });
            if (subscription) {
                this.formSubs.push(subscription);
            }
        });
    }

    private unsubscribeFormSubs(): void {
        this.formSubs.forEach(subscription => subscription.unsubscribe());
        this.formSubs = [];
    }

    private currentRoles(): Role[] {
        return (this.user?.roles || []).map(userRole =>
            this.findRole(userRole.role) || ({ _id: userRole._id, role: userRole.role } as Role)
        );
    }

    private syncRoleObjects(): void {
        const currentKeys = this.selectedRoles.map(role => role.role);
        if (currentKeys.length) {
            this.rolesControl?.setValue(
                currentKeys.map(key => this.findRole(key) || ({ role: key } as Role)),
                { emitEvent: false }
            );
        }
    }

    private findRole(roleKey: string): Role | undefined {
        return this.roles.find(role => role.role === roleKey);
    }

    private toSnapshot(value: Record<string, unknown>): UserSnapshot {
        return {
            businessName: String(value['businessName'] || '').trim(),
            username: String(value['username'] || '').trim(),
            email: String(value['email'] || '').trim(),
            isActive: !!value['isActive'],
            roleIds: ((value['roles'] as Role[]) || []).map(role => role._id || role.role).sort().join(',')
        };
    }

    private computeHasChanges(): boolean {
        if (!this.snapshot) { return false; }
        const current = this.toSnapshot(this.form.getRawValue());
        return current.businessName !== this.snapshot.businessName
            || current.username !== this.snapshot.username
            || current.email !== this.snapshot.email
            || current.isActive !== this.snapshot.isActive
            || current.roleIds !== this.snapshot.roleIds;
    }

    private emitState(): void {
        this.formStateChange.emit({ canSave: this.canSave });
    }
}
