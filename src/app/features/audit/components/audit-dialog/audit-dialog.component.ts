import { Component, Inject, HostBinding } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { dialogFade } from '@animations/animations.template';

export interface AuditDialogData {
    dialogType: string;
    text: string;
}

@Component({
    selector: 'app-audit-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
    animations: [dialogFade],
    template: `
        <div>
            <h3 mat-dialog-title>
                <mat-icon>error</mat-icon> Error
            </h3>
            <div mat-dialog-content>
                <p>{{ data.text }}</p>
            </div>
            <div mat-dialog-actions align="end">
                <button mat-button (click)="onClose()" cdkFocusInitial>Aceptar</button>
            </div>
        </div>
    `
})
export class AuditDialogComponent {
    @HostBinding('@dialogFade') public dialogFade = true;

    constructor(
        public dialogRef: MatDialogRef<AuditDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: AuditDialogData,
    ) {}

    onClose(): void {
        this.dialogRef.close();
    }
}
