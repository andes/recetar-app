import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl, Validators, FormArray, FormGroupDirective } from '@angular/forms';
import { Observable, of } from 'rxjs';
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
import { catchError, debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';


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
  @ViewChild('dni', { static: true }) dni: any;

  professionalForm: FormGroup;
  filteredSupplies = [];
  request;
  storedSupplies = [];
  patientSearch: Patient[];
  sex_options: string[] = ["Femenino", "Masculino", "Otro"];
  genero_options: string[] = ['']
  today = new Date();
  professionalData: any;
  readonly maxQSupplies: number = 10;
  readonly spinnerColor: ThemePalette = 'primary';
  readonly spinnerDiameter: number = 30;
  isSubmit: boolean = false;
  dniShowSpinner: boolean = false;
  supplySpinner: { show: boolean }[] = [{ show: false }, { show: false }];
  myPrescriptions: Prescriptions[] = [];
  isEdit: boolean = false;
  isFormShown: boolean = true;
  devices: any = {
    mobile: false,
    tablet: false,
    desktop: false
  }

  constructor(
    private snomedSuppliesService: SnomedSuppliesService,
    private fBuilder: FormBuilder,
    private apiPatients: PatientsService,
    private apiPrescriptions: PrescriptionsService,
    private authService: AuthService,
    public dialog: MatDialog,
    private _interactionService: InteractionService
  ) { }

  ngOnInit(): void {

    this.initProfessionalForm();
    this._interactionService.deletePrescription$
      .subscribe(
        prescription => {
          this.deletePrescription(prescription);
        }
      );
    this.patientDni.valueChanges.subscribe(
      dniValue => {
        this.getPatientByDni(dniValue);
      }
    );
    this.apiPrescriptions.getByUserId(this.authService.getLoggedUserId()).subscribe(
      res => {
        // this.myPrescriptions = res;
      },
    );
    this.professionalForm.get('trimestral').valueChanges.subscribe(checked => {
      if (checked) {
        this.suppliesForm.controls.forEach(supplyControl => {
          const triplicateControl = supplyControl.get('triplicate');
          if (triplicateControl) {
            triplicateControl.setValue(false, { emitEvent: false });
            const triplicateControlData = supplyControl.get('triplicateData');
            triplicateControlData.disable();
          }
        });
      }
    });
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
          Validators.pattern("^[0-9]*$")
        ]],
        lastName: ['', [
          Validators.required
        ]],
        firstName: ['', [
          Validators.required
        ]],
        sex: ['', [
          Validators.required
        ]]
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

  getPatientByDni(dniValue: string | null): void {
    if (dniValue !== null && (dniValue.length == 7 || dniValue.length == 8)) {
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
          }
          this.dniShowSpinner = false;
        });
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
            if (success) this.formReset(professionalNgForm);
          },
          err => {
          });

      } else {
        // edit
        this.apiPrescriptions.editPrescription(newPrescription).subscribe(
          success => {
            if (success) this.formReset(professionalNgForm);
          },
          err => {
            //this.handleSupplyError(err);
          });
      }
    }
  }

  private handleSupplyError(err) {
    if (err.error.length > 0) {
      err.error.map(err => {
        // handle supplies error
        this.suppliesForm.controls.map(control => {
          if (control.get('supply').value == err.supply) {
            control.get('supply').setErrors({ invalid: err.message });
          }
        });
      });
    }
    this.isSubmit = false;
  }

  private formReset(professionalNgForm: FormGroupDirective) {

    this.isEdit ? this.openDialog("updated") : this.openDialog("created");
    this.clearForm(professionalNgForm);
    this.isSubmit = false;
    this.dni.nativeElement.focus();
  }

  deletePrescription(prescription: Prescriptions) {
    this.apiPrescriptions.deletePrescription(prescription._id).subscribe(
      success => {
        if (success) console.log('removed');
      },
      err => {
        this.openDialog("error-dispensed")
      }
    );
  }

  openDialog(aDialogType: string, aPrescription?: Prescriptions, aText?: string): void {
    const dialogRef = this.dialog.open(ProfessionalDialogComponent, {
      width: '400px',
      data: { dialogType: aDialogType, prescription: aPrescription, text: aText }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
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

  displayFn(supply): string {
    return supply ? supply : '';
  }
  onSupplySelected(supply, index: number) {
    const control = this.suppliesForm.at(index);
    const supplyControl = control.get('supply');
    supplyControl.get('name').setValue(supply.term);
    supplyControl.setValue({
      name: supply.term,
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
      diagnostic: [''],
      indication: [''],
      trimestral: [false],
      duplicate: [false],
      triplicate: [false],
      triplicateData: this.fBuilder.group({
        serie: ['', [Validators.required, Validators.maxLength(1), Validators.pattern('^[a-zA-Z]$')]],
        numero: ['', Validators.required]
      }),
    });
    const trimestralControl = this.professionalForm.get('trimestral');
    const triplicateControl = supplies.get('triplicate');
    const triplicateFormGroup = supplies.get('triplicateData');
    const duplicateControl = supplies.get('duplicate');
    const serieControl = triplicateFormGroup.get('serie');
    const numeroControl = triplicateFormGroup.get('numero');
    triplicateFormGroup.disable();
    serieControl.clearValidators();
    numeroControl.clearValidators();
    serieControl.updateValueAndValidity();
    numeroControl.updateValueAndValidity();
    triplicateControl.valueChanges.subscribe(checked => {
      if (checked) {
        triplicateFormGroup.enable();
        duplicateControl.setValue(false, { emitEvent: false });
        trimestralControl.setValue(false, { emitEvent: false });
        serieControl.setValidators([Validators.required, Validators.maxLength(1), Validators.pattern("^[a-zA-Z]*$")]); // Added pattern validator
        numeroControl.setValidators([Validators.required]);
      } else {
        triplicateFormGroup.disable();
        triplicateFormGroup.patchValue({ serie: '', numero: '' });
        serieControl.clearValidators();
        numeroControl.clearValidators();
      }
      serieControl.updateValueAndValidity();
      numeroControl.updateValueAndValidity();
    });
    duplicateControl.valueChanges.subscribe(checked => {
      if (checked) {
        triplicateControl.setValue(false, { emitEvent: false });
        triplicateFormGroup.disable();

      }
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
  }

  showList(): void {
    this.isFormShown = false;
  }
}
