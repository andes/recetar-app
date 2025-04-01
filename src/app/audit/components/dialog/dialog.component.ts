import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
import { Prescriptions } from '@interfaces/prescriptions';
import {MatIconModule} from '@angular/material/icon';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { PrescriptionPrinterComponent } from '../prescription-printer/prescription-printer.component';


@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.sass'],
  animations: [
    fadeInOnEnterAnimation(), 
    fadeOutOnLeaveAnimation()
  ],
  providers: [PrescriptionPrinterComponent]
})
export class DialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private prescriptionPrinter: PrescriptionPrinterComponent
  ) {}
  
  ngOnInit(): void {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  printPrescription(prescription: Prescriptions){
    this.prescriptionPrinter.print(prescription);
  }
}

export interface DialogData {
  prescription: Prescriptions;
  dialogType: string;
  text: string;
}