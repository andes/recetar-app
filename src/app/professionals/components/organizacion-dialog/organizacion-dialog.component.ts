import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Organizacion, SubOrganizacion } from '@interfaces/organizaciones';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged, filter, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { OrganizacionesAndesService } from '@services/organizacionesAndes.service';
import { ThemePalette } from '@angular/material/core';


@Component({
    selector: 'app-organizacion-dialog',
    templateUrl: './organizacion-dialog.component.html',
    styleUrls: ['./organizacion-dialog.component.sass']
})
export class OrganizacionDialogComponent implements OnInit, OnDestroy {
    organizacionForm: FormGroup;
    spinnerLoading = false;
    filteredOrganizaciones: Organizacion[] = [];
    selectedOrganizacion: SubOrganizacion | null = null;
    private destroy$ = new Subject<void>();
    readonly spinnerColor: ThemePalette = 'primary';

    constructor(
        private formBuilder: FormBuilder,
        private dialogRef: MatDialogRef<OrganizacionDialogComponent>,
        private organizacionesAndesService: OrganizacionesAndesService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.organizacionForm = this.formBuilder.group({
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
        if (this.organizacionForm.valid && this.selectedOrganizacion) {
            this.dialogRef.close(this.selectedOrganizacion);
        } else {
            this.nombre?.setErrors({ invalidSelection: true });
            this.nombre?.markAsTouched();
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    subscribeToNameChanges() {
        this.organizacionForm.get('nombre')?.valueChanges.pipe(
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
                return this.organizacionesAndesService.get(nombre as string).pipe(
                    catchError(() => {
                        this.spinnerLoading = false;
                        return of([]);
                    })
                );
            }),
            takeUntil(this.destroy$)
        ).subscribe((res) => {
            this.filteredOrganizaciones = [...res];
            this.spinnerLoading = false;
        });
    }

    onOrganizacionSelected(event: MatAutocompleteSelectedEvent): void {
        const organizacion = event.option.value as Organizacion;
        this.selectedOrganizacion = {
            _id: organizacion._id,
            nombre: organizacion.nombre,
            direccion: this.getDireccionTexto(organizacion)
        };
        this.organizacionForm.get('nombre')?.setValue(organizacion.nombre, { emitEvent: false });
        this.organizacionForm.get('nombre')?.setErrors(null);
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

    get nombre() { return this.organizacionForm.get('nombre'); }
}
