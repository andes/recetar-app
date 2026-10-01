import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Patient, PatientContacto, PatientDireccion } from '@interfaces/patients';
import { PatientsService } from '@services/patients.service';
import { toPatientPayload } from '@models/dto/patients.dto';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { NotificationService } from '@shared/services/notification.service';
import { UiCardComponent, UiTabsComponent } from '@shared/ui';
import type { UiTabItem } from '@shared/ui';
import { getHttpErrorMessage } from '@shared/utils/http-error.util';
import { cuilValidator } from '@utils/custome-validators/cuil.validator';
import { ConfirmDialogComponent } from '@documents/components/confirm-dialog/confirm-dialog.component';
import { finalize } from 'rxjs/operators';
import { genderOptionsWithCurrent, normalizeGenderValue, PatientGenderOption } from '../../models/patient-gender';

function validBirthDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) { return null; }
        const date = new Date(control.value);
        if (isNaN(date.getTime())) { return { invalidDate: true }; }
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (date > today) { return { futureDate: true }; }
        if (date < new Date('1900-01-01')) { return { tooOldDate: true }; }
        return null;
    };
}

@Component({
    selector: 'app-patient-edit-form',
    templateUrl: './patient-edit-form.component.html',
    styleUrls: ['./patient-edit-form.component.sass'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatProgressSpinnerModule,
        FormFieldComponent,
        UiCardComponent,
        UiTabsComponent,
    ]
})
export class PatientEditFormComponent implements OnChanges {
    @Input() patient?: Patient | null = null;
    @Input() mode: 'create' | 'edit' = 'create';
    @Output() saved = new EventEmitter<Patient>();
    @Output() cancelled = new EventEmitter<void>();

    form: FormGroup;
    submitted = false;
    isSaving = false;
    isValidating = false;
    activeTab: 'basic' | 'contact' = 'basic';
    serverError = '';
    validatedPatient: Patient | null = null;

    readonly sexOptions = ['Femenino', 'Masculino', 'Otro'];
    readonly maxDate = new Date().toISOString().slice(0, 10);
    readonly minDate = '1900-01-01';

    private readonly basicControls = [
        'firstName', 'lastName', 'nombreAutopercibido', 'dni', 'cuil',
        'sex', 'genero', 'fechaNac',
    ];
    private readonly contactControls = [
        'email', 'celular', 'fijo', 'calle', 'codigoPostal', 'barrio',
        'localidad', 'provincia', 'pais',
    ];

