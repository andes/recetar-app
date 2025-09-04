import { Component, Input, Output, EventEmitter, OnInit, ViewChild, forwardRef } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl, Validators, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PatientsService } from '@services/patients.service';
import { Patient } from '@interfaces/patients';
import { ThemePalette } from '@angular/material/core';
import { debounceTime } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

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
export class PatientFormComponent implements OnInit, ControlValueAccessor {
    @Input() showObraSocial = false;
    @Input() appearance = 'fill';
    @Input() layout = 'row'; // 'row' or 'column'
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

    private onChange = (value: any) => { };
    private onTouched = () => { };

    constructor(
        private fBuilder: FormBuilder,
        private apiPatients: PatientsService
    ) {
        this.initPatientForm();
    }

    ngOnInit(): void {
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

    private initPatientForm(): void {
        const baseForm = {
            dni: ['', [
                Validators.required,
                Validators.minLength(7),
                Validators.pattern('^[0-9]*$')
            ]],
            lastName: ['', Validators.required],
            firstName: ['', Validators.required],
            sex: ['', Validators.required],
            otraOS: [{ value: false, disabled: true }],
            os: this.fBuilder.group({
                nombre: [''],
                codigoPuco: [''],
                numeroAfiliado: [{ value: '', disabled: true }]
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
        if (dniValue !== null && (dniValue.length === 7 || dniValue.length === 8)) {
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
                        if (this.showObraSocial) {
                            this.patientOtraOS?.setValue(false);
                            this.patientOtraOS?.disable();
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

        if (dniValue && sexValue && dniValue.length >= 7 && dniValue.length <= 8) {
            this.loadPatientOS(dniValue);
        }
    }

    /**
     * Carga la obra social del paciente según su DNI y sexo
     * @param dniValue DNI del paciente
     */
    private loadPatientOS(dniValue: string): void {
        if (this.showObraSocial && dniValue && this.patientSex.value) {
            this.apiPatients.getPatientOSByDni(dniValue, this.patientSex.value).subscribe(
                res => {
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
                }
            );
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
        this.patientSex.setValue('');
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
        this.patientSex.disable({ onlySelf: true, emitEvent: false });
    }

    private enableFields(): void {
        this.fieldsDisabled = false;
        this.patientLastName.enable();
        this.patientFirstName.enable();
        this.patientSex.enable();
    }

    completePatientInputs(patient: Patient): void {
        // Guardar referencia del paciente seleccionado
        this.selectedPatient = patient;

        this.patientLastName.setValue(patient.lastName);
        this.patientFirstName.setValue(patient.firstName);
        this.patientSex.setValue(patient.sex);

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

    get patientSex(): AbstractControl {
        return this.patientForm.get('sex')!;
    }

    get patientOtraOS(): AbstractControl | null {
        return this.showObraSocial ? this.patientForm.get('otraOS') : null;
    }

    get patientObraSocial(): AbstractControl | null {
        return this.showObraSocial ? this.patientForm.get('os') : null;
    }

    get displayPatientName(): string {
        if (this.selectedPatient && this.selectedPatient.nombreAutopercibido) {
            return this.selectedPatient.nombreAutopercibido;
        }
        return this.patientFirstName.value || '';
    }

    // Método público para resetear el formulario
    resetForm(): void {
        this.selectedPatient = null;
        this.patientForm.reset();
        this.patientSearch = [];
        this.fieldsDisabled = false;
        this.lastSearchedDni = '';
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
}
