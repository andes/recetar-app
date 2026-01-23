import { Component, Input, Output, EventEmitter, OnInit, ViewChild, forwardRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl, Validators, ControlValueAccessor, NG_VALUE_ACCESSOR, ValidatorFn } from '@angular/forms';
import { PatientsService } from '@services/patients.service';
import { Patient } from '@interfaces/patients';
import { ThemePalette } from '@angular/material/core';
import { debounceTime } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
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

@Component({
    selector: 'app-patient-form',
    templateUrl: './patient-form.component.html',
    styleUrls: ['./patient-form.component.sass'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PatientFormComponent),
            multi: true
        }
    ]
})
export class PatientFormComponent implements OnInit, OnDestroy, ControlValueAccessor {
    @Input() showObraSocial = false;
    @Input() appearance = 'fill';
    @Input() layout = 'row'; // 'row' or 'column'
    @Input() showFechaNac = false;
    @Output() patientFound = new EventEmitter<Patient>();
    @Output() patientNotFound = new EventEmitter<void>();

    @ViewChild('dni', { static: true }) dni: any;

    patientForm: FormGroup;
    patientSearch: Patient[] = [];
    sex_options: string[] = ['Femenino', 'Masculino', 'Otro'];
    readonly spinnerColor: ThemePalette = 'primary';
    dniShowSpinner = false;
    obraSocial: any[] = [];
    obrasSociales: any[] = [];
    filteredObrasSociales: Observable<any[]>;
    fieldsDisabled = false;
    lastSearchedDni = '';
    selectedPatient: Patient | null = null;
    ambito: 'publico' | 'privado';
    minDate = new Date('1900-01-01');
    maxDate = new Date();
    dniMinLength = 6;
    dniMaxLength = 8;

    private onChange = (value: any) => { };
    private onTouched = () => { };
    private subscriptions: Subscription = new Subscription();
    private osRequestSubscription: Subscription | null = null;
    private lastOsRequestKey = '';

    constructor(
        private fBuilder: FormBuilder,
        private apiPatients: PatientsService,
        private ambitoService: AmbitoService
    ) {
        this.initPatientForm();
    }

