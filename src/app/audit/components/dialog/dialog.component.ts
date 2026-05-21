import { Component, OnInit, Inject, HostBinding } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Prescriptions } from '@interfaces/prescriptions';
import { MatIconModule } from '@angular/material/icon';
import { dialogFade } from '@animations/animations.template';
import { UnifiedPrinterComponent } from '@shared/components/unified-printer/unified-printer.component';


@Component({
    selector: 'app-dialog',
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.sass'],
    animations: [dialogFade],
    standalone: false
})
export class DialogComponent implements OnInit {
    @HostBinding('@dialogFade') public dialogFade = true;

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

    async printPrescription(prescription: Prescriptions) {
        await this.unifiedPrinter.printPrescription(prescription);
    }
}

export interface DialogData {
    prescription: Prescriptions;
    dialogType: string;
    text: string;
}
