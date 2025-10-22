import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Efector } from '@interfaces/efectores';

@Component({
    selector: 'app-efector-dialog',
    templateUrl: './efector-dialog.component.html',
    styleUrls: ['./efector-dialog.component.sass']
})
export class EfectorDialogComponent {
    efectorForm: FormGroup;

    constructor(
        private formBuilder: FormBuilder,
        private dialogRef: MatDialogRef<EfectorDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.efectorForm = this.formBuilder.group({
            nombre: ['', [Validators.required, Validators.minLength(3)]],
            direccion: ['', [Validators.required, Validators.minLength(5)]]
        });
    }

    onSubmit(): void {
        if (this.efectorForm.valid) {
            const newEfector: Efector = {
                nombre: this.efectorForm.value.nombre,
                direccion: this.efectorForm.value.direccion
            };
            this.dialogRef.close(newEfector);
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    get nombre() { return this.efectorForm.get('nombre'); }
    get direccion() { return this.efectorForm.get('direccion'); }
}