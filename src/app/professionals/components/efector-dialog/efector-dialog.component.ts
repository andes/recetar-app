import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Efector } from '@interfaces/efectores';
import { Organizacion } from '@interfaces/organizaciones';
import { debounceTime, distinctUntilChanged, filter, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { of, Subscription, Observable, Subject } from 'rxjs';
import { EfectoresAndesService } from '@services/efectoresAndes.service';
import { ThemePalette } from '@angular/material/core';


@Component({
    selector: 'app-efector-dialog',
    templateUrl: './efector-dialog.component.html',
    styleUrls: ['./efector-dialog.component.sass']
})
export class EfectorDialogComponent implements OnInit, OnDestroy {
    efectorForm: FormGroup;
    spinnerLoading = false;
    filteredEfectores: Organizacion[] = [];
    private destroy$ = new Subject<void>();
    readonly spinnerColor: ThemePalette = 'primary';

    constructor(
        private formBuilder: FormBuilder,
        private dialogRef: MatDialogRef<EfectorDialogComponent>,
        private efectoresAndesService: EfectoresAndesService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.efectorForm = this.formBuilder.group({
            nombre: ['', [Validators.required, Validators.minLength(3)]],
            direccion: ['', [Validators.required, Validators.minLength(5)]]
        });
    }

    ngOnInit(): void {
        this.subscribeToNameChanges();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
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

    subscribeToNameChanges() {
        this.efectorForm.get('nombre')?.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            filter((nombre: string) => nombre && nombre.length >= 3),
            switchMap((nombre: string) => {
                this.spinnerLoading = true;
                return this.efectoresAndesService.get(nombre).pipe(
                    catchError(() => {
                        this.spinnerLoading = false;
                        return of([]);
                    })
                );
            }),
            takeUntil(this.destroy$)
        ).subscribe((res) => {
            this.filteredEfectores = [...res];
            this.spinnerLoading = false;
        });
    }

    get nombre() { return this.efectorForm.get('nombre'); }
    get direccion() { return this.efectorForm.get('direccion'); }
}
