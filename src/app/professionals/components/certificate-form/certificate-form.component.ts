import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { step, stepLink } from '@animations/animations.template';
import { AuthService } from '@auth/services/auth.service';
import { Certificate } from '@interfaces/certificate';
import { Prescriptions } from '@interfaces/prescriptions';
import { ProfessionalDialogComponent } from '@professionals/components/professional-dialog/professional-dialog.component';
import { PatientsService } from '@root/app/services/patients.service';
import { CertificatesService } from '@services/certificates.service';
import { PatientNamePipe } from '@shared/pipes/patient-name.pipe';
import { Subscription } from 'rxjs';
import { PatientFormComponent } from '@shared/components/patient-form/patient-form.component';

@Component({
    selector: 'app-certificate-form',
    templateUrl: './certificate-form.component.html',
    styleUrls: ['./certificate-form.component.sass'],
    animations: [
        step,
        stepLink
    ]
})
export class CertificateFormComponent implements OnInit {
    @Output() anulateCertificateEvent = new EventEmitter();
    @Output() certificateCreatedEvent = new EventEmitter();

    startDateValidator(control: AbstractControl) {
        if (!control.value) {
            return null;
        }

        const selectedDate = new Date(control.value);
        const today = new Date();
        const minDate = new Date(today);
        minDate.setDate(today.getDate() - 15);

        // Reset time part to compare only dates
        selectedDate.setHours(0, 0, 0, 0);
        minDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (selectedDate < minDate) {
            return { tooOld: true };
        }

        return null;
    }
    certificateForm: FormGroup;
    loadingCertificates: boolean;
    efectorControl = new FormControl('', Validators.required);
    today = new Date();
    professionalData: any;
    readonly spinnerColor: ThemePalette = 'primary';
    isSubmit = false;
    isFormShown = true;
    isCertificateShown = false;
    anulateCertificate = false;
    isListShown = false;
    dataCertificates = new MatTableDataSource<Certificate>([]);
    private anulateCertificateSubscription: Subscription;
    public certificate: Certificate;
    cantDias = new FormControl('', [Validators.required, Validators.min(1)]);

    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @ViewChild('patientForm') patientFormComponent: PatientFormComponent;

    constructor(
        private fBuilder: FormBuilder,
        private apiPatients: PatientsService,
        private certificateService: CertificatesService,
        private authService: AuthService,
        public dialog: MatDialog,
        private patientNamePipe: PatientNamePipe
    ) { }

    ngOnInit(): void {
        this.loadingCertificates = true;
        this.certificateService.certificates.subscribe((certificates: Certificate[]) => {
            this.dataCertificates = new MatTableDataSource<Certificate>(certificates);
            this.dataCertificates.sortingDataAccessor = (item, property) => {
                switch (property) {
                    case 'patient': return item.patient.lastName + this.patientNamePipe.transform(item.patient);
                    case 'prescription_date': return new Date(item.createdAt).getTime();
                    default: return item[property];
                }
            };
            this.dataCertificates.sort = this.sort;
            this.dataCertificates.paginator = this.paginator;
            this.loadingCertificates = false;
        });
        this.initProfessionalForm();

        this.certificateService.certificate$.subscribe(
            certificate => {
                if (certificate) {
                    this.certificateForm.reset({
                        date: { value: certificate.createdAt, disabled: true },
                        patient: certificate.patient,
                        certificate: { value: certificate.certificate, disabled: true },
                    });
                    this.anulateCertificate = true;
                    this.certificate = certificate;
                } else {
                    this.anulateCertificate = false;
                }
            }
        );
    }

    // eslint-disable-next-line @angular-eslint/use-lifecycle-interface
    ngOnDestroy() {
        if (this.anulateCertificateSubscription) {
            this.anulateCertificateSubscription.unsubscribe();
        }
    }

    initProfessionalForm() {
        this.today = new Date((new Date()));
        this.professionalData = this.authService.getLoggedUserId();
        this.certificateForm = this.fBuilder.group({
            _id: [''],
            professional: [this.professionalData],
            patient: ['', [Validators.required]],
            certificate: ['', [Validators.required]],
            efector: this.efectorControl,
            anulateReason: [''],
            startDate: [this.today, [
                Validators.required,
                this.startDateValidator.bind(this)
            ]],
            cantDias: [''],
        });

    }



