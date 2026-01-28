import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { StockService, Insumo } from '@services/stock.service';
import Supplies from '@interfaces/supplies';
import { debounceTime, distinctUntilChanged, switchMap, catchError, startWith, map } from 'rxjs/operators';
import { of, Subscription, Observable } from 'rxjs';
import { PrescriptionsService } from '@services/prescriptions.service';
import { AuthService } from '@auth/services/auth.service';
import { PatientsService } from '@root/app/services/patients.service';
import { AmbitoService } from '@auth/services/ambito.service';
import { Patient } from '@interfaces/patients';
import { MatDialog } from '@angular/material/dialog';
import { StockDialogComponent } from './stock-dialog/stock-dialog.component';

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
  selector: 'app-stock',
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.sass']
})

export class StockComponent implements OnInit, OnDestroy {
  termControl = new FormControl('');
  typeControl = new FormControl('', Validators.required);
  quantityControl = new FormControl('', [Validators.required, Validators.min(1)]);
  specificationControl = new FormControl('');
  requiresSpecificationControl = new FormControl(false);
  filteredSupplies: Insumo[] = [];
  supplies: Supplies[] = [];
  loading = false;
  selectedSupply: Insumo | null = null;
  saving = false;

  private subscriptions = new Subscription();

  patientForm: FormGroup;
  patientSearch: Patient[];
  dniShowSpinner = false;
  showFechaNac = false;
  ambito: 'publico' | 'privado';
  minDate = new Date('1900-01-01');
  maxDate = new Date();
  today = new Date();

  obraSocialControl = new FormControl('');
  filteredObrasSociales: Observable<any[]>;
  obraSocial: any[];
  obrasSociales: any[];

  constructor(
    private stockService: StockService,
    private cd: ChangeDetectorRef,
    private prescriptionsService: PrescriptionsService,
    private authService: AuthService,
    private patientsService: PatientsService,
    private ambitoService: AmbitoService,
    private fBuilder: FormBuilder,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    const ambitoSubscription = this.ambitoService.getAmbitoSeleccionado.subscribe(ambito => {
      this.ambito = ambito;
      this.showFechaNac = this.isAmbitoPublico();
      if (this.patientForm) {
        this.updateFechaNacValidators();
      }
    });
    this.subscriptions.add(ambitoSubscription);

    this.initPatientForm();

    const dniChangesSub = this.patientDni.valueChanges.pipe(
      debounceTime(400)
    ).subscribe(
      dniValue => {
        this.getPatientByDni(dniValue);
      }
    );

    this.subscriptions.add(dniChangesSub);

    const otraOSSub = this.patientForm.get('otraOS')?.valueChanges.subscribe(() => {
      const osGroup = this.patientForm.get('os') as FormGroup;

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
        return name ? this._filter(name) : (this.obrasSociales ? this.obrasSociales.slice() : []);
      })
    );

