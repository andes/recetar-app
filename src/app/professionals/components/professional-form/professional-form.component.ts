import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl, Validators, FormArray, FormGroupDirective, FormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
// import { SuppliesService } from '@services/supplies.service';
import { SnomedSuppliesService } from '@services/snomedSupplies.service';
import ISnomedConcept from '@interfaces/supplies';
import { PatientsService } from '@root/app/services/patients.service';
import { PrescriptionsService } from '@services/prescriptions.service';
import { AuthService } from '@auth/services/auth.service';
import { Patient } from '@interfaces/patients';
import { ThemePalette } from '@angular/material/core';
import { Prescriptions } from '@interfaces/prescriptions';
import { ProfessionalDialogComponent } from '@professionals/components/professional-dialog/professional-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { InteractionService } from '@professionals/interaction.service';
import { step, stepLink } from '@animations/animations.template';
import SnomedConcept from '@interfaces/snomedConcept';
import Supplies from '@interfaces/supplies';
import { map, startWith, catchError, debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { fadeOutCollapseOnLeaveAnimation } from 'angular-animations';
import { CertificatesService } from '@services/certificates.service';


@Component({
    selector: 'app-professional-form',
    templateUrl: './professional-form.component.html',
    styleUrls: ['./professional-form.component.sass'],
    animations: [
        step,
        stepLink
    ]
})
export class ProfessionalFormComponent implements OnInit {
    obraSocialControl = new FormControl('');
    filteredObrasSociales: Observable<any[]>;

    onOsSelected(selectedOs: any): void {
        const osGroup = this.professionalForm.get('patient.os') as FormGroup;
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

    professionalForm: FormGroup;

    filteredSupplies = [];
    request;
    storedSupplies = [];
    patientSearch: Patient[];
    sex_options: string[] = ['Femenino', 'Masculino', 'Otro'];
    genero_options: string[] = [''];
    today = new Date();
    professionalData: any;
    readonly maxQSupplies: number = 10;
    readonly spinnerColor: ThemePalette = 'primary';
    readonly spinnerDiameter: number = 30;
    isSubmit = false;
    dniShowSpinner = false;
    supplySpinner: { show: boolean }[] = [{ show: false }, { show: false }];
    myPrescriptions: Prescriptions[] = [];
    isEdit = false;
    isEditCertificate = false;
    isFormShown = true;
    isCertificateShown = false;
    devices: any = {
        mobile: false,
        tablet: false,
        desktop: false
    };
    obraSocial: any[];
    obrasSociales: any[];
    otraOS = false;
    private certificateSubscription;
    public certificate;

    constructor(
        // private suppliesService: SuppliesService,
        private snomedSuppliesService: SnomedSuppliesService,
        private fBuilder: FormBuilder,
        private apiPatients: PatientsService,
        private apiPrescriptions: PrescriptionsService,
        private authService: AuthService,
        public dialog: MatDialog,
        private _interactionService: InteractionService,
        private certificateService: CertificatesService
    ) { }

    ngOnInit(): void {

        this.initProfessionalForm();
        // On confirm delete prescription
        this._interactionService.deletePrescription$
            .subscribe(
                prescription => {
                    this.deletePrescription(prescription);
                }
            );

        // on DNI changes
        this.patientDni.valueChanges.subscribe(
            dniValue => {
                this.getPatientByDni(dniValue);
            }
        );

        // get prescriptions
        this.apiPrescriptions.getByUserId(this.authService.getLoggedUserId()).subscribe();

        this.professionalForm.get('patient.otraOS')?.valueChanges.subscribe(() => {
            const osGroup = this.professionalForm.get('patient.os') as FormGroup;
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

        // Suscribirse a cambios en editCertificate
        this.certificateSubscription = this.certificateService.certificate$.subscribe(
            certificate => {
                if (certificate) {
                    this.isCertificateShown = true;
                }
            }
        );
    }

    // eslint-disable-next-line @angular-eslint/use-lifecycle-interface
    ngOnDestroy() {
        if (this.certificateSubscription) {
            this.certificateSubscription.unsubscribe();
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
        this.professionalForm = this.fBuilder.group({
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
                os: this.fBuilder.group({
                    nombre: [''],
                    codigoPuco: [''],
                    numeroAfiliado: [{ value: '', disabled: true }]
                })
            }),
            date: [this.today, [
                Validators.required
            ]],
            triple: [false],
            supplies: this.fBuilder.array([])
        });
        this.addSupply();
        // this.dni.nativeElement.focus();
    }


    onSuppliesAddControlQuantityValidators(index: number, add: boolean) {
        const quantity = this.suppliesForm.controls[index].get('quantity');
        if (add && !quantity.validator) {
            quantity.setValidators([
                Validators.required,
                Validators.min(1)
            ]);
        } else if (!add && !!quantity.validator) {
            quantity.clearValidators();
        }
        quantity.updateValueAndValidity();
    }

    getPatientByDni(dniValue: string | null): void {
        if (dniValue !== null && (dniValue.length === 7 || dniValue.length === 8)) {
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

    onSubmitProfessionalForm(professionalNgForm: FormGroupDirective): void {
        if (this.professionalForm.valid) {
            const newPrescription = this.professionalForm.value;
            this.isSubmit = true;
            if (!this.isEdit) {
                this.apiPrescriptions.newPrescription(newPrescription).subscribe(
                    success => {
                        if (success) { this.formReset(professionalNgForm); }
                    });

            } else {
                // edit
                this.apiPrescriptions.editPrescription(newPrescription).subscribe(
                    success => {
                        if (success) { this.formReset(professionalNgForm); }
                    });
            }
        }
    }

    private handleSupplyError(err) {
        if (err.error.length > 0) {
            err.error.map(err => {
                // handle supplies error
                this.suppliesForm.controls.map(control => {
                    if (control.get('supply').value === err.supply) {
                        control.get('supply').setErrors({ invalid: err.message });
                    }
                });
            });
        }
        this.isSubmit = false;
    }

    private formReset(professionalNgForm: FormGroupDirective) {

        this.isEdit ? this.openDialog('updated') : this.openDialog('created');
        this.clearForm(professionalNgForm);
        this.isSubmit = false;
        this.dni.nativeElement.focus();
    }

    deletePrescription(prescription: Prescriptions) {
        this.apiPrescriptions.deletePrescription(prescription._id).subscribe(
            success => {
            },
            err => {
                this.openDialog('error-dispensed');
            }
        );
    }

    // Show a dialog
    openDialog(aDialogType: string, aPrescription?: Prescriptions, aText?: string): void {
        const dialogRef = this.dialog.open(ProfessionalDialogComponent, {
            width: '400px',
            data: { dialogType: aDialogType, prescription: aPrescription, text: aText }
        });
    }

    get professional(): AbstractControl {
        return this.professionalForm.get('professional');
    }

    get date(): AbstractControl {
        return this.professionalForm.get('date');
    }

    get suppliesForm(): FormArray {
        return this.professionalForm.get('supplies') as FormArray;
    }

    get patientDni(): AbstractControl {
        const patient = this.professionalForm.get('patient');
        return patient.get('dni');
    }

    get patientLastName(): AbstractControl {
        const patient = this.professionalForm.get('patient');
        return patient.get('lastName');
    }

    get patientFirstName(): AbstractControl {
        const patient = this.professionalForm.get('patient');
        return patient.get('firstName');
    }

    get patientSex(): AbstractControl {
        const patient = this.professionalForm.get('patient');
        return patient.get('sex');
    }
    get patientOtraOS(): AbstractControl {
        const patient = this.professionalForm.get('patient');
        return patient.get('otraOS');
    }
    displayOs(os: any): string {
        return os && os.nombre ? os.nombre : '';
    }

    displayFn(supply): string {
        return supply ? supply : '';
    }
    onSupplySelected(supply, index: number) {
        const control = this.suppliesForm.at(index); // Obtiene el FormGroup en la posición del array
        const supplyControl = control.get('supply');

        // Actualiza el valor del 'supply' con el 'term' en el 'name'
        supplyControl.get('name').setValue(supply.term); // Actualiza solo el 'term' en 'name'

        // También actualizamos el 'snomedConcept' completo con todos los campos
        supplyControl.setValue({
            name: supply.term, // Solo el 'term' va en 'name'
            snomedConcept: {
                term: supply.term,
                fsn: supply.fsn,
                conceptId: supply.conceptId,
                semanticTag: supply.semanticTag
            }
        });
    }

    addSupply() {
        const supplies = this.fBuilder.group({
            supply: this.fBuilder.group({
                name: ['', [
                    Validators.required
                ]],
                snomedConcept:
                    this.fBuilder.group({
                        term: [''],
                        fsn: [''],
                        conceptId: [''],
                        semanticTag: ['']
                    }),
            }),
            quantity: ['', [
                Validators.required,
                Validators.min(1)
            ]],
            quantityPresentation: ['', [
                Validators.required,
                Validators.min(1)
            ]],
            diagnostic: ['', [Validators.required]],
            indication: [''],
            duplicate: [false],
            triplicate: [false]
        });
        this.suppliesForm.push(supplies);
        this.supplySpinner.push({ show: false });
        this.subscribeToSupplyChanges(supplies, this.suppliesForm.length - 1);
    }

    subscribeToSupplyChanges(control: FormGroup, index: number) {
        control.get('supply.name').valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            filter((supply: string) => typeof supply === 'string' && supply.length > 3),
            switchMap((supply: string) => {
                this.supplySpinner[index] = { show: true };
                return this.snomedSuppliesService.get(supply).pipe(
                    catchError(() => {
                        this.supplySpinner[index] = { show: false };
                        return of([]);
                    })
                );
            })
        ).subscribe((res) => {
            this.supplySpinner[index] = { show: false };
            this.filteredSupplies = [...res];
        });
    }

    deleteSupply(index: number) {
        this.suppliesForm.removeAt(index);
        this.supplySpinner.splice(index, 1);
    }

    // set form with prescriptions values and disabled npt editable fields
    editPrescription(e) {
        this.professionalForm.reset({
            _id: e._id,
            date: e.date,
            diagnostic: e.diagnostic,
            observation: e.observation,
            patient: {
                dni: { value: e.patient.dni, disabled: true },
                sex: { value: e.patient.sex, disabled: true },
                lastName: { value: e.patient.lastName, disabled: true },
                firstName: { value: e.patient.firstName, disabled: true }
            },
            supplies: e.supplies
        });
        this.isEdit = true;
        this.isFormShown = true;
    }

    // reset the form as intial values
    clearForm(professionalNgForm: FormGroupDirective) {
        professionalNgForm.resetForm();
        this.professionalForm.reset({
            _id: '',
            professional: this.professionalData,
            date: this.today,
            patient: {
                dni: { value: '', disabled: false },
                sex: { value: '', disabled: false },
                lastName: { value: '', disabled: false },
                firstName: { value: '', disabled: false }
            },
        });
        this.isEdit = false;
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
