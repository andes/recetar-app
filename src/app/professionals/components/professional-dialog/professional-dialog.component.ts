import { Component, OnInit, Inject, } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
import { Prescriptions } from '@interfaces/prescriptions';
import { InteractionService } from "@professionals/interaction.service";
import { Certificates } from '@interfaces/certificate';

@Component({
  selector: 'app-professional-dialog',
  templateUrl: './professional-dialog.component.html',
  styleUrls: ['./professional-dialog.component.sass'],
  animations: [
    fadeInOnEnterAnimation(),
    fadeOutOnLeaveAnimation()
  ],
})
export class ProfessionalDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<ProfessionalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private _interactionService: InteractionService
  ) { }

  ngOnInit(): void {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  deletePrescription(prescription: Prescriptions) {
    this._interactionService.deletePrescription(prescription);
    this.dialogRef.close();
  }

  deleteCertificate(certificate) {
    this._interactionService.deleteCertificate(certificate);
    this.dialogRef.close();
  }
}

export interface DialogData {
  prescription: Prescriptions;
  dialogType: string;
  text: string;
}