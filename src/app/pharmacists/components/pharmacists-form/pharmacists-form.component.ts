import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl, Validators } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { Observable, combineLatest, forkJoin, of } from 'rxjs';

// Services
import { PrescriptionsService } from '@services/prescriptions.service';
import { InsurancesService } from '@services/insurance.service';
import { AndesPrescriptionsService } from '@services/andesPrescription.service';

// Interfaces
import { Patient } from '@interfaces/patients';
import { Prescriptions } from '@interfaces/prescriptions';
import { Insurances } from '@interfaces/insurances';

// Material
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '@pharmacists/components/dialog/dialog.component';
import { ThemePalette } from '@angular/material/core';


@Component({
  selector: 'app-pharmacists-form',
  templateUrl: './pharmacists-form.component.html',
  styleUrls: ['./pharmacists-form.component.sass'],

})
export class PharmacistsFormComponent implements OnInit {

  @ViewChild('picker1') picker1;

  title = 'Farmacia: ';
  prescriptionForm: FormGroup;
  displayedInsColumns: string[] = ['codigoPuco', 'financiador'];
  options: string[] = [];
  patient: Patient;
  insurances: Insurances;
  filteredOptions: Observable<string[]>;
  lastDniConsult: string;
  readonly spinnerColor: ThemePalette = 'primary';
  dniShowSpinner: boolean = false;
  dateShowSpinner: boolean = false;
  private lastDni: string;
  private lastSexo: string;
  private lastDate: string;

  constructor(
    private fBuilder: FormBuilder,
    private apiPrescriptions: PrescriptionsService,
    private apiAndesPrescriptions: AndesPrescriptionsService,
    private apiInsurances: InsurancesService,
    public dialog: MatDialog,
  ){}

  ngOnInit(): void {
    this.initFilterPrescriptionForm();
  }

  searchPrescriptions(): void {
    const values = this.prescriptionForm.value;
    const digestDate = typeof(values.dateFilter) !== 'undefined' && values.dateFilter != null && values.dateFilter !== '' ? values.dateFilter.format('YYYY-MM-DD') : '';

    if (typeof(values.patient_dni) !== 'undefined' && values.patient_dni.length >= 7) {
      this.dniShowSpinner = this.lastDni != values.patient_dni;
      this.dateShowSpinner = this.lastDate != digestDate;

      forkJoin([
        this.apiPrescriptions.getFromDniAndDate({ patient_dni: values.patient_dni, dateFilter: digestDate }).pipe(catchError(() => of(false))),
        this.apiAndesPrescriptions.getPrescriptionsFromAndes({ patient_dni: values.patient_dni, patient_sex: values.patient_sexo }).pipe(catchError(() => of(false)))
      ]).subscribe(([prescriptionsSuccess, andesPrescriptionsSuccess]) => {
        this.lastDni = values.patient_dni;
        this.lastDate = digestDate;
        this.dniShowSpinner = false;
        this.dateShowSpinner = false;
        if (!prescriptionsSuccess && !andesPrescriptionsSuccess) {
          this.openDialog("noPrescriptions");
        }
      });

      // if (values.patient_dni !== this.lastDniConsult) {
      //   this.lastDniConsult = values.patient_dni;
      //   this.apiInsurances.getInsuranceByPatientDni(values.patient_dni).subscribe(
      //     res => {
      //       this.insurances = res;
      //     }
      //   );
      // }
    }
  }

  initFilterPrescriptionForm(){
    this.prescriptionForm = this.fBuilder.group({
      patient_dni: ['', [
        Validators.required,
        Validators.minLength(7)
      ]],
      patient_sexo: [''],
      dateFilter: ['', [
      ]],
    });
  }

  // clear dapicker input
  cleanDateEvent(){
    this.dateFilter.setValue('');
  }

  // Show a dialog
  openDialog(aDialogType: string, aPrescription?: Prescriptions, aText?: string): void {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '400px',
      data: {dialogType: aDialogType, prescription: aPrescription, text: aText }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }


  get patient_dni(): AbstractControl{
    return this.prescriptionForm.get('patient_dni');
  }

  get patient_sexo(): AbstractControl{
    return this.prescriptionForm.get('patient_sexo');
  }

  get dateFilter(): AbstractControl{
    return this.prescriptionForm.get('dateFilter');
  }
}


