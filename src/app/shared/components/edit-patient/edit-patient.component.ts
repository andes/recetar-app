import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, booleanAttribute } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil, skip } from 'rxjs/operators';
import { PatientsService } from '@services/patients.service';
import { Patient } from '@interfaces/patients';
import { NotificationService } from '@shared/services/notification.service';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { PatientPayload, toPatientPayload } from '@models/dto/patients.dto';
import { ConfirmDialogComponent } from '@documents/components/confirm-dialog/confirm-dialog.component';

function validDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) {
            return null;
        }

        const date = new Date(control.value);
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            return { invalidDate: { value: control.value } };
        }

        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (date > today) {
            return { futureDate: { value: control.value } };
        }

        const minDate = new Date('1900-01-01');
        if (date < minDate) {
            return { tooOldDate: { value: control.value } };
        }

        return null;
    };
}

@Component({
    selector: 'app-edit-patient',
    templateUrl: './edit-patient.component.html',
    styleUrls: ['./edit-patient.component.sass'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        FormFieldComponent
    ]
})
export class EditPatientComponent implements OnInit, OnDestroy {
    @Input() patient?: Patient;
    @Input() mode: 'edit' | 'create' = 'edit';
    @Input() prefillDni?: string;
    @Input({ transform: booleanAttribute }) showFechaNac = true;
    @Output() saved = new EventEmitter<Patient>();
    @Output() cancelled = new EventEmitter<void>();

