import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UiAlertComponent } from '@shared/ui';

export interface DeletePatientDialogData {
    name: string;
    dni?: string;
}

@Component({
    selector: 'app-delete-patient-dialog',
    templateUrl: './delete-patient-dialog.component.html',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatDialogModule,
        UiAlertComponent,
    ]
})
export class DeletePatientDialogComponent {
    confirmed = false;

    constructor(
        public dialogRef: MatDialogRef<DeletePatientDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DeletePatientDialogData,
    ) { }

    close(result: boolean): void {
        this.dialogRef.close(result);
    }
}
