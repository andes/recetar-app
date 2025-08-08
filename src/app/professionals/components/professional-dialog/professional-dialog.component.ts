import { Component, Inject, OnInit, } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Prescriptions } from '@interfaces/prescriptions';
import { InteractionService } from '@professionals/interaction.service';
import { Certificate } from '@interfaces/certificate';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';

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
}

export interface DialogData {
    prescription: Prescriptions;
    dialogType: string;
    text: string;
}