    editForm: FormGroup;
    sexOptions: string[] = ['Femenino', 'Masculino', 'Otro'];
    isSubmit = false;
    submitted = false;
    validationStatus: 'validado' | 'temporal' | '' = '';
    isValidating = false;
    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private patientsService: PatientsService,
        private notification: NotificationService,
        private dialog: MatDialog
    ) {
        this.editForm = this.fb.group({
            dni: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(8), Validators.pattern('^[0-9]*$')]],
            lastName: ['', Validators.required],
            firstName: ['', Validators.required],
            nombreAutopercibido: [''],
            sex: ['', Validators.required],
            fechaNac: ['', [Validators.required, validDateValidator()]]
        });
    }

    ngOnInit(): void {
        if (this.mode === 'edit' && this.patient) {
            this.editForm.patchValue({
                dni: this.patient.dni || '',
                lastName: this.patient.lastName || '',
                firstName: this.patient.firstName || '',
                nombreAutopercibido: this.patient.nombreAutopercibido || '',
                sex: this.patient.sex || '',
                fechaNac: this.patient.fechaNac ? this.toDateInputValue(this.patient.fechaNac) : ''
            });
            const estado = this.patient.status || this.patient.estado || '';
            this.validationStatus = estado.toLowerCase() === 'validado' ? 'validado' : estado.toLowerCase() === 'temporal' ? 'temporal' : '';
        } else if (this.mode === 'create' && this.prefillDni) {
            this.editForm.patchValue({ dni: this.prefillDni });
        }

        this.editForm.get('dni')?.valueChanges.pipe(
            skip(1),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.validationStatus = '';
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get minDateStr(): string { return '1900-01-01'; }
    get maxDateStr(): string {
        const d = new Date();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${mm}-${dd}`;
    }

    get isCreate(): boolean { return this.mode === 'create'; }

    onSubmit(): void {
        this.submitted = true;
        if (!this.editForm.valid) {
            this.editForm.markAllAsTouched();
            return;
        }

        this.isSubmit = true;

        const formValue = this.editForm.getRawValue();
        const payload = toPatientPayload(formValue);

        if (this.mode === 'create') {
            const dni = formValue.dni || '';
            if (dni) {
                this.patientsService.getPatientByDni(dni).subscribe({
                    next: (existing) => {
                        if (existing.length > 0 && existing[0]._id) {
                            this.dialog.open(ConfirmDialogComponent, {
                                panelClass: ['confirm-dialog-panel', 'dialog-md'],
                                data: {
                                    title: 'Paciente existente',
                                    message: `Ya existe un paciente registrado con el DNI ${dni}. ¿Desea reemplazar los datos actuales con los nuevos?`
                                }
                            }).afterClosed().subscribe((result) => {
                                if (result) {
                                    this.patientsService.updatePatient(existing[0]._id, payload).subscribe({
                                        next: (updatedPatient) => {
                                            this.isSubmit = false;
                                            const estado = updatedPatient.status || updatedPatient.estado || '';
                                            this.validationStatus = estado.toLowerCase() === 'validado' ? 'validado' : estado.toLowerCase() === 'temporal' ? 'temporal' : '';
                                            this.notification.success('Paciente actualizado correctamente');
                                            this.saved.emit(updatedPatient);
                                        },
                                        error: (err) => {
                                            this.isSubmit = false;
                                            this.notification.error('No fue posible actualizar el paciente');
                                        }
                                    });
                                } else {
                                    this.isSubmit = false;
                                }
                            });
                        } else {
                            this.createPatient(payload);
                        }
                    },
                    error: () => {
                        this.createPatient(payload);
                    }
                });
            } else {
                this.isSubmit = false;
            }
            return;
        }

        if (!this.patient?._id) {
            this.isSubmit = false;
            return;
        }

        this.patientsService.updatePatient(this.patient._id, payload).subscribe({
            next: (updatedPatient) => {
                this.isSubmit = false;
                this.notification.success('Paciente guardado correctamente');
                this.saved.emit(updatedPatient);
            },
            error: (err) => {
                this.isSubmit = false;
                if (err?.error?.error?.code === 'PATIENT_DUPLICATED') {
                    const dniControl = this.editForm.get('dni');
                    if (dniControl) {
                        dniControl.markAsTouched();
                        dniControl.setErrors({ duplicateDni: true });
                    }
                }
                this.notification.error('No fue posible actualizar el paciente');
            }
        });
    }

    private createPatient(payload: PatientPayload): void {
        this.patientsService.createPatient(payload).subscribe({
            next: (newPatient) => {
                this.isSubmit = false;
                const estado = newPatient.status || newPatient.estado || '';
                this.validationStatus = estado.toLowerCase() === 'validado' ? 'validado' : estado.toLowerCase() === 'temporal' ? 'temporal' : '';
                this.notification.success('Paciente guardado correctamente');
                this.saved.emit(newPatient);
            },
            error: (err) => {
                this.isSubmit = false;
                if (err?.error?.error?.code === 'PATIENT_DUPLICATED') {
                    const dniControl = this.editForm.get('dni');
                    if (dniControl) {
                        dniControl.markAsTouched();
                        dniControl.setErrors({ duplicateDni: true });
                    }
                }
                this.notification.error('No fue posible crear el paciente');
            }
        });
    }

    onCancel(): void {
        this.cancelled.emit();
    }

    onValidate(): void {
        const dni = this.editForm.get('dni')?.value;
        const sexo = this.editForm.get('sex')?.value;
        if (!dni || !sexo) {
            this.notification.warning('Debe ingresar DNI y Sexo para validar');
            return;
        }
        this.isValidating = true;
        this.patientsService.validatePatient(dni, sexo).subscribe({
            next: (validatedPatient) => {
                this.isValidating = false;
                this.validationStatus = 'validado';
                this.editForm.patchValue({
                    dni: validatedPatient.dni || dni,
                    lastName: validatedPatient.lastName || '',
                    firstName: validatedPatient.firstName || '',
                    sex: validatedPatient.sex || sexo,
                    fechaNac: validatedPatient.fechaNac ? this.toDateInputValue(validatedPatient.fechaNac) : '',
                });
                this.notification.success('Paciente validado correctamente');
            },
            error: (err) => {
                this.isValidating = false;
                if (err?.error?.error?.code === 'VALIDATION_NOT_FOUND') {
                    this.validationStatus = 'temporal';
                    this.notification.warning('Persona no encontrada');
                } else {
                    this.notification.error('No fue posible validar');
                }
            }
        });
    }

    private toDateInputValue(date: Date): string {
        const d = new Date(date);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${mm}-${dd}`;
    }
}
