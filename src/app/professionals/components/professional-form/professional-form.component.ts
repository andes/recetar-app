import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl, Validators, FormArray, FormGroupDirective, FormControl, ValidatorFn } from '@angular/forms';
import { Observable, of, Subscription } from 'rxjs';
// import { SuppliesService } from '@services/supplies.service';
import { SnomedSuppliesService } from '@services/snomedSupplies.service';
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
import { map, startWith, catchError, debounceTime, distinctUntilChanged, filter, switchMap, takeUntil } from 'rxjs/operators';
import { fadeOutCollapseOnLeaveAnimation } from 'angular-animations';
import { CertificatesService } from '@services/certificates.service';
import { PrescriptionsListComponent } from '@professionals/components/prescriptions-list/prescriptions-list.component';
import { Subject } from 'rxjs';
import { AmbitoService } from '@auth/services/ambito.service';

// Validador personalizado para fechas
function validDateValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        if (!control.value) {
            return null; // Si no hay valor, no validamos (required se encarga)
        }

        const date = new Date(control.value);
        const isValidDate = date instanceof Date && !isNaN(date.getTime());

        if (!isValidDate) {
            return { 'invalidDate': { value: control.value } };
        }

        // Validar que la fecha no sea futura para fecha de nacimiento
        const today = new Date();
        if (date > today) {
            return { 'futureDate': { value: control.value } };
        }

        // Validar que la fecha sea razonable (no muy antigua)
        const minDate = new Date('1900-01-01');
        if (date < minDate) {
            return { 'tooOldDate': { value: control.value } };
        }

        return null;
    };
}

function medicationSelectedValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        if (!control.value) {
            return null; 
        }

        const supplyGroup = control.parent;
        if (!supplyGroup) {
            return null;
        }

        const snomedConcept = supplyGroup.get('snomedConcept');
        if (!snomedConcept || !snomedConcept.value || !snomedConcept.value.conceptId) {
            return { 'medicationNotSelected': { value: control.value } };
        }

        return null;
    };
}

function noWhitespaceValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        if (!control.value) {
            return null; 
        }

        const isWhitespace = (control.value || '').trim().length === 0;
        return isWhitespace ? { 'whitespace': { value: control.value } } : null;
    };
}

@Component({
    selector: 'app-professional-form',
    templateUrl: './professional-form.component.html',
    styleUrls: ['./professional-form.component.sass'],
    animations: [
        step,
        stepLink
    ]
})
export class ProfessionalFormComponent implements OnInit, OnDestroy, AfterViewInit {
    obraSocialControl = new FormControl('');
    filteredObrasSociales: Observable<any[]>;

    // Suscripciones
    private subscriptions: Subscription = new Subscription();

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
    existenObrasSociales(array: any[]): boolean {
        if (!array || array.length === 0) {
            return false;
        }
        return !array.every(item => item === null || item === undefined);
    }
    @ViewChild('dni', { static: true }) dni: any;
    @ViewChild(PrescriptionsListComponent) prescriptionsList: PrescriptionsListComponent;

    private destroy$ = new Subject<void>();
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
    minDate = new Date('1900-01-01');
    maxDate = new Date();
    isSubmit = false;
    dniShowSpinner = false;
    supplySpinner: { show: boolean }[] = [{ show: false }, { show: false }];
    myPrescriptions: Prescriptions[] = [];
    isEditCertificate = false;
    isEdit = false;
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
    ambito: 'publico' | 'privado';
    showFechaNac = false;

    constructor(
        // private suppliesService: SuppliesService,
        private snomedSuppliesService: SnomedSuppliesService,
        private fBuilder: FormBuilder,
        private apiPatients: PatientsService,
        private apiPrescriptions: PrescriptionsService, // privado
        private authService: AuthService,
        public dialog: MatDialog,
        private _interactionService: InteractionService,
        private certificateService: CertificatesService,
        private ambitoService: AmbitoService
    ) { }

