import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Efector } from '@interfaces/efectores';
import { Organizacion } from '@interfaces/organizaciones';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged, filter, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
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
    selectedOrganizacion: Organizacion | null = null;
    private destroy$ = new Subject<void>();
    readonly spinnerColor: ThemePalette = 'primary';

    constructor(
        private formBuilder: FormBuilder,
        private dialogRef: MatDialogRef<EfectorDialogComponent>,
        private efectoresAndesService: EfectoresAndesService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.efectorForm = this.formBuilder.group({
            nombre: ['', [Validators.required, Validators.minLength(3)]]
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
        if (this.efectorForm.valid && this.selectedOrganizacion) {
            const newEfector: Efector = {
                _id: this.selectedOrganizacion._id,
                nombre: this.selectedOrganizacion.nombre,
                direccion: this.selectedOrganizacion.direccion
            };
            this.dialogRef.close(newEfector);
        } else {
            this.nombre?.setErrors({ invalidSelection: true });
            this.nombre?.markAsTouched();
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    subscribeToNameChanges() {
        this.efectorForm.get('nombre')?.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            filter((nombre: string | Organizacion) => {
                if (typeof nombre !== 'string') {
                    return false;
                }
                return nombre.length >= 3;
            }),
            switchMap((nombre: string | Organizacion) => {
                this.spinnerLoading = true;
                return this.efectoresAndesService.get(nombre as string).pipe(
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

    onEfectorSelected(event: MatAutocompleteSelectedEvent): void {
        const organizacion = event.option.value as Organizacion;
        this.selectedOrganizacion = organizacion;
        this.efectorForm.get('nombre')?.setValue(organizacion.nombre, { emitEvent: false });
        this.efectorForm.get('nombre')?.setErrors(null);
    }

    onNombreInput(): void {
        this.selectedOrganizacion = null;
    }

    displayOrganizacion(organizacion: Organizacion | string): string {
        if (!organizacion) {
            return '';
        }

        if (typeof organizacion === 'string') {
            return organizacion;
        }

        return organizacion.nombre || '';
    }

    getDireccionTexto(organizacion: Organizacion): string {
        return organizacion?.direccion?.valor || '';
    }

    get nombre() { return this.efectorForm.get('nombre'); }
}
