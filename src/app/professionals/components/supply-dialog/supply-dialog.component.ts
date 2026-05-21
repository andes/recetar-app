import { Component, OnInit, Inject, HostBinding, } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { dialogFade } from '@animations/animations.template';
// import { InteractionService } from "@professionals/interaction.service";

@Component({
    selector: 'app-supply-dialog',
    templateUrl: './supply-dialog.component.html',
    styleUrls: ['./supply-dialog.component.sass'],
    animations: [dialogFade],
    standalone: false
})
export class SupplyDialogComponent implements OnInit {
    @HostBinding('@dialogFade') public dialogFade = true;

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