    constructor(
        private fb: FormBuilder,
        private patientsService: PatientsService,
        private dialog: MatDialog,
        private notification: NotificationService,
    ) {
        this.form = this.buildForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['patient'] || changes['mode']) {
            this.form = this.buildForm(this.patient);
            this.submitted = false;
            this.serverError = '';
            this.activeTab = 'basic';
            this.validatedPatient = null;
            this.isValidating = false;
        }
    }

    get statusKey(): string {
        const patient = this.validatedPatient || this.patient;
        return (patient?.status || patient?.estado || '').toLowerCase();
    }

    get isValidated(): boolean {
        return this.statusKey === 'validado';
    }

    get canValidate(): boolean {
        return !!this.form.get('dni')?.value && !!this.form.get('sex')?.value && !this.isValidating;
    }

    get generoOptions(): PatientGenderOption[] {
        return genderOptionsWithCurrent(this.form?.get('genero')?.value);
    }

    get hasGeneroValue(): boolean {
        return !!this.form.get('genero')?.value;
    }

    clearGenero(): void {
        const control = this.form.get('genero');
        control?.setValue(null);
        control?.markAsDirty();
        control?.markAsTouched();
    }

    get tabItems(): UiTabItem[] {
        return [
            {
                value: 'basic',
                label: 'Datos básicos',
                icon: 'person',
                error: this.basicTabHasError,
            },
            {
                value: 'contact',
                label: 'Contacto',
                icon: 'email',
                error: this.contactTabHasError,
            },
        ];
    }

    onTabChange(value: string): void {
        this.activeTab = value === 'contact' ? 'contact' : 'basic';
    }

    get basicTabHasError(): boolean {
        return this.submitted && this.hasTabError(this.basicControls);
    }

    get contactTabHasError(): boolean {
        return this.submitted && this.hasTabError(this.contactControls);
    }

    onSave(): void {
        this.submitted = true;
        this.serverError = '';
        this.form.markAllAsTouched();

        if (this.form.invalid) {
            this.activeTab = this.firstInvalidTab();
            return;
        }

        const payload = toPatientPayload({
            ...this.form.getRawValue(),
            contactos: this.buildContactos(),
            direcciones: [this.buildDireccion()],
        });

        this.isSaving = true;
        const request = this.mode === 'create'
            ? this.patientsService.createPatient(payload)
            : this.patientsService.updatePatient(this.patient?.idMPI || this.patient?._id || '', payload);

        request.subscribe({
            next: (patient) => {
                this.isSaving = false;
                this.form.markAsPristine();
                this.saved.emit(patient);
            },
            error: (error) => {
                this.isSaving = false;
                this.serverError = getHttpErrorMessage(error, 'No fue posible guardar el paciente');
            }
        });
    }

    onCancel(): void {
        this.requestExit();
    }

    onValidate(): void {
        const dni = (this.form.get('dni')?.value || '').trim();
        const sex = this.form.get('sex')?.value || '';
        if (!dni || !sex || this.isValidating) {
            return;
        }

        this.isValidating = true;
        const id = this.patient?.idMPI || this.patient?._id;
        const request = id
            ? this.patientsService.validatePatientById(id)
            : this.patientsService.validatePatient(dni, sex);

        request.pipe(
            finalize(() => this.isValidating = false),
        ).subscribe({
            next: (validated) => {
                if (!validated) {
                    this.notification.error('No se pudo validar el paciente');
                    return;
                }
                this.validatedPatient = Object.assign(validated, {
                    status: 'validado',
                    estado: 'validado',
                });
                this.applyValidatedPatient(this.validatedPatient);
                this.notification.success('Paciente validado correctamente');
            },
            error: (error) => {
                this.notification.error(
                    getHttpErrorMessage(error, 'No se pudo validar el paciente'),
                );
            }
        });
    }

    hasUnsavedChanges(): boolean {
        return this.form.dirty;
    }

    canDeactivate(): boolean | Observable<boolean> {
        return this.confirmDiscard();
    }

    private requestExit(): void {
        this.confirmDiscard().subscribe((discard) => {
            if (discard) {
                this.form.markAsPristine();
                this.cancelled.emit();
            }
        });
    }

    private confirmDiscard(): Observable<boolean> {
        if (!this.form.dirty) {
            return of(true);
        }
        return this.dialog.open(ConfirmDialogComponent, {
            width: '420px',
            data: {
                title: 'Descartar cambios',
                message: 'Hay cambios sin guardar. ¿Querés salir igual?',
            }
        }).afterClosed();
    }

    private firstInvalidTab(): 'basic' | 'contact' {
        if (this.hasTabError(this.basicControls)) { return 'basic'; }
        if (this.hasTabError(this.contactControls)) { return 'contact'; }
        return 'basic';
    }

    private applyValidatedPatient(validated: Patient): void {
        const direccion = validated.direcciones?.[0];
        const contactos = validated.contactos || [];

        this.form.patchValue({
            dni: validated.dni || this.form.get('dni')?.value || '',
            firstName: validated.firstName || this.form.get('firstName')?.value || '',
            lastName: validated.lastName || this.form.get('lastName')?.value || '',
            sex: validated.sex || this.form.get('sex')?.value || '',
            fechaNac: this.toDateInputValue(validated.fechaNac) || this.form.get('fechaNac')?.value || '',
            cuil: validated.cuil || this.form.get('cuil')?.value || '',
            ...(contactos.length ? {
                email: this.contactValue(validated, 'email') || this.form.get('email')?.value || '',
                celular: this.contactValue(validated, 'celular') || this.form.get('celular')?.value || '',
                fijo: this.contactValue(validated, 'fijo') || this.form.get('fijo')?.value || '',
            } : {}),
            ...(direccion ? {
                calle: direccion.calle || '',
                codigoPostal: direccion.codigoPostal || '',
                barrio: direccion.barrio || '',
                localidad: direccion.localidad || '',
                provincia: direccion.provincia || '',
                pais: direccion.pais || '',
            } : {}),
        });

        this.form.get('dni')?.disable({ emitEvent: false });
        this.form.markAsDirty();
    }

    private hasTabError(controls: string[]): boolean {
        return controls.some((name) => !!this.form.get(name)?.invalid);
    }

    private buildForm(patient?: Patient | null): FormGroup {
        const direccion = patient?.direcciones?.[0];
        const form = this.fb.group({
            firstName: [patient?.firstName || '', Validators.required],
            lastName: [patient?.lastName || '', Validators.required],
            nombreAutopercibido: [patient?.nombreAutopercibido || ''],
            dni: [
                { value: patient?.dni || '', disabled: this.isPatientValidated(patient) },
                [Validators.minLength(6), Validators.maxLength(8), Validators.pattern('^[0-9]*$')],
            ],
            cuil: [patient?.cuil || '', [cuilValidator]],
            sex: [patient?.sex || '', Validators.required],
            genero: [normalizeGenderValue(patient?.genero) || null],
            fechaNac: [this.toDateInputValue(patient?.fechaNac), [validBirthDate()]],
            email: [this.contactValue(patient, 'email'), [Validators.email]],
            celular: [this.contactValue(patient, 'celular'), [Validators.pattern('^[0-9]*$')]],
            fijo: [this.contactValue(patient, 'fijo'), [Validators.pattern('^[0-9]*$')]],
            calle: [direccion?.calle || ''],
            codigoPostal: [direccion?.codigoPostal || ''],
            barrio: [direccion?.barrio || ''],
            localidad: [direccion?.localidad || ''],
            provincia: [direccion?.provincia || ''],
            pais: [direccion?.pais || ''],
        });
        form.markAsPristine();
        return form;
    }

    private buildContactos(): PatientContacto[] {
        return [
            { tipo: 'email', valor: this.form.get('email')?.value || '' },
            { tipo: 'celular', valor: this.form.get('celular')?.value || '' },
            { tipo: 'fijo', valor: this.form.get('fijo')?.value || '' },
        ];
    }

    private buildDireccion(): PatientDireccion {
        return {
            calle: this.form.get('calle')?.value || '',
            codigoPostal: this.form.get('codigoPostal')?.value || '',
            barrio: this.form.get('barrio')?.value || '',
            localidad: this.form.get('localidad')?.value || '',
            provincia: this.form.get('provincia')?.value || '',
            pais: this.form.get('pais')?.value || '',
        };
    }

    private contactValue(patient: Patient | null | undefined, tipo: 'email' | 'celular' | 'fijo'): string {
        return patient?.contactos?.find((contacto) => contacto.tipo === tipo)?.valor || '';
    }

    private isPatientValidated(patient?: Patient | null): boolean {
        return (patient?.estado || patient?.status || '').toLowerCase() === 'validado';
    }

    private toDateInputValue(date?: Date): string {
        if (!date) { return ''; }
        const d = new Date(date);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${mm}-${dd}`;
    }
}
