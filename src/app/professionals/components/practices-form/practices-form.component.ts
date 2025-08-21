import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '@auth/services/auth.service';
import { Patient } from '@interfaces/patients';
import { Practice } from '@interfaces/practices';
import { ProfessionalDialogComponent } from '@professionals/components/professional-dialog/professional-dialog.component';
import { PatientsService } from '@root/app/services/patients.service';
import { PracticesService } from '@services/practices.service';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-practices-form',
  templateUrl: './practices-form.component.html',
  styleUrls: ['./practices-form.component.sass']
})
export class PracticesFormComponent implements OnInit {
  obraSocialControl = new FormControl('');
  filteredObrasSociales: Observable<any[]>;

  practicesForm: FormGroup;
  practiceDate = new FormControl(new Date(), [Validators.required]);
  isSubmitPractice: boolean = false;
  patientSearch: Patient[];
  sex_options: string[] = ["Femenino", "Masculino", "Otro"];
  obraSocial: any[];
  obrasSociales: any[];
  dniShowSpinner: boolean = false;
  professionalData: any;

  constructor(
    private fBuilder: FormBuilder,
    private apiPatients: PatientsService,
    private practicesService: PracticesService,
    private authService: AuthService,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.professionalData = this.authService.getLoggedUserId();
    this.initPracticesForm();

    // on DNI changes
    this.practicePatientDni.valueChanges.pipe(
                debounceTime(400)
            ).subscribe(
      dniValue => {
        this.getPatientByDni(dniValue);
      }
    );

    this.practicesForm.get('patient.otraOS')?.valueChanges.subscribe(() => {
      const osGroup = this.practicesForm.get('patient.obraSocial') as FormGroup;
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
  }

  private _filter(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.obrasSociales.filter(os =>
      os.nombre.toLowerCase().includes(filterValue)
    );
  }



  initPracticesForm(): void {
    this.practicesForm = this.fBuilder.group({
      professional: [this.professionalData],
      date: [new Date(), [Validators.required]],
      patient: this.fBuilder.group({
        dni: ['', [Validators.required, Validators.minLength(7), Validators.pattern("^[0-9]*$")]],
        sex: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        firstName: ['', [Validators.required]],
        otraOS: [{ value: false, disabled: true }],
        obraSocial: this.fBuilder.group({
          nombre: '',
          codigoPuco: '',
          numeroAfiliado: [{ value: '', disabled: true }, [Validators.required, Validators.pattern('^[0-9]*$')]]
        })
      }),
      practice: [''],
      diagnostic: [''],
      indications: ['']
    });
  }

  getPatientByDni(dniValue: string | null): void {
    if (dniValue !== null && (dniValue.length == 7 || dniValue.length == 8)) {
      this.dniShowSpinner = true;
      this.apiPatients.getPatientByDni(dniValue).subscribe(
        res => {
          if (res.length) {
            this.patientSearch = res;
            // Habilitar el checkbox otraOS cuando se encuentra un paciente
            this.patientOtraOS.enable();
          } else {
            this.patientSearch = [];
            this.practicePatientLastName.setValue('');
            this.practicePatientFirstName.setValue('');
            this.practicePatientSex.setValue('');
            this.patientOtraOS.setValue(false);
            // Deshabilitar el checkbox otraOS cuando no se encuentra un paciente
            this.patientOtraOS.disable();
          }
          this.dniShowSpinner = false;
        });
      this.apiPatients.getPatientOSByDni(dniValue, this.practicePatientSex.value).subscribe(
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

  completePatientInputsPractices(patient: Patient): void {
    this.practicePatientLastName.setValue(patient.lastName);
    this.practicePatientFirstName.setValue(patient.firstName);
    this.practicePatientSex.setValue(patient.sex);
  }

  onOsSelected(selectedOs: any): void {
    const osGroup = this.practicesForm.get('patient.obraSocial') as FormGroup;
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

  displayOs(os: any): string {
    return os && os.nombre ? os.nombre : '';
  }

  onSubmitPracticesForm(practicesNgForm: FormGroupDirective): void {
    if (this.practicesForm.valid) {
      this.isSubmitPractice = true;

      const practiceData = this.practicesForm.value;

      this.practicesService.newPractice(practiceData).subscribe(
        success => {
          this.isSubmitPractice = false;

          if (success) {
            this.openDialog('practiceSuccess');
            this.clearPracticesForm(practicesNgForm);
          }
        },
        error => {
          this.isSubmitPractice = false;
          console.error('Error al crear la práctica:', error);
          this.openDialog('practiceError');
        }
      );
    }
  }

  clearPracticesForm(practicesNgForm: FormGroupDirective): void {
    practicesNgForm.resetForm();
    this.patientSearch = [];
    this.practicesForm.reset({
      professional: this.professionalData,
      date: new Date(),
      patient: {
        dni: '',
        sex: '',
        lastName: '',
        firstName: '',
        otraOS: { value: false, disabled: true },
        obraSocial: {
          nombre: '',
          codigoPuco: '',
          numeroAfiliado: { value: '', disabled: true }
        }
      },
      practice: '',
      diagnostic: '',
      indications: ''
    });
    this.practiceDate.setValue(new Date());
  }

  openDialog(aDialogType: string): void {
    const dialogRef = this.dialog.open(ProfessionalDialogComponent, {
      width: '400px',
      data: { dialogType: aDialogType }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  // Getters
  get practicePatientDni(): AbstractControl {
    return this.practicesForm.get('patient.dni');
  }

  get practicePatientSex(): AbstractControl {
    return this.practicesForm.get('patient.sex');
  }

  get practicePatientLastName(): AbstractControl {
    return this.practicesForm.get('patient.lastName');
  }

  get practicePatientFirstName(): AbstractControl {
    return this.practicesForm.get('patient.firstName');
  }

  get patientOtraOS(): AbstractControl {
    const patient = this.practicesForm.get('patient');
    return patient.get('otraOS');
  }
  existenObrasSociales(array: any[]): boolean {
        if (!array || array.length === 0) {
            return false;
        }
        return !array.every(item => item === null || item === undefined);
    }
}