    ngOnInit(): void {
        // Suscribirse a los cambios del ámbito
        const ambitoSubscription = this.ambitoService.getAmbitoSeleccionado.subscribe(ambito => {
            this.ambito = ambito;
            this.showFechaNac = this.ambito === 'publico';
            // Actualizar el formulario si ya está inicializado
            if (this.professionalForm) {
                this.updateFechaNacValidators();
                this.professionalForm.patchValue({ ambito: this.ambito });
            }
        });
        this.subscriptions.add(ambitoSubscription);

        this.initProfessionalForm();

        // On confirm delete prescription
        const deletePrescriptionSub = this._interactionService.deletePrescription$
            .pipe(takeUntil(this.destroy$))
            .subscribe(
                prescription => {
                    // Solo actualizar la lista si está visible
                    if (this.prescriptionsList && this.currentTab === 'list') {
                        this.prescriptionsList.loadDataForSelectedType();
                    }
                }
            );
        this.subscriptions.add(deletePrescriptionSub);

        // on DNI changes
        const dniChangesSub = this.patientDni.valueChanges.pipe(
            debounceTime(400)
        ).subscribe(
            dniValue => {
                this.getPatientByDni(dniValue);
            }
        );
        this.subscriptions.add(dniChangesSub);

        // get prescriptions
        const prescriptionsSub = this.apiPrescriptions.getByUserId(this.authService.getLoggedUserId()).subscribe();
        this.subscriptions.add(prescriptionsSub);

        this.professionalForm.get('trimestral')?.valueChanges.subscribe(isChecked => {
            if (isChecked) {
                this.suppliesForm.controls.forEach((supplyControl: FormGroup) => {
                    supplyControl.get('triplicate')?.setValue(false);
                });
            }
        });

        const otraOSSub = this.professionalForm.get('patient.otraOS')?.valueChanges.subscribe(() => {
            const osGroup = this.professionalForm.get('patient.os') as FormGroup;
            osGroup.reset();
            osGroup.get('numeroAfiliado').disable();
        });
        if (otraOSSub) {
            this.subscriptions.add(otraOSSub);
        }

        // Configurar filtro de obras sociales
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

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.subscriptions.unsubscribe();
        if (this.certificateSubscription) {
            this.certificateSubscription.unsubscribe();
        }
    }

