import { Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { UserService } from '@services/users.service';
import { Role, RolesService } from '@services/roles.service';
import { AndesApiResponse, AndesPharmacyData, AndesProfessionalData, AndesSearchService } from '@services/andes-search.service';
import { NotificationService } from '@shared/services/notification.service';
import { Subject, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, catchError } from 'rxjs/operators';

type AndesProfessionalProfession = AndesProfessionalData['profesiones'][number];
type AndesMatriculacion = AndesProfessionalProfession['matriculacion'][number];

interface ProfesionGradoEntry {
    profesion: string;
    codigoProfesion: string;
    numeroMatricula: string;
}

interface CreateUserPayload {
    businessName: string;
    username: string;
    email: string;
    password: string;
    cuil: string;
    enrollment: string;
    responsibleDTEnrollment: string;
    authorizationDisposition: string;
    authorizationExpiration: string | null;
    roles: Array<{ _id?: string; role: string }>;
    idAndes?: string;
    profesionGrado?: ProfesionGradoEntry[];
}

interface CuilSearchResult {
    pharmacyData: AndesApiResponse<AndesPharmacyData>;
}

interface SearchErrorResult {
    error: true;
}

function isSearchErrorResult(value: unknown): value is SearchErrorResult {
    return typeof value === 'object' && value !== null && 'error' in value;
}

function isCuilSearchResult(value: unknown): value is CuilSearchResult {
    return typeof value === 'object' && value !== null && 'pharmacyData' in value;
}

@Component({
    selector: 'app-user-create',
    standalone: false,
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

    foundProfessionalData: AndesProfessionalData | null = null;
    foundPharmacyData: AndesPharmacyData | null = null;

    constructor(
        private fb: FormBuilder,
        private userService: UserService,
        private rolesService: RolesService,
        private notificationService: NotificationService,
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
            cuil: ['', [Validators.required, Validators.pattern(/^\d{2}-?\d{8}-?\d{1}$|^\d{11}$/)]],
            enrollment: [''],
            disposicionHabilitacion: [''],
            vencimientoHabilitacion: [''],
            roles: [[], [Validators.required]]
        });

        this.userForm.get('email')?.valueChanges.subscribe(() => {
            this.updateUsernameBasedOnRoles();
        });

        this.userForm.get('roles')?.valueChanges.subscribe(() => {
            this.updateUsernameBasedOnRoles();
            this.clearFoundData();
        });
    }

    private loadRoles(): void {
        this.rolesService.getFilteredRoleTypes().subscribe({
            next: (roles: Role[]) => {
                this.availableRoleOptions = roles;
            },
            error: () => {
                this.notificationService.error('Error al cargar los roles');
            }
        });
    }

    onCancel(): void {
        this.userForm.reset();
        this.initializeForm();
        this.cancelCreate.emit();
    }

    onSave(): void {
        if (this.userForm.valid) {
            this.isLoading = true;

            const formData = this.userForm.getRawValue();
            const userData: CreateUserPayload = {
                businessName: formData.businessName,
                username: formData.username,
                email: formData.email,
                password: formData.password,
                cuil: (formData.cuil || '').replace(/-/g, ''),
                enrollment: formData.enrollment || '',
                responsibleDTEnrollment: formData.enrollment || '',
                authorizationDisposition: formData.disposicionHabilitacion || '',
                authorizationExpiration: formData.vencimientoHabilitacion || null,
                roles: formData.roles.map((roleKey: string) => {
                    const roleObject = this.availableRoleOptions.find(r => r.role === roleKey);
                    return {
                        _id: roleObject?._id,
                        role: roleKey
                    };
                })
            };

            if (this.foundPharmacyData) {
                userData.idAndes = this.foundPharmacyData.id || this.foundPharmacyData._id || '';
            } else if (this.foundProfessionalData) {
                userData.idAndes = this.foundProfessionalData.id || this.foundProfessionalData._id || '';
            }

            if (this.foundProfessionalData && this.foundProfessionalData.profesiones?.length > 0) {
                const profesionGrado = this.foundProfessionalData.profesiones
                    .flatMap((p: AndesProfessionalProfession) => {
                        if (p.matriculacion && Array.isArray(p.matriculacion)) {
                            const uniqueMatriculas = Array.from(new Set(
                                p.matriculacion
                                    .filter((mat: AndesMatriculacion) => mat.matriculaNumero != null)
                                    .map((mat: AndesMatriculacion) => mat.matriculaNumero.toString())
                            ));

                            return uniqueMatriculas.map((matricula: string): ProfesionGradoEntry => ({
                                profesion: p.profesion?.nombre || '',
                                codigoProfesion: p.profesion?.codigo?.toString() || '',
                                numeroMatricula: matricula
                            }));
                        }
                        return [];
                    })
                    .filter((p: ProfesionGradoEntry) => p.profesion && p.codigoProfesion && p.numeroMatricula);

                if (profesionGrado.length > 0) {
                    userData.profesionGrado = profesionGrado;
                }
            }

            if (this.hasOnlyAuditorRole()) {
                userData.businessName = formData.username;
            }

            this.userService.createUser(userData).subscribe({
                next: () => {
                    this.notificationService.success('Usuario creado exitosamente');
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

                    this.notificationService.error(errorMessage);
                }
            });
        } else {
            this.markFormGroupTouched();
            this.notificationService.warning('Por favor, complete todos los campos obligatorios');
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
        const displayNames: Record<string, string> = {
            'businessName': 'Nombre',
            'username': 'Nombre de usuario',
            'email': 'Email',
            'password': 'Contraseña',
            'cuil': 'CUIL',
            'enrollment': 'Matrícula',
            'disposicionHabilitacion': 'N° Disposición de habilitación',
            'vencimientoHabilitacion': 'Fecha vencimiento de habilitación',
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
        const iconMap: Record<string, string> = {
            'admin': 'admin_panel_settings',
            'pharmacist': 'local_pharmacy',
            'auditor': 'fact_check',
            'professional': 'medical_services'
        };
        return iconMap[role] || 'person';
    }

    isRoleDisabled(role: Role): boolean {
        const currentSelectedRoles = this.userForm.get('roles')?.value || [];
        const selectedRoleObjects = currentSelectedRoles.map((roleKey: string) =>
            this.availableRoleOptions.find(r => r.role === roleKey)
        ).filter(Boolean);

        const hasPharmacist = selectedRoleObjects.some((r: Role) => this.rolesService.isPharmacistRole(r.role));
        const hasProfessional = selectedRoleObjects.some((r: Role) => this.rolesService.isProfessionalRole(r.role));

        const roleIsPharmacist = this.rolesService.isPharmacistRole(role.role);
        const roleIsProfessional = this.rolesService.isProfessionalRole(role.role);

        if (hasProfessional && roleIsPharmacist) { return true; }
        if (hasPharmacist && roleIsProfessional) { return true; }
        return false;
    }

    onRoleOptionClick(event: Event, clickedRole: Role): void {
        const currentSelectedRoles = this.userForm.get('roles')?.value || [];
        const isCurrentlySelected = currentSelectedRoles.includes(clickedRole.role);

        if (isCurrentlySelected) { return; }

        const selectedRoleObjects = currentSelectedRoles.map((roleKey: string) =>
            this.availableRoleOptions.find(r => r.role === roleKey)
        ).filter(Boolean);

        const hasPharmacist = selectedRoleObjects.some((role: Role) => this.rolesService.isPharmacistRole(role.role));
        const hasProfessional = selectedRoleObjects.some((role: Role) => this.rolesService.isProfessionalRole(role.role));

        const clickedIsPharmacist = this.rolesService.isPharmacistRole(clickedRole.role);
        const clickedIsProfessional = this.rolesService.isProfessionalRole(clickedRole.role);

        if ((hasPharmacist && clickedIsProfessional) || (hasProfessional && clickedIsPharmacist)) {
            event.preventDefault();
            event.stopPropagation();

            const conflictType = hasPharmacist ? 'farmacéutico' : 'profesional';
            const clickedType = clickedIsPharmacist ? 'farmacéutico' : 'profesional';

            this.notificationService.warning(
                `No se puede seleccionar un rol ${clickedType} cuando ya hay un rol ${conflictType} seleccionado.`
            );
        }
    }

    getAvailableRoleOptions(): Role[] {
        return this.availableRoleOptions;
    }

    onRoleSelectionChange(_event: MatSelectChange): void {
        const selectedRoles = this.userForm.get('roles')?.value || [];

        const hasProfessional = selectedRoles.some((role: string) => this.rolesService.isProfessionalRole(role));
        const hasPharmacy = selectedRoles.some((role: string) => this.rolesService.isPharmacistRole(role));

        if (hasPharmacy && this.foundProfessionalData) {
            this.foundProfessionalData = null;
            this.isUsernameValid = false;
            this.usernameValidationMessage = '';
        }

        if (hasProfessional && this.foundPharmacyData) {
            this.foundPharmacyData = null;
            this.isCuilValid = false;
            this.cuilValidationMessage = '';
        }

        this.resetControls(['cuil', 'username', 'email', 'password', 'disposicionHabilitacion', 'vencimientoHabilitacion', 'enrollment']);
        this.enableAllFormFields();
    }

    isUsernameDisabled(): boolean {
        return !this.hasProfessionalRole() && !this.hasOnlyAuditorRole();
    }

    private updateUsernameBasedOnRoles(): void {
        const usernameControl = this.userForm.get('username');

        if (this.hasProfessionalData()) {
            usernameControl?.disable();
            return;
        }

        const isDisabled = this.isUsernameDisabled();

        if (isDisabled) {
            const email = this.userForm.get('email')?.value;
            if (email) {
                const username = email.split('@')[0];
                usernameControl?.setValue(username);
            }
            usernameControl?.disable();
        } else {
            usernameControl?.enable();
        }
    }

    hasSelectedRoles(): boolean {
        const selectedRoles = this.userForm.get('roles')?.value || [];
        return selectedRoles.length > 0;
    }

    hasProfessionalRole(): boolean {
        const selectedRoles = this.userForm.get('roles')?.value || [];
        return selectedRoles.some((role: string) => this.rolesService.isProfessionalRole(role));
    }

    hasPharmacyRole(): boolean {
        const selectedRoles = this.userForm.get('roles')?.value || [];
        return selectedRoles.some((role: string) => this.rolesService.isPharmacistRole(role));
    }

    hasOnlyAuditorRole(): boolean {
        const selectedRoles = this.userForm.get('roles')?.value || [];
        return selectedRoles.length === 1 && selectedRoles[0] === 'auditor';
    }

    onUsernameChange(event: Event): void {
        const target = event.target as HTMLInputElement | null;
        const username = target?.value || '';
        this.usernameSearchSubject.next(username);
    }

    private setupCuilValidation(): void {
        this.cuilSearchSubject.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            takeUntil(this.destroy$),
            switchMap(cuilRaw => {
                const cuil = cuilRaw ? cuilRaw.replace(/-/g, '') : '';
                if (!cuil || cuil.length < 11) {
                    this.isValidatingCuil = false;
                    this.cuilValidationMessage = '';
                    this.isCuilValid = false;
                    return of(null);
                }

                this.isValidatingCuil = true;
                this.cuilValidationMessage = 'Buscando en Andes...';

                const selectedRoles = this.userForm.get('roles')?.value || [];
                const selectedRoleObjects = selectedRoles.map((roleKey: string) =>
                    this.availableRoleOptions.find(r => r.role === roleKey)
                ).filter((role): role is Role => !!role);

                const hasPharmacist = selectedRoleObjects.some(r => this.rolesService.isPharmacistRole(r.role));

                if (!hasPharmacist) {
                    this.isValidatingCuil = false;
                    this.cuilValidationMessage = 'Seleccione un rol de farmacia para buscar por CUIL';
                    this.isCuilValid = false;
                    return of(null);
                }

                return forkJoin({
                    pharmacyData: this.andesSearchService.searchPharmacy(cuil)
                }).pipe(
                    catchError(() => of({ error: true as const }))
                );
            })
        ).subscribe({
            next: (result: CuilSearchResult | SearchErrorResult | null) => {
                this.isValidatingCuil = false;
                if (result === null) { return; }

                if (isSearchErrorResult(result)) {
                    this.isCuilValid = false;
                    this.cuilValidationMessage = 'Error al buscar en Andes';
                    return;
                }

                if (!isCuilSearchResult(result)) {
                    this.isCuilValid = false;
                    this.cuilValidationMessage = 'Error al buscar en Andes';
                    return;
                }

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
            error: () => {
                this.isValidatingCuil = false;
                this.isCuilValid = false;
                this.cuilValidationMessage = 'Error al buscar en Andes';
            }
        });

        this.userForm.get('cuil')?.valueChanges.pipe(
            takeUntil(this.destroy$)
        ).subscribe(value => {
            if (typeof value === 'string') {
                const cleanValue = value.replace(/-/g, '');
                this.cuilSearchSubject.next(cleanValue);
            }
        });
    }

    private isAndesProfessionalData(data: AndesProfessionalData | AndesPharmacyData): data is AndesProfessionalData {
        return 'profesiones' in data;
    }

    private autocompleteFields(data: AndesProfessionalData | AndesPharmacyData): void {
        if (!data) { return; }

        const isProfessional = this.isAndesProfessionalData(data);
        const isPharmacy = !isProfessional;

        if (isProfessional) {
            this.foundProfessionalData = data;

            if (!this.userForm.get('businessName')?.value) {
                this.userForm.get('businessName')?.setValue(`${data.nombre} ${data.apellido}`);
            }

            if (data.cuit && !this.userForm.get('cuil')?.value) {
                this.userForm.get('cuil')?.setValue(this.formatCuilString(data.cuit));
            }

            this.userForm.get('businessName')?.disable();
            this.userForm.get('username')?.disable();
            this.userForm.get('cuil')?.disable();
            this.userForm.get('enrollment')?.disable();

        } else if (isPharmacy) {
            this.foundPharmacyData = data;

            const pharmacyName = data.razonSocial || data.denominacion;
            if (pharmacyName) {
                this.userForm.get('businessName')?.setValue(pharmacyName);
            }

            if (data.cuit) {
                this.userForm.get('cuil')?.setValue(this.formatCuilString(data.cuit));
            }

            if (data.matriculaDTResponsable) {
                this.userForm.get('enrollment')?.setValue(data.matriculaDTResponsable);
            }

            if (data.disposicionHabilitacion) {
                this.userForm.get('disposicionHabilitacion')?.setValue(data.disposicionHabilitacion);
            }
            if (data.vencimientoHabilitacion) {
                this.userForm.get('vencimientoHabilitacion')?.setValue(data.vencimientoHabilitacion);
            }

            this.userForm.get('businessName')?.disable();
            this.userForm.get('cuil')?.disable();
            this.userForm.get('enrollment')?.disable();
            this.userForm.get('disposicionHabilitacion')?.disable();
            this.userForm.get('vencimientoHabilitacion')?.disable();
        }
    }

    private setupDocumentValidation(): void {
        this.usernameSearchSubject.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            takeUntil(this.destroy$),
            switchMap(documento => {
                if (!this.hasProfessionalRole()) {
                    this.isValidatingUsername = false;
                    this.usernameValidationMessage = '';
                    this.isUsernameValid = false;
                    return of(null);
                }

                if (!documento || documento.length < 7 || !/^\d+$/.test(documento)) {
                    this.isValidatingUsername = false;
                    this.usernameValidationMessage = '';
                    this.isUsernameValid = false;
                    return of(null);
                }

                this.isValidatingUsername = true;
                this.usernameValidationMessage = 'Buscando profesional en Andes...';

                return this.andesSearchService.searchProfessional(documento).pipe(
                    catchError(() => of({ error: true as const }))
                );
            })
        ).subscribe({
            next: (result: AndesApiResponse<AndesProfessionalData> | SearchErrorResult | null) => {
                this.isValidatingUsername = false;

                if (result === null) { return; }

                if (isSearchErrorResult(result)) {
                    this.isUsernameValid = false;
                    this.usernameValidationMessage = 'Error al buscar en Andes';
                    return;
                }

                if (result && result.ok && result.data && Array.isArray(result.data) && result.data.length > 0) {
                    this.isUsernameValid = true;
                    this.usernameValidationMessage = 'Profesional encontrado en Andes';
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

        this.userForm.get('username')?.valueChanges.pipe(
            takeUntil(this.destroy$)
        ).subscribe(value => {
            if (typeof value === 'string') {
                this.usernameSearchSubject.next(value);
            }
        });
    }

    onCuilChange(event: Event): void {
        const target = event.target as HTMLInputElement | null;
        const rawValue = target?.value || '';
        const formattedValue = this.formatCuilString(rawValue);

        if (rawValue !== formattedValue) {
            this.userForm.get('cuil')?.setValue(formattedValue, { emitEvent: false });
        }

        const cleanValue = rawValue.replace(/-/g, '');
        this.cuilSearchSubject.next(cleanValue);
    }

    formatCuilString(cuil: string): string {
        if (!cuil) { return ''; }
        const cleanCuil = cuil.replace(/[^\d]/g, '');
        if (cleanCuil.length > 10) {
            return `${cleanCuil.substring(0, 2)}-${cleanCuil.substring(2, 10)}-${cleanCuil.substring(10, 11)}`;
        } else if (cleanCuil.length > 2) {
            return `${cleanCuil.substring(0, 2)}-${cleanCuil.substring(2)}`;
        }
        return cleanCuil;
    }

    hasProfessionalData(): boolean {
        return this.foundProfessionalData !== null;
    }

    hasPharmacyData(): boolean {
        return this.foundPharmacyData !== null;
    }

    getProfessionStatus(profession: AndesProfessionalProfession): string {
        if (!profession.matriculacion || !Array.isArray(profession.matriculacion)) {
            return 'Sin información';
        }

        const now = new Date();
        let hasValidMatricula = false;

        profession.matriculacion.forEach((mat: AndesMatriculacion) => {
            if (mat.fin) {
                const endDate = new Date(mat.fin);
                if (endDate > now) {
                    hasValidMatricula = true;
                }
            }
        });

        return hasValidMatricula ? 'Vigente' : 'Vencida';
    }

    getProfessionMatricula(profession: AndesProfessionalProfession): string {
        if (!profession.matriculacion || !Array.isArray(profession.matriculacion)) {
            return 'N/A';
        }

        let latestMatricula = '';
        let latestEndDate = new Date(0);

        profession.matriculacion.forEach((mat: AndesMatriculacion) => {
            if (mat.matriculaNumero && mat.fin) {
                const endDate = new Date(mat.fin);
                if (endDate > latestEndDate) {
                    latestMatricula = mat.matriculaNumero?.toString() || '';
                    latestEndDate = endDate;
                }
            }
        });

        return latestMatricula || 'N/A';
    }

    clearFoundData(): void {
        this.foundProfessionalData = null;
        this.foundPharmacyData = null;
        this.userForm.get('username')?.setValue('');
        this.userForm.get('username')?.enable();
        this.userForm.get('username')?.setErrors(null);
        this.userForm.get('cuil')?.setValue('');
        this.userForm.get('cuil')?.enable();
        this.userForm.get('cuil')?.setErrors(null);
    }

    private enableAllFormFields(): void {
        Object.keys(this.userForm.controls).forEach(key => {
            if (key !== 'email') {
                this.userForm.get(key)?.enable();
            }
        });

        const hasPro = this.hasProfessionalRole();
        const hasPharma = this.hasPharmacyRole();
        const hasAuditorOnly = this.hasOnlyAuditorRole();

        this.userForm.get('email')?.enable();
        this.userForm.get('password')?.enable();

        const username = this.userForm.get('username');
        username?.clearValidators();
        if (hasPro || hasAuditorOnly) {
            username?.setValidators([Validators.required, Validators.minLength(3)]);
            username?.enable();
        } else {
            username?.disable();
            username?.reset('', { emitEvent: false });
        }
        username?.updateValueAndValidity({ onlySelf: true, emitEvent: false });

        const cuil = this.userForm.get('cuil');
        const disposicionHabilitacion = this.userForm.get('disposicionHabilitacion');
        const vencimientoHabilitacion = this.userForm.get('vencimientoHabilitacion');
        const enrollment = this.userForm.get('enrollment');

        cuil?.clearValidators();
        disposicionHabilitacion?.clearValidators();
        vencimientoHabilitacion?.clearValidators();
        enrollment?.clearValidators();

        if (hasPharma) {
            cuil?.setValidators([Validators.required, Validators.pattern(/^\d{2}-?\d{8}-?\d{1}$|^\d{11}$/)]);
            cuil?.enable();
            disposicionHabilitacion?.clearValidators();
            disposicionHabilitacion?.disable();
            vencimientoHabilitacion?.clearValidators();
            vencimientoHabilitacion?.disable();
            enrollment?.clearValidators();
            enrollment?.disable();
        } else {
            cuil?.disable();
            cuil?.reset('', { emitEvent: false });
            disposicionHabilitacion?.disable();
            disposicionHabilitacion?.reset('', { emitEvent: false });
            vencimientoHabilitacion?.disable();
            vencimientoHabilitacion?.reset('', { emitEvent: false });
            if (!hasPro) {
                enrollment?.disable();
                enrollment?.reset('', { emitEvent: false });
            }
        }
        cuil?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        disposicionHabilitacion?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        vencimientoHabilitacion?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        enrollment?.updateValueAndValidity({ onlySelf: true, emitEvent: false });

        this.userForm.get('roles')?.enable();

        const businessName = this.userForm.get('businessName');
        businessName?.enable();
        businessName?.clearValidators();
        if (!hasPro && !hasPharma && !hasAuditorOnly) {
            businessName?.setValidators([Validators.required, Validators.minLength(2)]);
        } else {
            businessName?.setValidators([Validators.minLength(2)]);
            if (hasAuditorOnly) {
                businessName?.disable();
            }
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
