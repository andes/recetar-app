import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
import { Prescriptions } from '@interfaces/prescriptions';
import {MatIconModule} from '@angular/material/icon';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { UnifiedPrinterComponent } from '@shared/components/unified-printer/unified-printer.component';


@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.sass'],
  animations: [
    fadeInOnEnterAnimation(), 
    fadeOutOnLeaveAnimation()
  ]
})
export class DialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private unifiedPrinter: UnifiedPrinterComponent
  ) {}
  
  ngOnInit(): void {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}

export interface DialogData {
  prescription: Prescriptions;
  dialogType: string;
  text: string;
}