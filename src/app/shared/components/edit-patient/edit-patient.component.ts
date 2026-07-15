import { Component, Input, Output, EventEmitter, OnInit, booleanAttribute } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientsService } from '@services/patients.service';
import { Patient } from '@interfaces/patients';
import { NotificationService } from '@shared/services/notification.service';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { toPatientPayload } from '@models/dto/patients.dto';

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
        MatProgressSpinnerModule,
        FormFieldComponent
    ]
})
export class EditPatientComponent implements OnInit {
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

    constructor(
        private fb: FormBuilder,
        private patientsService: PatientsService,
        private notification: NotificationService
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
        } else if (this.mode === 'create' && this.prefillDni) {
            this.editForm.patchValue({ dni: this.prefillDni });
        }
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
            this.patientsService.createPatient(payload).subscribe({
                next: (newPatient) => {
                    this.isSubmit = false;
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

    onCancel(): void {
        this.cancelled.emit();
    }

    private toDateInputValue(date: Date): string {
        const d = new Date(date);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${mm}-${dd}`;
    }
}
