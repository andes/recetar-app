import { Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '@services/users.service';
import { Role, RolesService } from '@services/roles.service';
import { AndesSearchService } from '@services/andes-search.service';
import { Subject, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-user-create',
    templateUrl: './user-create.component.html',
    styleUrls: ['./user-create.component.sass']
})
export class UserCreateComponent implements OnInit, OnDestroy {
    @Output() cancelCreate = new EventEmitter<void>();
    @Output() userCreated = new EventEmitter<void>();

    userForm: FormGroup;
    isLoading = false;
    availableRoleOptions: Role[] = [];
    tempSelectedRoles: Role[] = [];

    private destroy$ = new Subject<void>();
    private cuilSearchSubject = new Subject<string>();
    private usernameSearchSubject = new Subject<string>();
    isValidatingCuil = false;
    cuilValidationMessage = '';
    isCuilValid = false;
    isValidatingUsername = false;
    usernameValidationMessage = '';
    isUsernameValid = false;

    // Datos encontrados
    foundProfessionalData: any = null;
    foundPharmacyData: any = null;
    selectedProfession: any = null;

    constructor(
        private fb: FormBuilder,
        private userService: UserService,
        private rolesService: RolesService,
        private snackBar: MatSnackBar,
        private andesSearchService: AndesSearchService
    ) {
        this.initializeForm();
    }

