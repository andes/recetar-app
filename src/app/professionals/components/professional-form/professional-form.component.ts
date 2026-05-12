import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormGroupDirective, ValidatorFn, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { step, stepLink } from '@animations/animations.template';
import { AmbitoService } from '@auth/services/ambito.service';
import { AuthService } from '@auth/services/auth.service';
import { Prescriptions } from '@interfaces/prescriptions';
import { PrescriptionsListComponent } from '@professionals/components/prescriptions-list/prescriptions-list.component';
import { ProfessionalDialogComponent } from '@professionals/components/professional-dialog/professional-dialog.component';
import { InteractionService } from '@professionals/interaction.service';
import { OrganizacionFormSessionService } from '@professionals/services/organizacion-form-session.service';
import { AndesPrescriptionsService } from '@services/andesPrescription.service';
import { CertificatesService } from '@services/certificates.service';
import { PrescriptionsService } from '@services/prescriptions.service';
import { SnomedSuppliesService } from '@services/snomedSupplies.service';
import { PatientFormComponent } from '@shared/components/patient-form/patient-form.component';
import { of, Subject, Subscription, Observable, forkJoin } from 'rxjs';
import { map, startWith, catchError, debounceTime, distinctUntilChanged, filter, switchMap, take, takeUntil } from 'rxjs/operators';
import { Patient } from '@interfaces/patients';

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

