import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '@services/users.service';
import { Role, RolesService } from '@services/roles.service';

@Component({
    selector: 'app-user-create',
    templateUrl: './user-create.component.html',
    styleUrls: ['./user-create.component.sass']
})
export class UserCreateComponent implements OnInit {
    @Output() cancelCreate = new EventEmitter<void>();
    @Output() userCreated = new EventEmitter<void>();

    userForm: FormGroup;
    isLoading = false;
    availableRoleOptions: Role[] = [];
    tempSelectedRoles: Role[] = [];

    constructor(
        private fb: FormBuilder,
        private userService: UserService,
        private rolesService: RolesService,
        private snackBar: MatSnackBar
    ) {
        this.initializeForm();
    }

    ngOnInit(): void {
        this.loadRoles();
    }

    private initializeForm(): void {
        this.userForm = this.fb.group({
            businessName: ['', [Validators.required, Validators.minLength(2)]],
            username: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            cuil: ['', [Validators.pattern(/^\d{11}$/)]],
            enrollment: [''],
            roles: [[], [Validators.required]]
        });

        // Suscribirse a cambios en email y roles para manejar la sincronización del username
        this.userForm.get('email')?.valueChanges.subscribe(() => {
            this.updateUsernameBasedOnRoles();
        });

        this.userForm.get('roles')?.valueChanges.subscribe(() => {
            this.updateUsernameBasedOnRoles();
        });
    }

    private loadRoles(): void {
        this.rolesService.getFilteredRoleTypes().subscribe({
            next: (roles: Role[]) => {
                this.availableRoleOptions = roles;
            },
            error: () => {
                this.snackBar.open('Error al cargar los roles', 'Cerrar', {
                    duration: 3000,
                    panelClass: ['error-snackbar']
                });
            }
        });
    }

    onCancel(): void {
    // Reset the form to its initial state
        this.userForm.reset();
        this.initializeForm();
        this.cancelCreate.emit();
    }

    onSave(): void {
        if (this.userForm.valid) {
            this.isLoading = true;

            const formData = this.userForm.getRawValue(); // getRawValue incluye controles deshabilitados
            const userData = {
                businessName: formData.businessName,
                username: formData.username,
                email: formData.email,
                password: formData.password,
                cuil: formData.cuil || '',
                enrollment: formData.enrollment || '',
                roles: formData.roles.map(roleKey => {
                    const roleObject = this.availableRoleOptions.find(r => r.role === roleKey);
                    return {
                        _id: roleObject?._id,
                        role: roleKey
                    };
                })
            };

            this.userService.createUser(userData).subscribe({
                next: () => {
                    this.snackBar.open('Usuario creado exitosamente', 'Cerrar', {
                        duration: 3000,
                        panelClass: ['success-snackbar']
                    });
                    this.userCreated.emit();
                    this.isLoading = false;
                },
                error: (error) => {
                    this.isLoading = false;

                    let errorMessage = 'Error al crear el usuario';

                    if (typeof error === 'string') {
                        errorMessage = error;
                    } else if (error.error && typeof error.error === 'string') {
                        errorMessage = error.error;
                    }

                    this.snackBar.open(errorMessage, 'Cerrar', {
                        duration: 5000,
                        panelClass: ['error-snackbar']
                    });
                }
            });
        } else {
            this.markFormGroupTouched();
            this.snackBar.open('Por favor, complete todos los campos obligatorios', 'Cerrar', {
                duration: 3000
            });
        }
    }

    private markFormGroupTouched(): void {
        Object.keys(this.userForm.controls).forEach(key => {
            const control = this.userForm.get(key);
            control?.markAsTouched();
        });
    }

