import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
    standalone: true,
    imports: [MatButtonModule, MatDialogModule],
    template: `
        <h2 mat-dialog-title>Cambios sin guardar</h2>
        <mat-dialog-content>
            <p>Hay cambios sin guardar. ¿Querés salir igual?</p>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button matButton="outlined" type="button" (click)="dialogRef.close(false)">
                Seguir editando
            </button>
            <button matButton="filled" type="button" class="mat-error" (click)="dialogRef.close(true)">
                Salir sin guardar
            </button>
        </mat-dialog-actions>
    `
})
export class DiscardChangesDialogComponent {
    constructor(public dialogRef: MatDialogRef<DiscardChangesDialogComponent>) {}
}