    ngAfterViewInit() {
        // Implementation not needed for this case
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

        // Obtener el ámbito actual del servicio
        const currentAmbito = this.ambitoService.getAmbito();
        if (currentAmbito) {
            this.ambito = currentAmbito;
        }

        this.showFechaNac = this.ambito === 'publico';

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
                otraOS: [{ value: false, disabled: true }],
                os: this.fBuilder.group({
                    nombre: [''],
                    codigoPuco: [''],
                    numeroAfiliado: [{ value: '', disabled: true }, [Validators.required, Validators.pattern('^[0-9]*$')]]
                }),
                fechaNac: ['', this.ambito === 'publico' ? [
                    Validators.required,
                    validDateValidator()
                ] : [validDateValidator()]]
            }),
            date: [this.today, [
                Validators.required
            ]],
            trimestral: [false],
            supplies: this.fBuilder.array([]),
            ambito: [this.ambito]
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

    getPatientByDni(dniValue: string | null): void {
        if (dniValue !== null && (dniValue.length === 7 || dniValue.length === 8)) {
            this.dniShowSpinner = true;
            this.apiPatients.getPatientByDni(dniValue).subscribe(
                res => {
                    if (res.length) {
                        this.patientSearch = res;
                        this.patientOtraOS.enable();
                    } else {
                        this.patientSearch = [];
                        this.patientLastName.setValue('');
                        this.patientFirstName.setValue('');
                        this.patientSex.setValue('');
                        this.patientOtraOS.setValue(false);
                        this.patientFechaNac.setValue('');
                        // Resetear showFechaNac cuando no se encuentra paciente
                        this.showFechaNac = this.ambito === 'publico';
                        // Deshabilitar el checkbox otraOS cuando no se encuentra un paciente
                        this.patientOtraOS.disable();
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

    private updateFechaNacValidators(): void {
        const fechaNacControl = this.patientFechaNac;
        if (this.showFechaNac) {
            fechaNacControl.setValidators([
                Validators.required,
                validDateValidator()
            ]);
        } else {
            fechaNacControl.setValidators([validDateValidator()]);
        }
        fechaNacControl.updateValueAndValidity();
    }

    completePatientInputs(patient: Patient): void {// TODO: REC-38
        this.patientLastName.setValue(patient.lastName);
        this.patientFirstName.setValue(patient.firstName);
        this.patientSex.setValue(patient.sex);
        this.showFechaNac = this.ambito === 'publico' && !patient.idMPI;
        this.updateFechaNacValidators();
        this.patientFechaNac.setValue(patient.fechaNac);
    }

    onSubmitProfessionalForm(professionalNgForm: FormGroupDirective): void {
        if (this.professionalForm.valid) {
            const newPrescription = this.professionalForm.value;
            this.isSubmit = true;
            if (!this.isEdit) {
                this.apiPrescriptions.newPrescription(newPrescription).subscribe(
                    success => {
                        if (success) { this.formReset(professionalNgForm); }
                    },
                    err => {
                        this.handleSupplyError(err);
                    });

            } else {
                // edit
                this.apiPrescriptions.editPrescription(newPrescription).subscribe(
                    success => {
                        if (success) { this.formReset(professionalNgForm); }
                    },
                    err => {
                        this.handleSupplyError(err);
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
    }

    // Show a dialog
    openDialog(aDialogType: string, aPrescription?: Prescriptions, aText?: string): void {
        const dialogRef = this.dialog.open(ProfessionalDialogComponent, {
            width: '400px',
            data: { dialogType: aDialogType, prescription: aPrescription, text: aText }
        });

        dialogRef.afterClosed().subscribe(result => {
            // console.log('The dialog was closed');
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

    get patientFechaNac(): AbstractControl {
        const patient = this.professionalForm.get('patient');
        return patient.get('fechaNac');
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

        supplyControl.get('name').updateValueAndValidity();
    }

    addSupply() {
        const supplies = this.fBuilder.group({
            supply: this.fBuilder.group({
                name: ['', [
                    Validators.required,
                    medicationSelectedValidator()
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
            diagnostic: ['', [Validators.required, noWhitespaceValidator()]],
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
            distinctUntilChanged()
        ).subscribe((supply: string) => {
            if (typeof supply === 'string') {
                const snomedConcept = control.get('supply.snomedConcept');
                const currentConceptId = snomedConcept?.get('conceptId')?.value;
                
                if (currentConceptId && supply !== snomedConcept?.get('term')?.value) {
                    snomedConcept.reset();
                    control.get('supply.name').updateValueAndValidity();
                }
                
                if (supply.length > 3) {
                    this.supplySpinner[index] = { show: true };
                    this.snomedSuppliesService.get(supply).pipe(
                        catchError(() => {
                            this.supplySpinner[index] = { show: false };
                            return of([]);
                        })
                    ).subscribe((res) => {
                        this.supplySpinner[index] = { show: false };
                        this.filteredSupplies = [...res];
                    });
                }
            }
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
                firstName: { value: e.patient.firstName, disabled: true },
                fechaNac: { value: e.patient.fechaNac, disabled: true }
            },
            supplies: e.supplies
        });
        this.isEdit = true;
        this.isFormShown = true;
    }

    // reset the form as intial values
    clearForm(professionalNgForm: FormGroupDirective) {
        professionalNgForm.resetForm();
        const currentAmbito = this.ambitoService.getAmbito();
        this.patientSearch = [];
        this.showFechaNac = currentAmbito === 'publico';
        this.professionalForm.reset({
            _id: '',
            professional: this.professionalData,
            date: this.today,
            patient: {
                dni: { value: '', disabled: false },
                sex: { value: '', disabled: false },
                lastName: { value: '', disabled: false },
                firstName: { value: '', disabled: false },
                fechaNac: { value: '', disabled: false },
                otraOS: { value: false, disabled: true },
                os: {
                    nombre: '',
                    codigoPuco: '',
                    numeroAfiliado: { value: '', disabled: true }
                }
            },
            ambito: currentAmbito
        });
        // Actualizar las validaciones después de resetear el formulario
        this.updateFechaNacValidators();
    }

    anulateCertificate() {
        this.isCertificateShown = false;
        this.isFormShown = false;
        this.certificateService.setCertificate(null);
        this.selectType = 'certificados';
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
