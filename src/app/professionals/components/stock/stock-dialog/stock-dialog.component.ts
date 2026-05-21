import { Component, HostBinding, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { dialogFade } from '@animations/animations.template';

@Component({
    selector: 'app-stock-dialog',
    templateUrl: './stock-dialog.component.html',
    styleUrls: ['./stock-dialog.component.sass'],
    animations: [dialogFade],
    standalone: false
})
export class StockDialogComponent implements OnInit {
    @HostBinding('@dialogFade') public dialogFade = true;

    constructor(
        public dialogRef: MatDialogRef<StockDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

    ngOnInit(): void {
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}

export interface DialogData {
    dialogType: string;
    title?: string;
    text?: string;
}
