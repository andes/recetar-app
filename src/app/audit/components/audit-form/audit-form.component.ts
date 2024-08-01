import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

// Services
import { PrescriptionsService } from '@services/prescriptions.service';
import { InsurancesService } from '@services/insurance.service';

// Interfaces
import { Patient } from '@interfaces/patients';
import { Prescriptions } from '@interfaces/prescriptions';
import { Insurances } from '@interfaces/insurances';

// Material
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogComponent } from '@audit/components/dialog/dialog.component';
import { ThemePalette } from '@angular/material/core';
import { duration } from 'moment';


@Component({
  selector: 'app-pharmacists-form',
  templateUrl: './audit-form.component.html',
  styleUrls: ['./audit-form.component.sass'],

})
export class AuditFormComponent implements OnInit {

  @ViewChild('picker1') picker1;

  title = 'Auditor: ';
  prescriptionForm: FormGroup;
  options: string[] = [];
  patient: Patient;
  filteredOptions: Observable<string[]>;
  lastCuitConsult: string;
  readonly spinnerColor: ThemePalette = 'primary';
  cuitShowSpinner: boolean = false;
  private lastCuit: string;

  constructor(
    private fBuilder: FormBuilder,
    private apiPrescriptions: PrescriptionsService,
    private apiInsurances: InsurancesService,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
  ){}

  ngOnInit(): void{
    this.initFilterPrescriptionForm();

    this.prescriptionForm.valueChanges.subscribe(
      values => {
        if(typeof(values.pharmacy_cuit) !== 'undefined' && values.pharmacy_cuit >= 10){
          this.cuitShowSpinner = this.lastCuit != values.pharmacy_cuit;

          this.apiPrescriptions.getPrescriptions({dispensedBy: values.pharmacy_cuit}).subscribe(
            success => {
              this.lastCuit = values.pharmacy_cuit;
              this.cuitShowSpinner = false;
              if(!success){
                this._snackBar.open("No se encuentra una farmacia con ese CUIT", 'cerrar', {duration: 3000});
              }
            }
          )
        }
      }
    )
  }

  initFilterPrescriptionForm(){
    this.prescriptionForm = this.fBuilder.group({
      pharmacy_cuit: ['', [
        Validators.required,
        Validators.minLength(10)
      ]],
    });
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


  get pharmacy_cuit(): AbstractControl{
    return this.prescriptionForm.get('pharmacy_cuit');
  }

}


