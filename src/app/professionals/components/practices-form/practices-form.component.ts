import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '@auth/services/auth.service';
import { ProfessionalDialogComponent } from '@professionals/components/professional-dialog/professional-dialog.component';
import { PracticesService } from '@services/practices.service';
import { PatientFormComponent } from '@shared/components/patient-form/patient-form.component';

@Component({
    selector: 'app-practices-form',
    templateUrl: './practices-form.component.html',
    styleUrls: ['./practices-form.component.sass']
})
export class PracticesFormComponent implements OnInit {
    @ViewChild('patientForm') patientFormComponent: PatientFormComponent;
    practicesForm: FormGroup;
    practiceDate = new FormControl(new Date(), [Validators.required]);
    isSubmitPractice = false;
    professionalData: any;
    efectorControl = new FormControl('', Validators.required);

    constructor(
        private fBuilder: FormBuilder,
        private practicesService: PracticesService,
        private authService: AuthService,
        public dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.professionalData = this.authService.getLoggedUserId();
        this.initPracticesForm();
    }

    initPracticesForm(): void {
        this.practicesForm = this.fBuilder.group({
            professional: [this.professionalData],
            date: [new Date(), [Validators.required]],
            patient: [null, [Validators.required]],
            practice: [''],
            diagnostic: [''],
            indications: ['']
        });
    }

    onSubmitPracticesForm(practicesNgForm: FormGroupDirective): void {
        if (this.practicesForm.valid) {
            this.isSubmitPractice = true;

            const practiceData = this.practicesForm.value;

            this.practicesService.newPractice(practiceData).subscribe(
                success => {
                    this.isSubmitPractice = false;

                    if (success) {
                        this.openDialog('practiceSuccess');
                        this.clearPracticesForm(practicesNgForm);
                    }
                },
                error => {
                    this.isSubmitPractice = false;
                    console.error('Error al crear la práctica:', error);
                    this.openDialog('practiceError');
                }
            );
        } else {
            // Marcar todos los campos como touched para mostrar errores
            this.markFormGroupTouched(this.practicesForm);
            // También marcar los campos del patient-form como touched
            if (this.patientFormComponent) {
                this.patientFormComponent.markAllFieldsTouched();
            }
        }
    }

    clearPracticesForm(practicesNgForm: FormGroupDirective): void {
        practicesNgForm.resetForm();
        this.practicesForm.reset({
            professional: this.professionalData,
            date: new Date(),
            patient: null,
            practice: '',
            diagnostic: '',
            indications: ''
        });
        this.practiceDate.setValue(new Date());
    }

    openDialog(aDialogType: string): void {
        this.dialog.open(ProfessionalDialogComponent, {
            width: '400px',
            data: { dialogType: aDialogType }
        });
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();

            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            }
        });
    }
}