    ngOnInit(): void {
        this.loadRoles();
        this.setupCuilValidation();
        this.setupDocumentValidation();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initializeForm(): void {
        this.userForm = this.fb.group({
            businessName: ['', [Validators.required, Validators.minLength(2)]],
            username: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            cuil: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
            enrollment: [''],
            roles: [[], [Validators.required]]
        });

        // Suscribirse a cambios en email y roles para manejar la sincronización del username
        this.userForm.get('email')?.valueChanges.subscribe(() => {
            this.updateUsernameBasedOnRoles();
        });

        this.userForm.get('roles')?.valueChanges.subscribe(() => {
            this.updateUsernameBasedOnRoles();
            // Limpiar datos encontrados cuando se cambian los roles
            this.clearFoundData();
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
        // Verificar si falta seleccionar profesión para un usuario profesional
        if (this.isProfessionSelectionMissing()) {
            this.snackBar.open('Debe seleccionar una profesión para crear un usuario profesional', 'Cerrar', {
                duration: 4000,
                panelClass: ['error-snackbar']
            });
            return;
        }

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
                if (fieldName === 'cuil') {
                    return 'CUIL debe tener 11 dígitos';
                }
                return `${this.getFieldDisplayName(fieldName)} tiene un formato inválido`;
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
        // Obtener los roles seleccionados actuales
        const selectedRoles = this.userForm.get('roles')?.value || [];

        // Verificar si hay roles profesionales y de farmacia
        const hasProfessional = selectedRoles.some(role => this.rolesService.isProfessionalRole(role));
        const hasPharmacy = selectedRoles.some(role => this.rolesService.isPharmacistRole(role));

        // Si se selecciona rol de farmacia y hay datos de profesional, limpiar datos de profesional
        if (hasPharmacy && this.foundProfessionalData) {
            this.foundProfessionalData = null;
            this.selectedProfession = null;
            // Limpiar validaciones de username
            this.isUsernameValid = false;
            this.usernameValidationMessage = '';
        }

        // Si se selecciona rol profesional y hay datos de farmacia, limpiar datos de farmacia
        if (hasProfessional && this.foundPharmacyData) {
            this.foundPharmacyData = null;
            // Limpiar validaciones de CUIL
            this.isCuilValid = false;
            this.cuilValidationMessage = '';
        }

        // Limpiar campos del formulario al cambiar de rol sin marcar errores visuales
        this.resetControls(['cuil', 'username', 'email', 'password']);

        // Re-habilitar todos los campos cuando se cambian los roles
        this.enableAllFormFields();
    }

    // Métodos para manejar el campo username
    isUsernameDisabled(): boolean {
        const selectedRoles = this.userForm.get('roles')?.value || [];
        const hasProfessional = selectedRoles.some(role => this.rolesService.isProfessionalRole(role));
        return !hasProfessional; // Deshabilitar cuando no es profesional
    }

    private updateUsernameBasedOnRoles(): void {
        const isDisabled = this.isUsernameDisabled();
        const usernameControl = this.userForm.get('username');

        if (isDisabled) {
            // Si está deshabilitado, sincronizar con email cuando hay valor, y luego deshabilitar
            const email = this.userForm.get('email')?.value;
            if (email) {
                const username = email.split('@')[0];
                usernameControl?.setValue(username);
            }
            usernameControl?.disable();
        } else {
            // Si no está deshabilitado, habilitar el control
            usernameControl?.enable();
        }
    }

    // Métodos para campos condicionales
    hasSelectedRoles(): boolean {
        const selectedRoles = this.userForm.get('roles')?.value || [];
        return selectedRoles.length > 0;
    }

    hasProfessionalRole(): boolean {
        const selectedRoles = this.userForm.get('roles')?.value || [];
        return selectedRoles.some(role => this.rolesService.isProfessionalRole(role));
    }

    hasPharmacyRole(): boolean {
        const selectedRoles = this.userForm.get('roles')?.value || [];
        return selectedRoles.some(role => this.rolesService.isPharmacistRole(role));
    }

    onUsernameChange(event: any): void {
        const username = event.target.value;
        this.usernameSearchSubject.next(username);
    }

    private setupCuilValidation(): void {
        this.cuilSearchSubject.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            takeUntil(this.destroy$),
            switchMap(cuil => {
                if (!cuil || cuil.length < 11) {
                    this.isValidatingCuil = false;
                    this.cuilValidationMessage = '';
                    this.isCuilValid = false;
                    return of(null);
                }

                this.isValidatingCuil = true;
                this.cuilValidationMessage = 'Buscando en Andes...';

                // Obtener roles seleccionados
                const selectedRoles = this.userForm.get('roles')?.value || [];
                const selectedRoleObjects = selectedRoles.map(roleKey =>
                    this.availableRoleOptions.find(r => r.role === roleKey)
                ).filter(Boolean);

                const hasPharmacist = selectedRoleObjects.some(r => this.rolesService.isPharmacistRole(r.role));

                // Crear objeto para forkJoin basado en roles seleccionados
                const searchQueries: any = {};

                // Solo buscar en farmacias si hay roles de farmacia seleccionados
                if (hasPharmacist) {
                    searchQueries.pharmacyData = this.andesSearchService.searchPharmacy(cuil);
                }

                // Si no hay consultas que hacer, retornar null
                if (Object.keys(searchQueries).length === 0) {
                    this.isValidatingCuil = false;
                    this.cuilValidationMessage = 'Seleccione un rol de farmacia para buscar por CUIL';
                    this.isCuilValid = false;
                    return of(null);
                }

                return forkJoin(searchQueries);
            })
        ).subscribe({
            next: (result: any) => {
                this.isValidatingCuil = false;
                if (result === null) {
                    // No se realizó búsqueda
                    return;
                }

                // Verificar si se encontraron datos en farmacias
                const hasPharmacyData = result.pharmacyData && result.pharmacyData.ok &&
                    result.pharmacyData.data && result.pharmacyData.data.length > 0;

                if (hasPharmacyData) {
                    this.isCuilValid = true;
                    this.cuilValidationMessage = 'Farmacia encontrada en Andes';
                    this.autocompleteFields(result.pharmacyData.data[0]);
                } else {
                    this.isCuilValid = false;
                    this.cuilValidationMessage = 'No se encontró la farmacia en Andes';
                }
            },
            error: (error) => {
                this.isValidatingCuil = false;
                this.isCuilValid = false;
                this.cuilValidationMessage = 'Error al buscar en Andes';
            }
        });

        // Suscribirse a cambios en el campo cuil
        this.userForm.get('cuil')?.valueChanges.pipe(
            takeUntil(this.destroy$)
        ).subscribe(value => {
            if (typeof value === 'string') {
                this.cuilSearchSubject.next(value);
            }
        });


    }

    private autocompleteFields(data: any): void {
        if (data) {
            // Determinar si es un profesional o farmacia
            const isProfessional = data.nombre && data.apellido;
            const isPharmacy = data.denominacion || data.razonSocial;

            if (isProfessional) {
                // Almacenar datos del profesional
                this.foundProfessionalData = data;

                // Autocompletar nombre completo del profesional
                if (!this.userForm.get('businessName')?.value) {
                    this.userForm.get('businessName')?.setValue(`${data.nombre} ${data.apellido}`);
                }

                // Autocompletar CUIT si está disponible
                if (data.cuit && !this.userForm.get('cuil')?.value) {
                    this.userForm.get('cuil')?.setValue(data.cuit);
                }

                // Deshabilitar campos excepto email
                this.userForm.get('businessName')?.disable();
                this.userForm.get('username')?.disable();
                this.userForm.get('cuil')?.disable();
                this.userForm.get('enrollment')?.disable();

            } else if (isPharmacy) {
                // Almacenar datos de la farmacia
                this.foundPharmacyData = data;

                // Autocompletar nombre de la farmacia
                const pharmacyName = data.denominacion || data.razonSocial;
                if (pharmacyName && !this.userForm.get('businessName')?.value) {
                    this.userForm.get('businessName')?.setValue(pharmacyName);
                }

                // Autocompletar matrícula del DT responsable
                if (data.matriculaDTResponsable && !this.userForm.get('enrollment')?.value) {
                    this.userForm.get('enrollment')?.setValue(data.matriculaDTResponsable);
                }

                // Deshabilitar campos excepto email
                this.userForm.get('businessName')?.disable();
                this.userForm.get('cuil')?.disable();
                this.userForm.get('enrollment')?.disable();
            }
        }
    }

    private setupDocumentValidation(): void {
        this.usernameSearchSubject.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            takeUntil(this.destroy$),
            switchMap(documento => {
                // Validar que el documento tenga al menos 7-8 dígitos (DNI argentino)
                if (!documento || documento.length < 7 || !/^\d+$/.test(documento)) {
                    this.isValidatingUsername = false;
                    this.usernameValidationMessage = '';
                    this.isUsernameValid = false;
                    return of(null);
                }

                this.isValidatingUsername = true;
                this.usernameValidationMessage = 'Buscando profesional en Andes...';

                return this.andesSearchService.searchProfessional(documento);
            })
        ).subscribe({
            next: (result) => {
                this.isValidatingUsername = false;

                if (result && result.ok && result.data && Array.isArray(result.data) && result.data.length > 0) {
                    this.isUsernameValid = true;
                    this.usernameValidationMessage = 'Profesional encontrado en Andes';
                    // Tomar el primer profesional encontrado
                    this.autocompleteFields(result.data[0]);
                } else {
                    this.isUsernameValid = false;
                    this.usernameValidationMessage = result?.message || 'No se encontró el profesional en Andes';
                }
            },
            error: () => {
                this.isValidatingUsername = false;
                this.isUsernameValid = false;
                this.usernameValidationMessage = 'Error al buscar en Andes';
            }
        });

        // Suscribirse a cambios en el campo username (que actúa como documento)
        this.userForm.get('username')?.valueChanges.pipe(
            takeUntil(this.destroy$)
        ).subscribe(value => {
            if (typeof value === 'string') {
                this.usernameSearchSubject.next(value);
            }
        });
    }

    onCuilChange(event: any): void {
        const value = event.target.value;
        this.cuilSearchSubject.next(value);
    }

    // Métodos para manejar datos encontrados
    hasProfessionalData(): boolean {
        return this.foundProfessionalData !== null;
    }

    hasPharmacyData(): boolean {
        return this.foundPharmacyData !== null;
    }

    compareProfessions(p1: any, p2: any): boolean {
        return p1 && p2 ? p1.profesion?.nombre === p2.profesion?.nombre : p1 === p2;
    }

    onProfessionSelect(profession: any): void {
        this.selectedProfession = profession;

        // Buscar la matrícula más reciente y vigente de esta profesión
        let latestMatricula = '';
        let latestEndDate = new Date(0);

        if (profession.matriculacion && Array.isArray(profession.matriculacion)) {
            profession.matriculacion.forEach((mat: any) => {
                if (mat.matriculaNumero && mat.fin) {
                    const endDate = new Date(mat.fin);
                    // Verificar que la matrícula esté vigente y sea la más reciente
                    if (endDate > new Date() && endDate > latestEndDate) {
                        latestMatricula = mat.matriculaNumero;
                        latestEndDate = endDate;
                    }
                }
            });
        }

        // Actualizar el campo de matrícula
        if (latestMatricula) {
            this.userForm.get('enrollment')?.setValue(latestMatricula);
        }
    }

    getProfessionStatus(profession: any): string {
        if (!profession.matriculacion || !Array.isArray(profession.matriculacion)) {
            return 'Sin información';
        }

        const now = new Date();
        let hasValidMatricula = false;

        profession.matriculacion.forEach((mat: any) => {
            if (mat.fin) {
                const endDate = new Date(mat.fin);
                if (endDate > now) {
                    hasValidMatricula = true;
                }
            }
        });

        return hasValidMatricula ? 'Vigente' : 'Vencida';
    }

    getProfessionMatricula(profession: any): string {
        if (!profession.matriculacion || !Array.isArray(profession.matriculacion)) {
            return 'N/A';
        }

        let latestMatricula = '';
        let latestEndDate = new Date(0);

        profession.matriculacion.forEach((mat: any) => {
            if (mat.matriculaNumero && mat.fin) {
                const endDate = new Date(mat.fin);
                if (endDate > latestEndDate) {
                    latestMatricula = mat.matriculaNumero;
                    latestEndDate = endDate;
                }
            }
        });

        return latestMatricula || 'N/A';
    }

    clearFoundData(): void {
        this.foundProfessionalData = null;
        this.foundPharmacyData = null;
        this.selectedProfession = null;
        // Limpiar el campo documento (username)
        this.userForm.get('username')?.setValue('');
        this.userForm.get('username')?.enable();
        this.userForm.get('username')?.setErrors(null);
        // Limpiar el campo CUIL
        this.userForm.get('cuil')?.setValue('');
        this.userForm.get('cuil')?.enable();
        this.userForm.get('cuil')?.setErrors(null);
    }

    isProfessionSelectionMissing(): boolean {
        return this.hasProfessionalRole() &&
            this.foundProfessionalData &&
            this.foundProfessionalData.profesiones &&
            this.foundProfessionalData.profesiones.length > 0 &&
            !this.selectedProfession;
    }

    private enableAllFormFields(): void {
        // Rehabilitar todos los campos excepto email
        Object.keys(this.userForm.controls).forEach(key => {
            if (key !== 'email') {
                this.userForm.get(key)?.enable();
            }
        });

        // Configurar habilitación y validadores según roles seleccionados
        const hasPro = this.hasProfessionalRole();
        const hasPharma = this.hasPharmacyRole();

        // Email y Password siempre habilitados
        this.userForm.get('email')?.enable();
        this.userForm.get('password')?.enable();

        // Username: requerido solo para profesional
        const username = this.userForm.get('username');
        username?.clearValidators();
        if (hasPro) {
            username?.setValidators([Validators.required, Validators.minLength(3)]);
            username?.enable();
        } else {
            username?.disable();
            username?.reset('', { emitEvent: false });
        }
        username?.updateValueAndValidity({ onlySelf: true, emitEvent: false });

        // CUIL: requerido solo para farmacia
        const cuil = this.userForm.get('cuil');
        cuil?.clearValidators();
        if (hasPharma) {
            cuil?.setValidators([Validators.required, Validators.pattern(/^\d{11}$/)]);
            cuil?.enable();
        } else {
            cuil?.disable();
            cuil?.reset('', { emitEvent: false });
        }
        cuil?.updateValueAndValidity({ onlySelf: true, emitEvent: false });

        // Roles siempre habilitado
        this.userForm.get('roles')?.enable();

        // Configurar validación para businessName según los roles seleccionados
        const businessName = this.userForm.get('businessName');
        businessName?.enable();
        businessName?.clearValidators();
        if (!hasPro && !hasPharma) {
            businessName?.setValidators([Validators.required, Validators.minLength(2)]);
        } else {
            businessName?.setValidators([Validators.minLength(2)]);
        }
        businessName?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    }

    private resetControls(controlNames: string[]): void {
        controlNames.forEach(name => {
            const control = this.userForm.get(name);
            if (control) {
                control.reset('', { emitEvent: false });
                control.markAsPristine();
                control.markAsUntouched();
                control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
            }
        });
    }
}
