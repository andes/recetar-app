import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { UiAutocompleteComponent } from '@shared/ui/autocomplete.component';
import { OrganizationsService } from '../../services/organizations.service';
import { debounceTime, distinctUntilChanged, filter, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

@Component({
    selector: 'app-organizations-dialog',
    templateUrl: './organizations-dialog.component.html',
    styleUrls: ['./organizations-dialog.component.sass'],
    standalone: true,
    imports: [
        MatDialogModule,
        MatButtonModule,
        UiAutocompleteComponent,
    ]
})
export class OrganizationsDialogComponent implements OnInit, OnDestroy {
    searchText = '';
    filteredOrganizations: any[] = [];
    selectedCodigo = '';
    selectedNombre = '';
    isLoading = false;
    existingIds: string[] = [];

    private searchTextSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    orgDisplayFn = (org: any): string => org.nombre || '';
    orgSubtitleFn = (org: any): string => {
        const provincia = org.direccion?.ubicacion?.provincia?.nombre || '';
        const localidad = org.direccion?.ubicacion?.localidad?.nombre || '';
        return [localidad, provincia].filter(Boolean).join(', ');
    };

    constructor(
        private dialogRef: MatDialogRef<OrganizationsDialogComponent>,
        private organizationsService: OrganizationsService,
        @Inject(MAT_DIALOG_DATA) private data: { existingIds: string[] },
    ) {
        this.existingIds = data?.existingIds || [];
    }

    ngOnInit(): void {
        this.searchTextSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            filter((nombre) => nombre.length >= 3),
            switchMap((nombre: string) => {
                this.isLoading = true;
                return this.organizationsService.searchSisaOrganizations(nombre).pipe(
                    catchError(() => {
                        this.isLoading = false;
                        return of([]);
                    })
                );
            }),
            takeUntil(this.destroy$)
        ).subscribe((res) => {
            this.filteredOrganizations = res.filter(
                (org: any) => !this.existingIds.includes(org._id || org.id)
            );
            this.isLoading = false;
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onSearchTextChange(): void {
        this.searchTextSubject.next(this.searchText);
    }

    onOrganizationSelected(organization: any): void {
        this.selectedCodigo = organization?._id || organization?.id || '';
        this.selectedNombre = organization?.nombre || '';
    }

    onSubmit(): void {
        if (!this.selectedCodigo) { return; }
        this.dialogRef.close(this.selectedCodigo);
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