    ngOnInit(): void {
        // Suscribirse a los cambios del ámbito
        const ambitoSubscription = this.ambitoService.getAmbitoSeleccionado.subscribe(ambito => {
            this.ambito = ambito;
            this.showFechaNac = this.ambito === 'publico';
            // Actualizar el formulario si ya está inicializado
            if (this.patientForm) {
                this.updateFechaNacValidators();
            }
        });
        this.subscriptions.add(ambitoSubscription);

        // Obtener el ámbito actual del servicio
        const currentAmbito = this.ambitoService.getAmbito();
        if (currentAmbito) {
            this.ambito = currentAmbito;
            this.showFechaNac = this.ambito === 'publico';
        }
        // Suscribirse a cambios en el DNI
        this.patientDni.valueChanges.pipe(
            debounceTime(400)
        ).subscribe(
            dniValue => {
                this.handleDniChange(dniValue);
                this.checkAndLoadPatientOS();
            }
        );

        // Suscribirse a cambios en el sexo para cargar obra social cuando se complete
        this.patientSex.valueChanges.subscribe(
            () => {
                this.checkAndLoadPatientOS();
            }
        );

        // Suscribirse a todos los cambios del formulario para propagarlos
        this.patientForm.valueChanges.subscribe(() => {
            if (this.onChange) {
                const rawValue = this.patientForm.getRawValue();

                this.onChange(rawValue);
            }
        });

        // Suscribirse a cambios en otraOS si está habilitado
        if (this.showObraSocial) {
            this.patientForm.get('otraOS')?.valueChanges.subscribe((checked) => {
                const osGroup = this.patientObraSocial as FormGroup;
                if (osGroup) {
                    if (checked) {
                        // Cuando otraOS está activado, habilitar número de afiliado
                        osGroup.get('numeroAfiliado')?.enable();
                        // Limpiar los campos de obra social para permitir seleccionar otra
                        osGroup.patchValue({
                            nombre: '',
                            codigoPuco: ''
                        });
                    } else {
                        // Cuando otraOS está desactivado, restablecer valores
                        osGroup.reset();
                        osGroup.get('numeroAfiliado')?.disable();

                        // Recargar la obra social del paciente si hay DNI y sexo
                        const dniValue = this.patientDni?.value;
                        if (dniValue && this.patientSex?.value) {
                            this.loadPatientOS(dniValue);
                        }
                    }
                }
            });

            // Configurar autocompletado de obras sociales
            this.filteredObrasSociales = this.patientForm.get('os.nombre')?.valueChanges.pipe(
                startWith(''),
                map(value => {
                    const name = typeof value === 'string' ? value : value?.nombre;
                    const useOtraOS = this.patientForm.get('otraOS')?.value === true;

                    // Si el valor coincide exactamente con una obra social seleccionada, no filtrar
                    const sourceList = useOtraOS ? this.obrasSociales : this.obraSocial;
                    const isExactMatch = sourceList && sourceList.some(os => os.nombre === name);

                    return this._filterOS(isExactMatch ? '' : name, useOtraOS);
                })
            ) || new Observable();

            this.loadObrasSociales();
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
        if (this.osRequestSubscription) {
            this.osRequestSubscription.unsubscribe();
            this.osRequestSubscription = null;
        }
    }

    private initPatientForm(): void {
        const baseForm = {
            dni: ['', [
                Validators.required,
                Validators.minLength(this.dniMinLength),
                Validators.pattern('^[0-9]*$')
            ]],
            lastName: ['', Validators.required],
            firstName: ['', Validators.required],
            nombreAutopercibido: ['', Validators.required],
            sex: ['', Validators.required],
            fechaNac: ['', this.showFechaNac ? [
                Validators.required,
                validDateValidator()
            ] : [validDateValidator()]],
            otraOS: [{ value: false, disabled: true }],
            os: this.fBuilder.group({
                nombre: [''],
                codigoPuco: [''],
                numeroAfiliado: [{ value: '', disabled: true }, [Validators.required, Validators.pattern('^[0-9]*$')]]
            })
        };

        this.patientForm = this.fBuilder.group(baseForm);
    }

    private handleDniChange(dniValue: string | null): void {
        if (dniValue !== this.lastSearchedDni) {
            this.lastSearchedDni = dniValue || '';

            // Si el DNI cambió, resetear campos y habilitar edición
            if (this.fieldsDisabled) {
                this.enableFields();
                this.resetPatientFields();
            }

            this.getPatientByDni(dniValue);
        }
    }

    private getPatientByDni(dniValue: string | null): void {
        if (dniValue !== null && (dniValue.length === this.dniMinLength || dniValue.length === this.dniMaxLength)) {
            this.dniShowSpinner = true;
            this.apiPatients.getPatientByDni(dniValue).subscribe(
                res => {
                    if (res.length) {
                        this.patientSearch = res;
                        this.patientFound.emit(res[0]);
                        if (this.showObraSocial) {
                            this.patientOtraOS?.enable();
                        }
                    } else {
                        this.patientSearch = [];
                        this.patientNotFound.emit();
                        this.resetPatientFields();
                        // Resetear showFechaNac cuando no se encuentra paciente
                        this.showFechaNac = this.ambito === 'publico';
                        this.updateFechaNacValidators();
                        if (this.showObraSocial) {
                            this.patientOtraOS?.setValue(false);
                            this.patientOtraOS?.enable(); // Habilitar para permitir agregar obra social aunque el paciente no exista
                        }
                    }
                    this.dniShowSpinner = false;
                },
                () => {
                    this.dniShowSpinner = false;
                    this.patientSearch = [];
                    this.resetPatientFields();
                }
            );
        } else {
            this.dniShowSpinner = false;
            this.patientSearch = [];
        }
    }

    private checkAndLoadPatientOS(): void {
        const dniValue = this.patientDni.value;
        const sexValue = this.patientSex.value;

        if (dniValue && sexValue && dniValue.length >= this.dniMinLength && dniValue.length <= this.dniMaxLength) {
            this.loadPatientOS(dniValue);
            // Habilitar el checkbox otraOS cuando se tienen DNI y sexo válidos
            if (this.showObraSocial) {
                this.patientOtraOS?.enable();
            }
        }
    }

    /**
     * Carga la obra social del paciente según su DNI y sexo
     * @param dniValue DNI del paciente
     */
    private loadPatientOS(dniValue: string): void {
        const sexValue = this.patientSex.value;
        if (this.showObraSocial && dniValue && sexValue) {
            const requestKey = `${dniValue}|${sexValue}`;
            // Evitar repetir la misma consulta si los parámetros no cambiaron
            if (this.lastOsRequestKey === requestKey) {
                return;
            }
            this.lastOsRequestKey = requestKey;

            // Cancelar cualquier request anterior en curso
            if (this.osRequestSubscription) {
                this.osRequestSubscription.unsubscribe();
                this.osRequestSubscription = null;
            }

            this.osRequestSubscription = this.apiPatients.getPatientOSByDni(dniValue, sexValue).subscribe({
                next: (res) => {
                    // Guardar todas las obras sociales del paciente
                    this.obraSocial = Array.isArray(res) && res.length > 0 ? res : [];

                    // Si no está activada la opción "Elegir otra cobertura social"
                    if (!this.patientForm.get('otraOS')?.value) {
                        const osGroup = this.patientObraSocial as FormGroup;
                        if (osGroup) {
                            // No asignar automáticamente la obra social al formulario
                            // Solo limpiar los campos si no tiene obra social
                            if (this.obraSocial.length === 0) {
                                osGroup.reset();
                            } else {
                                // Limpiar los campos para que el usuario seleccione manualmente
                                osGroup.patchValue({
                                    nombre: '',
                                    codigoPuco: '',
                                    numeroAfiliado: ''
                                });
                            }

                            // El campo nombre siempre debe estar activo
                            osGroup.get('nombre')?.enable();

                            // El número de afiliado solo se habilita si otraOS está activado
                            osGroup.get('numeroAfiliado')?.disable();
                        }
                    }

                    // Forzar actualización del filtro
                    const nombreControl = this.patientForm.get('os.nombre');
                    if (nombreControl) {
                        nombreControl.updateValueAndValidity();
                    }
                },
                error: () => {
                    // En caso de error, liberar referencia para nuevas solicitudes
                    this.osRequestSubscription = null;
                },
                complete: () => {
                    // Al completar, liberar referencia para futuras solicitudes
                    this.osRequestSubscription = null;
                }
            });
        }
    }

    private loadObrasSociales(): void {
        if (this.showObraSocial) {
            this.apiPatients.getOS().subscribe(
                res => {
                    this.obrasSociales = (res as Array<any>);
                }
            );
        }
    }

    private resetPatientFields(): void {
        // Limpiar referencia del paciente seleccionado
        this.selectedPatient = null;

        this.patientLastName.setValue('');
        this.patientFirstName.setValue('');
        this.patientNombreAutopercibido.setValue('');
        this.patientSex.setValue('');
        this.patientFechaNac.setValue('');
        if (this.showObraSocial) {
            const osGroup = this.patientForm.get('os') as FormGroup;
            osGroup.reset();
            osGroup.get('numeroAfiliado')?.disable();
        }

        // Emitir los cambios al formulario padre
        if (this.onChange) {
            this.onChange(this.patientForm.getRawValue());
        }
    }

    private disableFields(): void {
        this.fieldsDisabled = true;
        this.patientLastName.disable({ onlySelf: true, emitEvent: false });
        this.patientFirstName.disable({ onlySelf: true, emitEvent: false });
        this.patientNombreAutopercibido.disable({ onlySelf: true, emitEvent: false });
        this.patientSex.disable({ onlySelf: true, emitEvent: false });
        this.patientFechaNac.disable({ onlySelf: true, emitEvent: false });
    }

    private enableFields(): void {
        this.fieldsDisabled = false;
        this.patientLastName.enable();
        this.patientFirstName.enable();
        this.patientNombreAutopercibido.enable();
        this.patientSex.enable();
        this.patientFechaNac.enable();
    }

    completePatientInputs(patient: Patient): void {
        // Guardar referencia del paciente seleccionado
        this.selectedPatient = patient;

        this.patientLastName.setValue(patient.lastName);
        this.patientFirstName.setValue(patient.firstName);
        this.patientNombreAutopercibido.setValue(patient.nombreAutopercibido || '');
        this.patientSex.setValue(patient.sex);

        // Configurar fechaNac según el ámbito y si el paciente tiene idMPI
        this.showFechaNac = this.ambito === 'publico' && !patient.idMPI;
        this.updateFechaNacValidators();
        this.patientFechaNac.setValue(patient.fechaNac);

        // Deshabilitar campos después de autocompletar
        this.disableFields();

        // Cargar la obra social cuando se selecciona un paciente
        if (this.showObraSocial && patient.dni) {
            // Habilitar el campo otraOS para permitir cambiar la obra social
            this.patientOtraOS?.enable();
            this.patientOtraOS?.setValue(false);

            this.loadPatientOS(patient.dni);
        }

        // Emitir los cambios al formulario padre
        if (this.onChange) {
            this.onChange(this.patientForm.getRawValue());
        }
        if (this.onTouched) {
            this.onTouched();
        }

        this.patientFound.emit(patient);
    }

    onOsSelected(selectedOs: any): void {
        if (this.showObraSocial) {
            const osGroup = this.patientObraSocial as FormGroup;

            if (osGroup && selectedOs) {
                let osObject = selectedOs;

                // Si selectedOs es un string (nombre), buscar el objeto completo
                if (typeof selectedOs === 'string') {
                    osObject = this.obraSocial.find(os => os.nombre === selectedOs) ||
                        this.obrasSociales.find(os => os.nombre === selectedOs);
                }

                if (osObject) {
                    // Asignar solo el valor del nombre, no el objeto completo
                    osGroup.patchValue({
                        nombre: osObject.nombre,
                        codigoPuco: osObject.codigoPuco
                    });
                    const numeroAfiliadoControl = osGroup.get('numeroAfiliado');
                    if (numeroAfiliadoControl) {
                        numeroAfiliadoControl.enable();
                    }

                    // Emitir los cambios al formulario padre
                    if (this.onChange) {
                        this.onChange(this.patientForm.getRawValue());
                    }
                }
            }
        }
    }

    /**
     * Filtra las obras sociales según el texto de búsqueda y si se debe mostrar todas o solo las del paciente
     * @param value Texto de búsqueda
     * @param showAllOptions Si es true, muestra todas las obras sociales, si es false solo las del paciente
     * @returns Lista filtrada de obras sociales
     */
    private _filterOS(value: string, showAllOptions: boolean): any[] {
        const useAllObrasSociales = showAllOptions || !this.obraSocial || this.obraSocial.length === 0;

        let sourceList = [];

        if (useAllObrasSociales) {
            sourceList = this.obrasSociales;
        } else {
            // Mostrar todas las obras sociales del paciente, no solo la primera
            sourceList = this.obraSocial;
        }

        // Si no hay valor de búsqueda, devolver la lista completa según la fuente
        if (!value || value === '') {
            return sourceList.slice();
        }

        // Si hay valor de búsqueda, filtrar según el texto
        const filterValue = value.toLowerCase();
        return sourceList.filter(os =>
            os.nombre.toLowerCase().includes(filterValue)
        );
    }

    displayOs = (nombre: string): string => {
        return nombre || '';
    };

    // ControlValueAccessor implementation
    writeValue(value: any): void {
        if (value) {
            this.patientForm.patchValue(value, { emitEvent: false });
        } else {
            this.patientForm.reset();
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.patientForm.disable();
        } else {
            this.patientForm.enable();
        }
    }

    // Getters para acceso a controles
    get patientDni(): AbstractControl {
        return this.patientForm.get('dni')!;
    }

    get patientLastName(): AbstractControl {
        return this.patientForm.get('lastName')!;
    }

    get patientFirstName(): AbstractControl {
        return this.patientForm.get('firstName')!;
    }

    get patientNombreAutopercibido(): AbstractControl {
        return this.patientForm.get('nombreAutopercibido')!;
    }

    get patientSex(): AbstractControl {
        return this.patientForm.get('sex')!;
    }

    get patientOtraOS(): AbstractControl | null {
        return this.showObraSocial ? this.patientForm.get('otraOS') : null;
    }

    get patientObraSocial(): AbstractControl | null {
        return this.showObraSocial ? this.patientForm.get('os') : null;
    }

    get patientFechaNac(): AbstractControl {
        return this.patientForm.get('fechaNac')!;
    }

    get displayPatientName(): string {
        return this.patientFirstName.value || '';
    }

    // Método público para resetear el formulario
    resetForm(): void {
        this.selectedPatient = null;
        this.patientForm.reset();
        this.patientSearch = [];
        this.fieldsDisabled = false;
        this.lastSearchedDni = '';
        // Resetear showFechaNac según el ámbito
        this.showFechaNac = this.ambito === 'publico';
        this.updateFechaNacValidators();
        if (this.showObraSocial) {
            this.patientOtraOS?.setValue(false);
            this.patientOtraOS?.disable();
            const osGroup = this.patientForm.get('os') as FormGroup;
            osGroup.get('numeroAfiliado')?.disable();
        }
    }

    // Método público para obtener el valor del formulario
    getFormValue(): any {
        return this.patientForm.getRawValue();
    }

    // Método público para verificar si el formulario es válido
    isValid(): boolean {
        return this.patientForm.valid;
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

    markAllFieldsTouched(): void {
        Object.keys(this.patientForm.controls).forEach(key => {
            const control = this.patientForm.get(key);
            control?.markAsTouched();
        });
    }
}
