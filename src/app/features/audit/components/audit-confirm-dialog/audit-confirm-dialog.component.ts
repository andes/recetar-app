import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface AuditConfirmDialogData {
    title: string;
    message: string;
}

@Component({
    selector: 'app-audit-confirm-dialog',
    standalone: true,
    imports: [MatButtonModule, MatDialogModule],
    template: `
        <h2 mat-dialog-title>{{ data.title }}</h2>
        <mat-dialog-content><p>{{ data.message }}</p></mat-dialog-content>
        <mat-dialog-actions align="end">
            <button matButton="outlined" (click)="dialogRef.close(false)">Cancelar</button>
            <button matButton="filled" class="mat-error" (click)="dialogRef.close(true)">Eliminar</button>
        </mat-dialog-actions>
    `
})
export class AuditConfirmDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<AuditConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: AuditConfirmDialogData
    ) { }
}
