import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl, Validators, FormGroupDirective, FormControl } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { PatientsService } from '@root/app/services/patients.service';
import { AuthService } from '@auth/services/auth.service';
import { Patient } from '@interfaces/patients';
import { ThemePalette } from '@angular/material/core';
import { Prescriptions } from '@interfaces/prescriptions';
import { ProfessionalDialogComponent } from '@professionals/components/professional-dialog/professional-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { step, stepLink } from '@animations/animations.template';
import { debounce, debounceTime, map, startWith } from 'rxjs/operators';
import { CertificatesService } from '@services/certificates.service';
import { Certificate } from '@interfaces/certificate';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

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
    obraSocialControl = new FormControl('');
    filteredObrasSociales: Observable<any[]>;

    onOsSelected(selectedOs: any): void {
        const osGroup = this.certificateForm.get('patient.obraSocial') as FormGroup;
        if (osGroup && selectedOs) {
            osGroup.patchValue({
                nombre: selectedOs.nombre,
                codigoPuco: selectedOs.codigoPuco
            });
            const numeroAfiliadoControl = osGroup.get('numeroAfiliado');
            if (numeroAfiliadoControl) {
                numeroAfiliadoControl.enable();
            }
        }
    }
    @ViewChild('dni', { static: true }) dni: any;

    certificateForm: FormGroup;
    loadingCertificates: boolean;
    patientSearch: Patient[];
    today = new Date();
    professionalData: any;
    readonly spinnerColor: ThemePalette = 'primary';
    isSubmit = false;
    dniShowSpinner = false;
    isFormShown = true;
    isCertificateShown = false;
    anulateCertificate = false;
    obraSocial: any[];
    obrasSociales: any[];
    otraOS = false;
    dataCertificates = new MatTableDataSource<Certificate>([]);
    private anulateCertificateSubscription: Subscription;
    public certificate: Certificate;

    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    constructor(
        private fBuilder: FormBuilder,
        private apiPatients: PatientsService,
        private certificateService: CertificatesService,
        private authService: AuthService,
        public dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.loadingCertificates = true;
        this.certificateService.certificates.subscribe((certificates: Certificate[]) => {
            this.dataCertificates = new MatTableDataSource<Certificate>(certificates);
            this.dataCertificates.sortingDataAccessor = (item, property) => {
                switch (property) {
                    case 'patient': return item.patient.lastName + item.patient.firstName;
                    case 'prescription_date': return new Date(item.createdAt).getTime();
                    default: return item[property];
                }
            };
            this.dataCertificates.sort = this.sort;
            this.dataCertificates.paginator = this.paginator;
            this.loadingCertificates = false;
        });
        this.initProfessionalForm();

        // on DNI changes
        this.patientDni.valueChanges.pipe(
            debounceTime(1000)
        ).subscribe(
            dniValue => {
                this.getPatientByDni(dniValue);
            }
        );

        this.certificateForm.get('patient.otraOS')?.valueChanges.subscribe(() => {
            const osGroup = this.certificateForm.get('patient.obraSocial') as FormGroup;
            osGroup.reset();
            osGroup.get('numeroAfiliado').disable();
        });

        this.filteredObrasSociales = this.obraSocialControl.valueChanges.pipe(
            startWith(''),
            map(value => {
                const name = typeof value === 'string' ? value : value?.nombre;
                return name ? this._filter(name) : this.obrasSociales.slice();
            })
        );

        this.certificateService.certificate$.subscribe(
            certificate => {
                if (certificate) {
                    this.certificateForm.reset({
                        date: { value: certificate.createdAt, disabled: true },
                        patient: {
                            dni: { value: certificate.patient.dni, disabled: true },
                            sex: { value: certificate.patient.sex, disabled: true },
                            lastName: { value: certificate.patient.lastName, disabled: true },
                            firstName: { value: certificate.patient.firstName, disabled: true }
                        },
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

    private _filter(value: string): any[] {
        const filterValue = value.toLowerCase();
        return this.obrasSociales.filter(os =>
            os.nombre.toLowerCase().includes(filterValue)
        );
    }

    initProfessionalForm() {
        this.today = new Date((new Date()));
        this.professionalData = this.authService.getLoggedUserId();
        this.certificateForm = this.fBuilder.group({
            _id: [''],
            professional: [this.professionalData],
            patient: this.fBuilder.group({
                dni: ['', [
                    Validators.required,
                    Validators.minLength(7),
                    Validators.pattern('^[0-9]*$')
                ]],
                lastName: ['', [
                    Validators.required
                ]],
                firstName: ['', [
                    Validators.required
                ]],
                sex: ['', [
                    Validators.required
                ]],
                otraOS: [false],
                obraSocial: this.fBuilder.group({
                    nombre: [''],
                    codigoPuco: [''],
                    numeroAfiliado: [{ value: '', disabled: true }]
                }),
            }),
            certificate: ['', [Validators.required]],
            anulateReason: [''],
            date: [this.today, [
                Validators.required
            ]],
        });
    }

    getPatientByDni(dniValue: string | null): void {
        if (dniValue !== null && ( dniValue.length === 7 || dniValue.length === 8)) {
            this.dniShowSpinner = true;
            this.apiPatients.getPatientByDni(dniValue).subscribe(
                res => {
                    if (res.length) {
                        this.patientSearch = res;
                    } else {
                        this.patientSearch = [];
                        this.patientLastName.setValue('');
                        this.patientFirstName.setValue('');
                        this.patientSex.setValue('');
                        this.patientOtraOS.setValue(false);
                    }
                    this.dniShowSpinner = false;
                });
            this.apiPatients.getPatientOSByDni(dniValue, this.patientSex.value).subscribe(
                res => {
                    if (Array.isArray(res)) {
                        this.obraSocial = res;
                    } else {
                        this.obraSocial = [];
                    }
                });
            this.apiPatients.getOS().subscribe(
                res => {
                    this.obrasSociales = (res as Array<any>);
                }
            );
        } else {
            this.dniShowSpinner = false;
        }
    }

    completePatientInputs(patient: Patient): void {// TODO: REC-38
        this.patientLastName.setValue(patient.lastName);
        this.patientFirstName.setValue(patient.firstName);
        this.patientSex.setValue(patient.sex);
    }

    onSubmitCertificateForm(professionalNgForm: FormGroupDirective): void {
        if (!this.anulateCertificate) {
            if (this.certificateForm.valid) {
                const newPrescription = this.certificateForm.value;
                this.isSubmit = true;
                this.certificateService.newCertificate(newPrescription).subscribe(
                    success => {
                        if (success) { this.formReset(professionalNgForm); }
                    });
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
        wasAnulate ? this.openDialog('anulate_certificate') : this.openDialog('created_certificate');
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

    get date(): AbstractControl {
        return this.certificateForm.get('date');
    }

    get patientDni(): AbstractControl {
        const patient = this.certificateForm.get('patient');
        return patient.get('dni');
    }

    get patientLastName(): AbstractControl {
        const patient = this.certificateForm.get('patient');
        return patient.get('lastName');
    }

    get patientFirstName(): AbstractControl {
        const patient = this.certificateForm.get('patient');
        return patient.get('firstName');
    }

    get patientSex(): AbstractControl {
        const patient = this.certificateForm.get('patient');
        return patient.get('sex');
    }
    get patientOtraOS(): AbstractControl {
        const patient = this.certificateForm.get('patient');
        return patient.get('otraOS');
    }

    get patientCertificate(): AbstractControl {
        const patient = this.certificateForm.get('certificate');
        return patient.get('certificate');
    }

    get patientReason(): AbstractControl {
        const patient = this.certificateForm.get('anulateReason');
        return patient.get('anulateReason');
    }

    displayOs(os: any): string {
        return os && os.nombre ? os.nombre : '';
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
            date: this.today,
            patient: {
                dni: { value: '', disabled: false },
                sex: { value: '', disabled: false },
                lastName: { value: '', disabled: false },
                firstName: { value: '', disabled: false },
                obraSocial: {
                    nombre: '',
                    codigoPuco: '',
                    numeroAfiliado: ''
                }
            },
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
        this.isCertificateShown = false;
    }

    showCertificados(): void {
        this.isFormShown = false;
        this.isCertificateShown = true;
    }
}
