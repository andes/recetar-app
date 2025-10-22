import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormGroupDirective, Validators, ValidatorFn, FormControl } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { step, stepLink } from '@animations/animations.template';
import { AmbitoService } from '@auth/services/ambito.service';
import { AuthService } from '@auth/services/auth.service';
import { Prescriptions } from '@interfaces/prescriptions';
import { PrescriptionsListComponent } from '@professionals/components/prescriptions-list/prescriptions-list.component';
import { ProfessionalDialogComponent } from '@professionals/components/professional-dialog/professional-dialog.component';
import { InteractionService } from '@professionals/interaction.service';
import { PatientsService } from '@root/app/services/patients.service';
import { CertificatesService } from '@services/certificates.service';
import { PrescriptionsService } from '@services/prescriptions.service';
import { SnomedSuppliesService } from '@services/snomedSupplies.service';
import { PatientFormComponent } from '@shared/components/patient-form/patient-form.component';
import { of, Subject, Subscription, Observable } from 'rxjs';
import { map, startWith, catchError, debounceTime, distinctUntilChanged, filter, switchMap, takeUntil } from 'rxjs/operators';

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
    efectorControl = new FormControl('', Validators.required);

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
    @ViewChild(PrescriptionsListComponent) prescriptionsList: PrescriptionsListComponent;
    @ViewChild('patientForm') patientFormComponent: PatientFormComponent;

    private destroy$ = new Subject<void>();
    professionalForm: FormGroup;

    filteredSupplies = [];
    request;
    storedSupplies = [];
    today = new Date();
    professionalData: any;
    readonly maxQSupplies: number = 10;
    readonly spinnerColor: ThemePalette = 'primary';
    readonly spinnerDiameter: number = 30;
    minDate = new Date();
    maxDate = new Date(new Date().setMonth(new Date().getMonth() + 1));
    isSubmit = false;
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
    selectType;
    private certificateSubscription;
    public certificate;
    ambito: 'publico' | 'privado';

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
            // Actualizar el formulario si ya está inicializado
            if (this.professionalForm) {
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

        // Lógica de obras sociales y DNI removida - funcionalidad manejada por patient-form component

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

    // Método removido - funcionalidad manejada por patient-form component

    initProfessionalForm() {
        this.today = new Date((new Date()));
        this.minDate = new Date();
        this.maxDate = new Date(new Date().setMonth(new Date().getMonth() + 1));
        this.professionalData = this.authService.getLoggedUserId();

        // Obtener el ámbito actual del servicio
        const currentAmbito = this.ambitoService.getAmbito();
        if (currentAmbito) {
            this.ambito = currentAmbito;
        }

        this.professionalForm = this.fBuilder.group({
            _id: [''],
            professional: [this.professionalData],
            efector: this.efectorControl,
            patient: [null, Validators.required],
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

    // Método removido - funcionalidad manejada por patient-form component

    // Método removido - funcionalidad manejada por patient-form component

    // Método removido - funcionalidad manejada por patient-form component

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
        } else {
            // Marcar todos los campos como touched para mostrar errores
            this.markFormGroupTouched(this.professionalForm);
            // También marcar los campos del patient-form como touched
            if (this.patientFormComponent) {
                this.patientFormComponent.markAllFieldsTouched();
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

    // Getters removidos - funcionalidad manejada por patient-form component

    // Método removido - funcionalidad manejada por patient-form component

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
        const efector = this.efectorControl.value;
        professionalNgForm.resetForm();
        const currentAmbito = this.ambitoService.getAmbito();
        this.professionalForm.reset({
            _id: '',
            professional: this.professionalData,
            efector: efector,
            date: this.today,
            patient: null,
            ambito: currentAmbito
        });
        // Resetear también el componente patient-form
        if (this.patientFormComponent) {
            this.patientFormComponent.resetForm();
        }
        // Validaciones ahora manejadas por patient-form component
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

    isAmbitoPublico(): boolean {
        return this.ambito === 'publico';
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();

            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            } else if (control instanceof FormArray) {
                control.controls.forEach(arrayControl => {
                    if (arrayControl instanceof FormGroup) {
                        this.markFormGroupTouched(arrayControl);
                    } else {
                        arrayControl.markAsTouched();
                    }
                });
            }
        });
    }
}
