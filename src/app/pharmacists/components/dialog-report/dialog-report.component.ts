import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
    fechaDesde: Date;
    fechaHasta: Date;
    pharmacistId: string;
}

@Component({
    selector: 'app-dialog-report',
    templateUrl: './dialog-report.component.html'
})
export class DialogReportComponent {
    constructor(
        public dialogRef: MatDialogRef<DialogReportComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
    ) { }

    onNoClick(): void {
        this.dialogRef.close();
    }

    enableDownload() {
        return this.data.fechaDesde && this.data.fechaHasta;
    }

}
