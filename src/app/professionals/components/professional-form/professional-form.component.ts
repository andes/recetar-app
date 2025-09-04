import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { step, stepLink } from '@animations/animations.template';
import { AuthService } from '@auth/services/auth.service';
import { Prescriptions } from '@interfaces/prescriptions';
import { PrescriptionsListComponent } from '@professionals/components/prescriptions-list/prescriptions-list.component';
import { ProfessionalDialogComponent } from '@professionals/components/professional-dialog/professional-dialog.component';
import { InteractionService } from '@professionals/interaction.service';
import { CertificatesService } from '@services/certificates.service';
import { PrescriptionsService } from '@services/prescriptions.service';
import { SnomedSuppliesService } from '@services/snomedSupplies.service';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, startWith, switchMap } from 'rxjs/operators';


@Component({
    selector: 'app-professional-form',
    templateUrl: './professional-form.component.html',
    styleUrls: ['./professional-form.component.sass'],
    animations: [
        step,
        stepLink
    ]
})
export class ProfessionalFormComponent implements OnInit, AfterViewInit {
    obraSocialControl = new FormControl('');
    filteredObrasSociales: Observable<any[]>;
    professionalForm: FormGroup;
    filteredSupplies = [];
    request;
    storedSupplies = [];
    genero_options: string[] = [''];
    today = new Date();
    professionalData: any;
    readonly maxQSupplies: number = 10;
    readonly spinnerColor: ThemePalette = 'primary';
    readonly spinnerDiameter: number = 30;
    isSubmit = false;
    supplySpinner: { show: boolean }[] = [{ show: false }, { show: false }];
    myPrescriptions: Prescriptions[] = [];
    isEditCertificate = false;
    isFormShown = true;
    currentTab = 'form';
    isListShown = false;
    isCertificateShown = false;
    devices: any = {
        mobile: false,
        tablet: false,
        desktop: false
    };
    obraSocial: any[];
    obrasSociales: any[];
    otraOS = false;
    selectType;
    private certificateSubscription;
    public certificate;

    @ViewChild(PrescriptionsListComponent) prescriptionsList: PrescriptionsListComponent;
    @ViewChild('dni', { static: true }) dni: any;