@Component({
    selector: 'app-professional-form',
    templateUrl: './professional-form.component.html',
    styleUrls: ['./professional-form.component.sass'],
    animations: [
        step,
        stepLink
    ]
})
export class ProfessionalFormComponent implements OnInit, OnDestroy {
    obraSocialControl = new FormControl('');
    filteredObrasSociales: Observable<any[]>;
    organizacionControl = new FormControl('');

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
    /** _id del paciente seleccionado (para consulta al endpoint /recetas/verificar) */
    selectedPatientId: string | null = null;
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
        public dialog: MatDialog,
        private snomedSuppliesService: SnomedSuppliesService,
        private fBuilder: FormBuilder,
        private apiPrescriptions: PrescriptionsService, // privado
        private authService: AuthService,
        private _interactionService: InteractionService,
        private certificateService: CertificatesService,
        private ambitoService: AmbitoService,
        private organizacionSessionService: OrganizacionFormSessionService,
        private andesService: AndesPrescriptionsService
    ) { }

    ngOnInit(): void {
        // Suscribirse a los cambios del ámbito
        const ambitoSubscription = this.ambitoService.getAmbitoSeleccionado.subscribe(ambito => {
            this.ambito = ambito;
            // Actualizar el formulario si ya está inicializado
            if (this.professionalForm) {
                this.professionalForm.patchValue({ ambito: this.ambito });
                this.configureOrganizacionByAmbito();
            }
        });
        this.subscriptions.add(ambitoSubscription);

        this.initProfessionalForm();

        // On confirm delete prescription
        const deletePrescriptionSub = this._interactionService.deletePrescription$
            .pipe(takeUntil(this.destroy$))
            .subscribe(
                () => {
                    // Solo actualizar la lista si está visible
                    if (this.prescriptionsList && this.currentTab === 'list') {
                        this.prescriptionsList.loadDataForSelectedType();
                    }
                }
            );
        this.subscriptions.add(deletePrescriptionSub);

        const prescriptionsSub = this.apiPrescriptions.getByUserId(this.authService.getLoggedUserId()).subscribe();
        this.subscriptions.add(prescriptionsSub);

        this.professionalForm.get('trimestral')?.valueChanges.subscribe(isChecked => {
            if (isChecked) {
                this.suppliesForm.controls.forEach((supplyControl: FormGroup) => {
                    supplyControl.get('triplicate')?.setValue(false);
                });
            }
        });

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
        this.rollbackPendingOrganizacionesOnLeave();
        this.destroy$.next();
        this.destroy$.complete();
        this.subscriptions.unsubscribe();
        if (this.certificateSubscription) {
            this.certificateSubscription.unsubscribe();
        }
    }

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
            organizacion: this.organizacionControl,
            patient: [null, Validators.required],
            date: [this.today, [
                Validators.required
            ]],
            trimestral: [false],
            supplies: this.fBuilder.array([]),
            ambito: [this.ambito]
        });
        this.configureOrganizacionByAmbito();
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
        if (!this.professionalForm.valid) { return; }

        const newPrescription = { ...this.professionalForm.value };
        const shouldPersistOrganizacion = this.isAmbitoPublico();

        if (!shouldPersistOrganizacion) {
            delete newPrescription.organizacion;
        }

        newPrescription.supplies.forEach(element => {
            if (element.isMagistral) {
                element.supply.type = 'magistral';
            }
        });

        this.isSubmit = true;

        const handleSuccess = () => {
            if (shouldPersistOrganizacion) {
                this.organizacionSessionService.commitChanges().subscribe(
                    () => this.formReset(professionalNgForm),
                    () => this.formReset(professionalNgForm)
                );
            } else {
                this.formReset(professionalNgForm);
            }
        };

        // Sólo validar contra Andes cuando es ámbito público y es creación
        if (!this.isEdit && this.isAmbitoPublico()) {
            const pacienteDni = professionalNgForm.value?.patient?.dni;
            const supplyConceptIds: string[] = (this.suppliesForm.controls || [])
                .map((ctrl: FormGroup) => ctrl.value?.supply?.snomedConcept?.conceptId)
                .filter(Boolean);

            // Si no tenemos el DNI del paciente, no podemos verificar: crear directo
            if (!pacienteDni) {
                this.apiPrescriptions.newPrescription(newPrescription).subscribe({
                    next: (success) => { if (success) { handleSuccess(); } },
                    error: (err) => this.handleSupplyError(err)
                });
                return;
            }

            // Verificar en paralelo si ya existe receta activa para cada conceptId
            const verificaciones$ = supplyConceptIds.map(conceptId =>
                this.andesService.verificarRecetaExistente(pacienteDni, conceptId).pipe(
                    catchError(() => of(false))
                )
            );

            forkJoin(verificaciones$).subscribe({
                next: (resultados: boolean[]) => {
                    const hasDuplicate = resultados.some(existe => existe);
                    const payload = { ...newPrescription };

                    if (hasDuplicate) { payload.ambito = 'privado'; }

                    if (hasDuplicate) {
                        const dialogRef = this.dialog.open(ProfessionalDialogComponent, {
                            width: '400px',
                            data: { dialogType: 'andes_warning' }
                        });

                        dialogRef.afterClosed().pipe(take(1)).subscribe(() => {
                            this.apiPrescriptions.newPrescription(payload).subscribe({
                                next: (success) => {
                                    if (success) { handleSuccess(); }
                                },
                                error: (err) => this.handleSupplyError(err)
                            });
                        });
                    } else {
                        this.apiPrescriptions.newPrescription(payload).subscribe({
                            next: (success) => {
                                if (success) { handleSuccess(); }
                            },
                            error: (err) => this.handleSupplyError(err)
                        });
                    }
                },
                error: () => {
                    // Error inesperado en forkJoin: crear igualmente
                    this.apiPrescriptions.newPrescription(newPrescription).subscribe({
                        next: (success) => {
                            if (success) { handleSuccess(); }
                        },
                        error: (e) => this.handleSupplyError(e)
                    });
                }
            });
            return;
        }

        // Editar o ámbito privado: flujo original
        if (!this.isEdit) {
            this.apiPrescriptions.newPrescription(newPrescription).subscribe({
                next: (success) => { if (success) { handleSuccess(); } },
                error: (err) => this.handleSupplyError(err)
            });
        } else {
            this.apiPrescriptions.editPrescription(newPrescription).subscribe({
                next: (success) => { if (success) { handleSuccess(); } },
                error: (err) => this.handleSupplyError(err)
            });
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

    private formReset(professionalNgForm: FormGroupDirective, dialogTypeOverride?: string) {
        if (dialogTypeOverride) {
            this.openDialog(dialogTypeOverride);
        } else {
            this.isEdit ? this.openDialog('updated') : this.openDialog('created');
        }
        this.clearForm(professionalNgForm, false);
        this.isSubmit = false;
    }

    // Show a dialog
    openDialog(aDialogType: string, aPrescription?: Prescriptions, aText?: string): void {
        this.dialog.open(ProfessionalDialogComponent, {
            width: '400px',
            data: { dialogType: aDialogType, prescription: aPrescription, text: aText }
        });
    }

    onPatientFound(patient: Patient): void {
        this.selectedPatientId = patient?._id || null;
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

    displayFn(supply): string {
        return supply ? supply : '';
    }

    onSupplySelected(supply, index: number) {
        const control = this.suppliesForm.at(index); // Obtiene el FormGroup en la posición del array
        const supplyControl = control.get('supply');

        // Actualiza el valor del 'supply' con el 'term' en el 'name'
        supplyControl.patchValue({
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
            isMagistral: [false],
            supply: this.fBuilder.group({
                name: ['', [
                    Validators.required,
                    this.medicationSelectedValidator()
                ]],
                description: [''],
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
            diagnostic: ['', [Validators.required, this.noWhitespaceValidator()]],
            indication: [''],
            packageQuantity: [''],
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

        this.subscribeToMagistralChanges(supplies, this.suppliesForm.length - 1);
        this.subscribeToSupplyChanges(supplies, this.suppliesForm.length - 1);
        this.subscribeToTriplicateChanges(supplies, this.suppliesForm.length - 1);
        this.subscribeToDuplicateChanges(supplies, this.suppliesForm.length - 1);
    }

    subscribeToMagistralChanges(control: FormGroup, index: number) {
        const magistralControl = control.get('isMagistral');
        if (magistralControl) {
            magistralControl.valueChanges.subscribe(isMagistral => {
                this.updateSupplyValidators(control, isMagistral);
            });
        }
    }

    updateSupplyValidators(control: FormGroup, isMagistral: boolean) {
        const nameControl = control.get('supply.name');
        const descriptionControl = control.get('supply.description');
        const quantityPresentationControl = control.get('quantityPresentation');
        const packageQuantityControl = control.get('packageQuantity');

        if (isMagistral) {
            nameControl?.setValidators([Validators.required]);
            descriptionControl?.setValidators([Validators.required]);
            quantityPresentationControl?.clearValidators();
            packageQuantityControl?.setValidators([Validators.required, Validators.min(1)]);
        } else {
            nameControl?.setValidators([Validators.required, medicationSelectedValidator()]);
            descriptionControl?.clearValidators();
            quantityPresentationControl?.setValidators([Validators.required, Validators.min(1)]);
            packageQuantityControl?.clearValidators();
        }

        nameControl?.updateValueAndValidity();
        descriptionControl?.updateValueAndValidity();
        quantityPresentationControl?.updateValueAndValidity();
        packageQuantityControl?.updateValueAndValidity();

        if (isMagistral) {
            control.get('supply.snomedConcept')?.reset();
            quantityPresentationControl?.reset();
        } else {
            descriptionControl?.reset();
            packageQuantityControl?.reset();
        }
    }

    subscribeToSupplyChanges(control: FormGroup, index: number) {
        control.get('supply.name').valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe((supply: string) => {
            const isMagistral = control.get('isMagistral')?.value;

            if (!isMagistral && typeof supply === 'string') {
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

    medicationSelectedValidator(): ValidatorFn {
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

    noWhitespaceValidator(): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } | null => {
            if (!control.value) {
                return null;
            }

            const isWhitespace = (control.value || '').trim().length === 0;
            return isWhitespace ? { 'whitespace': { value: control.value } } : null;
        };
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
    clearForm(professionalNgForm: FormGroupDirective, shouldRollback = true) {
        const organizacion = this.organizacionControl.value;
        professionalNgForm.resetForm();
        const currentAmbito = this.ambitoService.getAmbito();

        const applyReset = (organizacionValue: any) => {
            this.professionalForm.reset({
                _id: '',
                professional: this.professionalData,
                organizacion: this.isAmbitoPublico() ? organizacionValue : null,
                date: this.today,
                patient: null,
                ambito: currentAmbito
            });
            this.configureOrganizacionByAmbito();
        };

        if (shouldRollback) {
            this.organizacionSessionService.rollbackChanges().subscribe(
                () => applyReset(this.organizacionSessionService.getPreferredOrganizacion()),
                () => applyReset(organizacion)
            );
        } else {
            applyReset(organizacion);
        }

        // Resetear también el componente patient-form
        if (this.patientFormComponent) {
            this.patientFormComponent.resetForm();
        }

        // Limpiar el ID del paciente seleccionado
        this.selectedPatientId = null;
    }

    rollbackPendingOrganizacionesOnLeave(): void {
        if (!this.organizacionSessionService.hasPendingChanges()) {
            return;
        }

        const rollbackSub = this.organizacionSessionService.rollbackChanges().subscribe();
        this.subscriptions.add(rollbackSub);
    }

    anulateCertificate() {
        this.isCertificateShown = false;
        this.isFormShown = false;
        this.certificateService.setCertificate(null);
        this.selectType = 'certificados';
    }

    onCertificateCreated() {
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

    private configureOrganizacionByAmbito(): void {
        if (!this.organizacionControl) {
            return;
        }

        if (this.isAmbitoPublico()) {
            this.organizacionControl.enable({ emitEvent: false });
            this.organizacionControl.setValidators([Validators.required]);
            this.organizacionControl.updateValueAndValidity({ emitEvent: false });
            return;
        }

        if (this.organizacionSessionService.hasPendingChanges()) {
            const rollbackSub = this.organizacionSessionService.rollbackChanges().subscribe();
            this.subscriptions.add(rollbackSub);
        }

        this.organizacionControl.setValue(null, { emitEvent: false });
        this.organizacionControl.clearValidators();
        this.organizacionControl.disable({ emitEvent: false });
        this.organizacionControl.updateValueAndValidity({ emitEvent: false });
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