    onSubmitCertificateForm(professionalNgForm: FormGroupDirective): void {
        if (!this.anulateCertificate) {
            if (this.certificateForm.valid && this.cantDias.valid) {
                const startDate = new Date(this.certificateForm.get('startDate').value);
                startDate.setHours(0, 0, 0, 0);
                this.certificateForm.get('startDate').setValue(startDate);
                const newPrescription = {
                    ...this.certificateForm.value,
                    cantDias: this.cantDias.value
                };
                this.isSubmit = true;
                this.certificateService.newCertificate(newPrescription).subscribe(
                    success => {
                        if (success) { this.formReset(professionalNgForm); }
                    });
            } else {
                // Marcar todos los campos como touched para mostrar errores
                this.markFormGroupTouched(this.certificateForm);
                this.cantDias.markAsTouched();
                // También marcar los campos del patient-form como touched
                if (this.patientFormComponent) {
                    this.patientFormComponent.markAllFieldsTouched();
                }
            }
        } else {
            this.certificate['anulateReason'] = this.certificateForm.value.anulateReason;
            this.certificate['anulateDate'] = new Date();
            this.certificateService.anulateCertificate(this.certificate).subscribe(
                (success) => {
                    if (success) {
                        this.formReset(professionalNgForm);
                        this.anulateCertificateEvent.emit();
                    }
                }
            );
        }
    }

    private formReset(professionalNgForm: FormGroupDirective) {
        const wasAnulate = this.anulateCertificate;
        this.clearForm(professionalNgForm);
        this.isSubmit = false;
        if (wasAnulate) {
            this.openDialog('anulate_certificate');
        } else {
            this.openDialog('created_certificate');
            this.certificateCreatedEvent.emit();
        }
    }

    // Show a dialog
    openDialog(aDialogType: string, aPrescription?: Prescriptions, aText?: string): void {
        const dialogRef = this.dialog.open(ProfessionalDialogComponent, {
            width: '400px',
            data: { dialogType: aDialogType, prescription: aPrescription, text: aText }
        });
    }

    get professional(): AbstractControl {
        return this.certificateForm.get('professional');
    }



    get startDate(): AbstractControl {
        return this.certificateForm.get('startDate');
    }


    get cantDiasControl(): AbstractControl {
        return this.cantDias;
    }


    get patientCertificate(): AbstractControl {
        const patient = this.certificateForm.get('certificate');
        return patient.get('certificate');
    }

    get patientReason(): AbstractControl {
        const patient = this.certificateForm.get('anulateReason');
        return patient.get('anulateReason');
    }

    getEndDateHint(): string {
        if (this.cantDias.value && this.startDate.value) {
            const startDate = new Date(this.startDate.value);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + parseInt(this.cantDias.value, 10) - 1);
            return `Vigente hasta: ${endDate.toLocaleDateString('es-ES')}`;
        }
        return '';
    }

    onEfectorSelected(efector: any): void {
        // El efector ya se actualiza automáticamente a través del FormControl
        // Aquí puedes agregar lógica adicional si es necesaria
    }

    displayFn(supply): string {
        return supply ? supply : '';
    }

    // reset the form as intial values
    clearForm(professionalNgForm: FormGroupDirective) {
        professionalNgForm.resetForm();
        this.certificateForm.reset({
            _id: '',
            professional: this.professionalData,
            startDate: this.today,
            cantDias: '',
            patient: null,
            certificate: '',
            anulateReason: ''
        });
        this.certificateService.setCertificate(null);
        this.anulateCertificateEvent.emit();
    }

    showForm(): void {
        this.isFormShown = true;
        this.isCertificateShown = false;
    }

    showList(): void {
        this.isFormShown = false;
        this.isListShown = false;
    }

    showCertificados(): void {
        this.isFormShown = false;
        this.isCertificateShown = true;
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
