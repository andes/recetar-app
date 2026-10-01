import { Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '@services/users.service';
import { Role, RolesService } from '@services/roles.service';
import { AndesApiResponse, AndesPharmacyData, AndesProfessionalData, AndesSearchService } from '@services/andes-search.service';
import { NotificationService } from '@shared/services/notification.service';
import { getHttpErrorMessage, getValidationDetails } from '@shared/utils/http-error.util';
import { buildFieldErrors } from '@shared/utils/validation-messages.util';
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
    message?: string;
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
    serverErrors: Record<string, string> = {};

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

    professionalNotFound = false;
    pharmacyNotFound = false;

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
        this.serverErrors = {};
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

        Object.keys(this.userForm.controls).forEach(field => {
            this.userForm.get(field)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
                delete this.serverErrors[field];
            });
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

                    this.serverErrors = buildFieldErrors(getValidationDetails(error));
                    Object.keys(this.serverErrors).forEach(field => {
                        this.userForm.get(field)?.markAsTouched();
                    });

                    this.notificationService.httpError(error);
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
        if (this.serverErrors[fieldName]) {
            return this.serverErrors[fieldName];
        }
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
        if (this.serverErrors[fieldName]) {
            return true;
        }
        const control = this.userForm.get(fieldName);
        return !!(control?.invalid && control.touched);
    }

    get selectedRoleObjects(): Role[] {
        const selectedKeys: string[] = this.userForm?.get('roles')?.value || [];
        return selectedKeys.map(key =>
            this.availableRoleOptions.find(role => role.role === key) || ({ role: key } as Role)
        );
    }

    onRolesChange(roles: Role[]): void {
        this.userForm.get('roles')?.setValue(roles.map(role => role.role));
        this.applyRoleConstraints();
    }

    onRoleConflict(): void {
        const selectedKeys: string[] = this.userForm.get('roles')?.value || [];
        const hasPharmacist = selectedKeys.some(role => this.rolesService.isPharmacistRole(role));
        const conflictType = hasPharmacist ? 'farmacéutico' : 'profesional';
        this.notificationService.warning(
            `No se puede seleccionar un rol incompatible con el rol ${conflictType} ya seleccionado.`
        );
    }

    private applyRoleConstraints(): void {
        const selectedRoles: string[] = this.userForm.get('roles')?.value || [];

        const hasProfessional = selectedRoles.some(role => this.rolesService.isProfessionalRole(role));
        const hasPharmacy = selectedRoles.some(role => this.rolesService.isPharmacistRole(role));

        if (hasPharmacy && this.foundProfessionalData) {
            this.foundProfessionalData = null;
            this.isUsernameValid = false;
            this.usernameValidationMessage = '';
            this.professionalNotFound = false;
        }

        if (hasProfessional && this.foundPharmacyData) {
            this.foundPharmacyData = null;
            this.isCuilValid = false;
            this.cuilValidationMessage = '';
            this.pharmacyNotFound = false;
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
                    this.pharmacyNotFound = false;
                    return of(null);
                }

                this.isValidatingCuil = true;
                this.cuilValidationMessage = 'Buscando en los padrones provinciales...';
                this.pharmacyNotFound = false;

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
                    catchError((error) => of({ error: true as const, message: getHttpErrorMessage(error, '') }))
                );
            })
        ).subscribe({
            next: (result: CuilSearchResult | SearchErrorResult | null) => {
                this.isValidatingCuil = false;
                if (result === null) { return; }

                if (isSearchErrorResult(result)) {
                    this.isCuilValid = false;
                    this.pharmacyNotFound = this.isNotFoundMessage(result.message);
                    this.cuilValidationMessage = this.pharmacyNotFound
                        ? 'No encontramos la farmacia en los padrones provinciales'
                        : (result.message || 'No pudimos consultar los padrones provinciales. Intentá de nuevo en unos minutos');
                    return;
                }

                if (!isCuilSearchResult(result)) {
                    this.isCuilValid = false;
                    this.pharmacyNotFound = false;
                    this.cuilValidationMessage = 'No pudimos consultar los padrones provinciales. Intentá de nuevo en unos minutos';
                    return;
                }

                const hasPharmacyData = result.pharmacyData && result.pharmacyData.ok &&
                    result.pharmacyData.data && result.pharmacyData.data.length > 0;

                if (hasPharmacyData) {
                    this.isCuilValid = true;
                    this.pharmacyNotFound = false;
                    this.cuilValidationMessage = 'Farmacia encontrada en los padrones provinciales';
                    this.autocompleteFields(result.pharmacyData.data[0]);
                } else {
                    this.isCuilValid = false;
                    this.pharmacyNotFound = true;
                    this.cuilValidationMessage = 'No encontramos la farmacia en los padrones provinciales';
                }
            },
            error: () => {
                this.isValidatingCuil = false;
                this.isCuilValid = false;
                this.cuilValidationMessage = 'No pudimos consultar los padrones provinciales. Intentá de nuevo en unos minutos';
            }
        });

        this.userForm.get('cuil')?.valueChanges.pipe(
            takeUntil(this.destroy$)
        ).subscribe(value => {
            if (typeof value === 'string') {
                const formattedValue = this.formatCuilString(value);
                if (formattedValue !== value) {
                    this.userForm.get('cuil')?.setValue(formattedValue, { emitEvent: false });
                }
                this.cuilSearchSubject.next(value.replace(/-/g, ''));
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
                    this.professionalNotFound = false;
                    return of(null);
                }

                if (!documento || documento.length < 7 || !/^\d+$/.test(documento)) {
                    this.isValidatingUsername = false;
                    this.usernameValidationMessage = '';
                    this.isUsernameValid = false;
                    this.professionalNotFound = false;
                    return of(null);
                }

                this.isValidatingUsername = true;
                this.usernameValidationMessage = 'Buscando en los padrones provinciales...';
                this.professionalNotFound = false;

                return this.andesSearchService.searchProfessional(documento).pipe(
                    catchError((error) => of({ error: true as const, message: getHttpErrorMessage(error, '') }))
                );
            })
        ).subscribe({
            next: (result: AndesApiResponse<AndesProfessionalData> | SearchErrorResult | null) => {
                this.isValidatingUsername = false;

                if (result === null) { return; }

                if (isSearchErrorResult(result)) {
                    this.isUsernameValid = false;
                    this.professionalNotFound = this.isNotFoundMessage(result.message);
                    this.usernameValidationMessage = this.professionalNotFound
                        ? 'No encontramos el profesional en los padrones provinciales'
                        : (result.message || 'No pudimos consultar los padrones provinciales. Intentá de nuevo en unos minutos');
                    return;
                }

                if (result && result.ok && result.data && Array.isArray(result.data) && result.data.length > 0) {
                    this.isUsernameValid = true;
                    this.professionalNotFound = false;
                    this.usernameValidationMessage = 'Profesional encontrado en los padrones provinciales';
                    this.autocompleteFields(result.data[0]);
                } else {
                    this.isUsernameValid = false;
                    this.professionalNotFound = true;
                    this.usernameValidationMessage = 'No encontramos el profesional en los padrones provinciales';
                }
            },
            error: () => {
                this.isValidatingUsername = false;
                this.isUsernameValid = false;
                this.usernameValidationMessage = 'No pudimos consultar los padrones provinciales. Intentá de nuevo en unos minutos';
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

    private isNotFoundMessage(message?: string): boolean {
        return /no encontrad|not found/i.test(message || '');
    }

    get showIdentityStep(): boolean {
        return this.hasProfessionalRole() || this.hasPharmacyRole() || this.hasOnlyAuditorRole();
    }

    get showUserInfo(): boolean {
        if (this.hasProfessionalRole()) { return this.hasProfessionalData(); }
        if (this.hasPharmacyRole()) { return this.hasPharmacyData(); }
        return this.hasSelectedRoles();
    }

    get showBusinessNameField(): boolean {
        return !this.hasProfessionalRole() && !this.hasPharmacyRole() && !this.hasOnlyAuditorRole();
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
