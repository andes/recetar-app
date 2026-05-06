import { Component, OnInit, Inject, } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
// import { InteractionService } from "@professionals/interaction.service";

@Component({
    selector: 'app-supply-dialog',
    templateUrl: './supply-dialog.component.html',
    styleUrls: ['./supply-dialog.component.sass'],
    animations: [
        fadeInOnEnterAnimation(),
        fadeOutOnLeaveAnimation()
    ],
    standalone: false
})
export class SupplyDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<SupplyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  ngOnInit(): void {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}

export interface DialogData {
  dialogType: string;
  text: string;
}