    getFieldError(fieldName: string): string {
        const control = this.userForm.get(fieldName);
        if (control?.errors && control.touched) {
            if (control.errors['required']) {
                return `${this.getFieldDisplayName(fieldName)} es obligatorio`;
            }
            if (control.errors['email']) {
                return 'Ingrese un email válido';
            }
            if (control.errors['minlength']) {
                return `${this.getFieldDisplayName(fieldName)} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
            }
            if (control.errors['pattern']) {
                return 'CUIL debe tener 11 dígitos';
            }
        }
        return '';
    }

    private getFieldDisplayName(fieldName: string): string {
        const displayNames = {
            'businessName': 'Nombre',
            'username': 'Nombre de usuario',
            'email': 'Email',
            'password': 'Contraseña',
            'cuil': 'CUIL',
            'enrollment': 'Matrícula',
            'roles': 'Roles'
        };
        return displayNames[fieldName] || fieldName;
    }

    isFieldInvalid(fieldName: string): boolean {
        const control = this.userForm.get(fieldName);
        return !!(control?.invalid && control.touched);
    }

    translateRole(role: string): string {
        return this.rolesService.getRoleDisplayName(role);
    }

    getRoleColor(role: string): string {
        return this.rolesService.getRoleColor(role);
    }

    getRoleIcon(role: string): string {
        const iconMap = {
            'admin': 'admin_panel_settings',
            'pharmacist': 'local_pharmacy',
            'auditor': 'fact_check',
            'professional': 'medical_services'
        };
        return iconMap[role] || 'person';
    }

    // Métodos para restricciones de roles
    isRoleDisabled(role: Role): boolean {
        const currentSelectedRoles = this.userForm.get('roles')?.value || [];
        const selectedRoleObjects = currentSelectedRoles.map(roleKey =>
            this.availableRoleOptions.find(r => r.role === roleKey)
        ).filter(Boolean);

        const hasPharmacist = selectedRoleObjects.some(r => this.rolesService.isPharmacistRole(r.role));
        const hasProfessional = selectedRoleObjects.some(r => this.rolesService.isProfessionalRole(r.role));

        const roleIsPharmacist = this.rolesService.isPharmacistRole(role.role);
        const roleIsProfessional = this.rolesService.isProfessionalRole(role.role);

        if (hasProfessional && roleIsPharmacist) {
            return true;
        }

        if (hasPharmacist && roleIsProfessional) {
            return true;
        }

        return false;
    }

    onRoleOptionClick(event: Event, clickedRole: Role): void {
        const currentSelectedRoles = this.userForm.get('roles')?.value || [];
        const isCurrentlySelected = currentSelectedRoles.includes(clickedRole.role);

        if (isCurrentlySelected) {
            return;
        }

        const selectedRoleObjects = currentSelectedRoles.map(roleKey =>
            this.availableRoleOptions.find(r => r.role === roleKey)
        ).filter(Boolean);

        const hasPharmacist = selectedRoleObjects.some(role => this.rolesService.isPharmacistRole(role.role));
        const hasProfessional = selectedRoleObjects.some(role => this.rolesService.isProfessionalRole(role.role));

        const clickedIsPharmacist = this.rolesService.isPharmacistRole(clickedRole.role);
        const clickedIsProfessional = this.rolesService.isProfessionalRole(clickedRole.role);

        if ((hasPharmacist && clickedIsProfessional) || (hasProfessional && clickedIsPharmacist)) {
            event.preventDefault();
            event.stopPropagation();

            const conflictType = hasPharmacist ? 'farmacéutico' : 'profesional';
            const clickedType = clickedIsPharmacist ? 'farmacéutico' : 'profesional';

            this.snackBar.open(
                `No se puede seleccionar un rol ${clickedType} cuando ya hay un rol ${conflictType} seleccionado. Primero deselecciona el rol ${conflictType}.`,
                'Cerrar',
                { duration: 4000 }
            );
        }
    }

    getAvailableRoleOptions(): Role[] {
        // Devolver todas las opciones disponibles sin filtrar
        // La lógica de deshabilitación se maneja en isRoleDisabled()
        return this.availableRoleOptions;
    }

    onRoleSelectionChange(event: any): void {
        // Este método se puede usar para manejar cambios adicionales si es necesario
        // Por ahora, el FormControl maneja automáticamente los cambios
    }

    // Métodos para manejar el campo username
    isUsernameDisabled(): boolean {
        const selectedRoles = this.userForm.get('roles')?.value || [];
        return selectedRoles.some(role => this.rolesService.isPharmacistRole(role));
    }

    private updateUsernameBasedOnRoles(): void {
        const isDisabled = this.isUsernameDisabled();
        const usernameControl = this.userForm.get('username');
        const emailControl = this.userForm.get('email');

        if (isDisabled) {
            // Deshabilitar el control y sincronizar con email si existe
            usernameControl?.disable();
            if (emailControl?.value) {
                usernameControl?.setValue(emailControl.value);
            }
        } else {
            // Habilitar el control
            usernameControl?.enable();
        }
    }


}