    // Configurar búsqueda de insumos
    this.termControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string) => {
        if (typeof term === 'string' && term.length > 2) {
          this.loading = true;

          return this.stockService.search(term).pipe(
            catchError(() => {
              this.loading = false;
              return of([]);
            })
          );
        }
        this.filteredSupplies = [];
        return of([]);
      })
    ).subscribe((res: Insumo[]) => {
      this.loading = false;
      this.filteredSupplies = res || [];

      this.cd.markForCheck();
    });

    this.termControl.valueChanges.subscribe(value => {
      if (!value) {
        this.selectedSupply = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  displaySupply(supply: Insumo | null): string {
    return supply ? (supply.insumo || supply.supply || supply.name || supply.term || '') : '';
  }

  onSupplySelected(supply: Insumo) {
    let displayName = supply.insumo || supply.supply || supply.name || supply.term || '';

    // if (supply.tipo) {
    //   displayName += ` (${supply.tipo})`;
    // }

    this.selectedSupply = supply;
    this.termControl.setValue(displayName, { emitEvent: false });

    if (supply.tipo) {
      if (supply.tipo.toLowerCase() === 'nutricion') {
        this.typeControl.setValue('Nutrición');
      } else if (supply.tipo.toLowerCase() === 'dispositivo') {
        this.typeControl.setValue('Dispositivo');
      }
    }

    if (supply.requiereEspecificacion) {
      this.requiresSpecificationControl.setValue(true);
      this.requiresSpecificationControl.disable();
    } else {
      this.requiresSpecificationControl.setValue(false);
      this.requiresSpecificationControl.enable();
    }
  }

  addInsumo() {
    if (!this.selectedSupply || !this.typeControl.value || !this.quantityControl.valid) {
      return;
    }

    const requiresSpec = this.requiresSpecificationControl.value || this.selectedSupply.requiereEspecificacion;

    if (requiresSpec && !this.specificationControl.value) {
      return;
    }



    const newInsumo: Supplies = {
      _id: this.selectedSupply._id || '',
      quantity: this.quantityControl.value.toString(),
      type: this.typeControl.value === 'Nutrición' ? 'nutrition' : 'device',
      name: this.selectedSupply.insumo || this.selectedSupply.name || '',
      requiresSpecification: requiresSpec || false,
      specification: this.specificationControl.value
    };

    this.supplies.push(newInsumo);
    this.clearForm();
  }

  removeSupply(index: number) {
    this.supplies.splice(index, 1);
  }

  createPrescription() {
    if (this.supplies.length === 0) {
      return;
    }

    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      alert('Por favor, complete los datos del paciente.');
      return;
    }

    this.saving = true;

    const newPrescription = {
      professional: this.authService.getLoggedUserId(),
      patient: this.patientForm.value,
      date: new Date(),
      supplies: this.supplies.map(item => ({
        supply: {
          name: item.name,
          type: item.type,
          requiresSpecification: item.requiresSpecification,
          specification: item.specification
        },
        quantity: item.quantity,

      })),
      status: 'pendiente'
    };

    console.log(newPrescription);

    this.prescriptionsService.newPrescription(newPrescription as any).subscribe(
      () => {
        this.saving = false;
        this.supplies = [];
        this.dialog.open(StockDialogComponent, {
          data: {
            dialogType: 'created',
            text: 'La prescripción de insumos se ha creado correctamente.'
          }
        });
        this.initPatientForm();
        this.patientSearch = [];
        this.obraSocial = [];
      },
      (error) => {
        console.error('Error al crear prescripción:', error);
        this.saving = false;
        alert('Error al guardar la prescripción. Por favor, intente nuevamente.');
      }
    );
  }

  clearForm() {
    this.termControl.setValue('', { emitEvent: false });
    this.typeControl.reset();
    this.quantityControl.reset();
    this.specificationControl.reset();
    this.requiresSpecificationControl.reset(false);
    this.requiresSpecificationControl.enable();
    this.selectedSupply = null;
    this.filteredSupplies = [];
  }

  clearSelection() {
    this.termControl.setValue('');
    this.selectedSupply = null;
  }

  initPatientForm() {
    const currentAmbito = this.ambitoService.getAmbito();
    if (currentAmbito) {
      this.ambito = currentAmbito;
    }
    this.showFechaNac = this.isAmbitoPublico();

    this.patientForm = this.fBuilder.group({
      dni: ['', [
        Validators.required,
        Validators.minLength(7),
        Validators.pattern('^[0-9]*$')
      ]],
      lastName: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      sex: ['', [Validators.required]],
      fechaNac: ['', this.isAmbitoPublico() ? [
        Validators.required,
        validDateValidator()
      ] : [validDateValidator()]],
      otraOS: [{ value: false, disabled: true }],
      os: this.fBuilder.group({
        nombre: [''],
        codigoPuco: [''],
        numeroAfiliado: [{ value: '', disabled: true }, [Validators.required, Validators.pattern('^[0-9]*$')]]
      }),
    });
  }

  getPatientByDni(dniValue: string | null): void {
    if (dniValue !== null && (dniValue.length === 7 || dniValue.length === 8)) {
      this.dniShowSpinner = true;
      this.patientsService.getPatientByDni(dniValue).subscribe(
        res => {
          if (res.length) {
            this.patientSearch = res;
            this.patientOtraOS.enable();
          } else {
            this.patientSearch = [];
            this.patientLastName.setValue('');
            this.patientFirstName.setValue('');
            this.patientSex.setValue('');
            this.patientFechaNac.setValue('');
            this.showFechaNac = this.isAmbitoPublico();
            this.patientOtraOS.setValue(false);
            this.patientOtraOS.disable();
          }
          this.dniShowSpinner = false;
        });

      this.patientsService.getPatientOSByDni(dniValue, this.patientSex.value).subscribe(
        res => {
          if (Array.isArray(res)) {
            this.obraSocial = res;
          } else {
            this.obraSocial = [];
          }
        });
      this.patientsService.getOS().subscribe(
        res => {
          this.obrasSociales = (res as Array<any>);
        }
      );
    } else {
      this.dniShowSpinner = false;
    }
  }

  completePatientInputs(patient: Patient): void {
    this.patientLastName.setValue(patient.lastName);
    this.patientFirstName.setValue(patient.firstName);
    this.patientSex.setValue(patient.sex);
    this.showFechaNac = this.isAmbitoPublico() && !patient.idMPI;
    this.updateFechaNacValidators();
    this.patientFechaNac.setValue(patient.fechaNac);
  }

  updateFechaNacValidators(): void {
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

  isAmbitoPublico(): boolean {
    return this.ambito === 'publico';
  }

  get patientDni(): AbstractControl {
    return this.patientForm.get('dni');
  }

  get patientLastName(): AbstractControl {
    return this.patientForm.get('lastName');
  }

  get patientFirstName(): AbstractControl {
    return this.patientForm.get('firstName');
  }

  get patientSex(): AbstractControl {
    return this.patientForm.get('sex');
  }

  get patientFechaNac(): AbstractControl {
    return this.patientForm.get('fechaNac');
  }

  get patientOtraOS(): AbstractControl {
    return this.patientForm.get('otraOS');
  }

  onOsSelected(selectedOs: any): void {
    const osGroup = this.patientForm.get('os') as FormGroup;
    if (osGroup && selectedOs) {
      osGroup.patchValue({
        nombre: selectedOs.nombre,
        codigoPuco: selectedOs.codigoPuco
      });
      const numeroAfiliadoControl = osGroup.get('numeroAfiliado');
      if (numeroAfiliadoControl) {
        numeroAfiliadoControl.enable();
        numeroAfiliadoControl.markAsTouched();
      }
    }
  }

  existenObrasSociales(array: any[]): boolean {
    if (!array || array.length === 0) {
      return false;
    }
    return !array.every(item => item === null || item === undefined);
  }

  private _filter(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.obrasSociales.filter(os =>
      os.nombre.toLowerCase().includes(filterValue)
    );
  }

  displayOs(os: any): string {
    return os && os.nombre ? os.nombre : '';
  }
}