    constructor(
        private snomedSuppliesService: SnomedSuppliesService,
        private fBuilder: FormBuilder,
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

        this.apiPrescriptions.getByUserId(this.authService.getLoggedUserId()).subscribe();

        this.professionalForm.get('trimestral')?.valueChanges.subscribe(isChecked => {
            if (isChecked) {
                this.suppliesForm.controls.forEach((supplyControl: FormGroup) => {
                    supplyControl.get('triplicate')?.setValue(false);
                });
            }
        });

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
                patientData: [null, Validators.required],
                otraOS: [{ value: false, disabled: true }],
                os: this.fBuilder.group({
                    nombre: [''],
                    codigoPuco: [''],
                    numeroAfiliado: [{ value: '', disabled: true }]
                })
            }),
            date: [this.today, [
                Validators.required
            ]],
            trimestral: [false],
            supplies: this.fBuilder.array([])
        });
        this.addSupply();
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

    onSubmitProfessionalForm(professionalNgForm: FormGroupDirective): void {
        this.isSubmit = true;
        if (this.professionalForm.valid) {

            const formValue = this.professionalForm.getRawValue();
            const patientFormData = formValue.patient.patientData;
            // Obtener la obra social del formulario de paciente
            const prescription: any = {
                date: formValue.date,
                patient: {
                    dni: patientFormData.dni,
                    firstName: patientFormData.firstName,
                    lastName: patientFormData.lastName,
                    sex: patientFormData.sex,
                    os: patientFormData.os // La obra social está dentro del objeto patientData
                },
                professional: formValue.professional,
                trimestral: formValue.trimestral,
                supplies: formValue.supplies
            };

            // Si no hay obra social en patientData, usar la del formulario principal
            if (!prescription.patient.os || Object.keys(prescription.patient.os).length === 0) {
                prescription.patient.os = formValue.patient.os;
            }

            this.apiPrescriptions.newPrescription(prescription).subscribe(
                success => {
                    if (success) { this.formReset(professionalNgForm); }
                },
                () => {
                    // En caso de error en la petición, resetear el estado de loading
                    this.isSubmit = false;
                }
            );
        } else {
            // Si el formulario no es válido, resetear el estado de loading
            this.isSubmit = false;
        }
    }

    private formReset(professionalNgForm: FormGroupDirective) {

        this.openDialog('created');
        this.clearForm(professionalNgForm);
        this.isSubmit = false;
    }

    deletePrescription(prescription: Prescriptions) {
        this.apiPrescriptions.deletePrescription(prescription._id).subscribe(
            () => {
            },
            () => {
                this.openDialog('error-dispensed');
            }
        );
    }

    // Show a dialog
    openDialog(aDialogType: string, aPrescription?: Prescriptions, aText?: string): void {
        this.dialog.open(ProfessionalDialogComponent, {
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

    get patientData(): AbstractControl {
        return this.professionalForm.get('patient.patientData');
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
            trimestral: [false],
            triplicate: [false],
            triplicateData: this.fBuilder.group({
                serie: ['', [Validators.required, Validators.maxLength(1), Validators.pattern('^[a-zA-Z]$')]],
                numero: ['', Validators.required]
            }),
        });

        const triplicateDataGroup = supplies.get('triplicateData') as FormGroup;
        triplicateDataGroup.get('serie')?.disable();
        triplicateDataGroup.get('numero')?.disable();

        this.suppliesForm.push(supplies);
        this.supplySpinner.push({ show: false });
        this.subscribeToSupplyChanges(supplies, this.suppliesForm.length - 1);
        this.subscribeToTriplicateChanges(supplies, this.suppliesForm.length - 1);
        this.subscribeToDuplicateChanges(supplies, this.suppliesForm.length - 1);
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

    subscribeToTriplicateChanges(control: FormGroup, index: number) {
        const triplicateControl = control.get('triplicate');
        const triplicateDataGroup = control.get('triplicateData') as FormGroup;
        const serieControl = triplicateDataGroup?.get('serie');
        const numeroControl = triplicateDataGroup?.get('numero');

        if (triplicateControl && serieControl && numeroControl) {
            if (triplicateControl.value) {
                serieControl.enable();
                numeroControl.enable();
            } else {
                serieControl.disable();
                numeroControl.disable();
                serieControl.reset();
                numeroControl.reset();
            }

            triplicateControl.valueChanges.subscribe(isChecked => {
                if (isChecked) {
                    serieControl.enable();
                    numeroControl.enable();
                    control.get('duplicate')?.setValue(false);
                    this.professionalForm.get('trimestral')?.setValue(false);
                } else {
                    serieControl.disable();
                    numeroControl.disable();
                    serieControl.reset();
                    numeroControl.reset();
                }
            });
        }
    }

    subscribeToDuplicateChanges(control: FormGroup, index: number) {
        const duplicateControl = control.get('duplicate');
        const triplicateControl = control.get('triplicate');

        if (duplicateControl && triplicateControl) {
            duplicateControl.valueChanges.subscribe(isChecked => {
                if (isChecked) {
                    triplicateControl.setValue(false);
                }
            });
        }
    }

    deleteSupply(index: number) {
        this.suppliesForm.removeAt(index);
        this.supplySpinner.splice(index, 1);
    }


    // reset the form as intial values
    clearForm(professionalNgForm: FormGroupDirective) {
        professionalNgForm.resetForm();
        // this.patientSearch = [];
        this.professionalForm.reset({
            _id: '',
            professional: this.professionalData,
            date: this.today,
            patient: {
                dni: { value: '', disabled: false },
                sex: { value: '', disabled: false },
                lastName: { value: '', disabled: false },
                firstName: { value: '', disabled: false },
                otraOS: { value: false, disabled: true },
                os: {
                    nombre: '',
                    codigoPuco: '',
                    numeroAfiliado: { value: '', disabled: true }
                }
            },
        });
    }

    anulateCertificate() {
        this.isCertificateShown = false;
        this.isFormShown = false;
        this.certificateService.setCertificate(null);
        this.selectType = 'certificados';
    }

    ngAfterViewInit() {
        // Implementation not needed for this case
    }

    onCertificateCreated() {
        // Set the selected type to 'certificados' in the prescriptions list component
        if (this.prescriptionsList) {
            this.prescriptionsList.selectedType = 'certificados';
            this.prescriptionsList.onSelectedTypeChange();
        }
    }

    showForm(): void {
        this.isFormShown = true;
        this.isCertificateShown = false;
        this.currentTab = 'form';
    }

    showList(): void {
        this.isFormShown = false;
        this.isListShown = false;
        this.currentTab = 'list';
    }

    showCertificados(): void {
        this.isFormShown = false;
        this.isCertificateShown = true;
        this.currentTab = 'certificates';
    }

    showPractices(): void {
        this.isFormShown = false;
        this.currentTab = 'practices';
    }
}
