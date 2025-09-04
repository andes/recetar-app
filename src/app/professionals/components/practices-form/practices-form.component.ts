import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '@auth/services/auth.service';
import { Practice } from '@interfaces/practices';
import { ProfessionalDialogComponent } from '@professionals/components/professional-dialog/professional-dialog.component';
import { PracticesService } from '@services/practices.service';

@Component({
    selector: 'app-practices-form',
    templateUrl: './practices-form.component.html',
    styleUrls: ['./practices-form.component.sass']
})
export class PracticesFormComponent implements OnInit {
    practicesForm: FormGroup;
    practiceDate = new FormControl(new Date(), [Validators.required]);
    isSubmitPractice = false;
    professionalData: any;

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
        const dialogRef = this.dialog.open(ProfessionalDialogComponent, {
            width: '400px',
            data: { dialogType: aDialogType }
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('The dialog was closed');
        });
    }
}
