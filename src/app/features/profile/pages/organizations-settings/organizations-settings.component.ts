import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, finalize, take } from 'rxjs/operators';
import { SidebarItem } from '@shared/components/layout/sidebar/sidebar.component';
import { SidebarService } from '@shared/services/sidebar.service';
import { getHttpErrorMessage } from '@shared/utils/http-error.util';
import { SubOrganization } from '@interfaces/organizations';
import { OrganizationsService } from '../../services/organizations.service';
import { OrganizationsSisaService } from '@services/organizations-sisa.service';
import { OrganizationsDialogComponent } from '../../components/organizations-dialog/organizations-dialog.component';

@Component({
    selector: 'app-organizations-settings',
    templateUrl: './organizations-settings.component.html',
    styleUrls: ['./organizations-settings.component.sass'],
    standalone: false
})
export class OrganizationsSettingsComponent implements OnInit, OnDestroy {
    sidebarItems: SidebarItem[] = [];
    organizaciones: SubOrganization[] = [];
    isLoading = false;
    isSaving = false;
    removingId: string | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private sidebarService: SidebarService,
        private organizationsService: OrganizationsService,
        private organizationsSisaService: OrganizationsSisaService,
    ) { }

    ngOnInit(): void {
        this.sidebarItems = this.sidebarService.getItems();
        this.loadOrganizations();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadOrganizations(): void {
        this.isLoading = true;
        this.organizationsService.loadUserOrganizations()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isLoading = false)
            )
            .subscribe({
                next: (organizations) => {
                    this.organizaciones = organizations;
                },
                error: (error) => {
                    const msg = getHttpErrorMessage(error, 'Error al cargar las organizaciones');
                    this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
                }
            });
    }

    openAddDialog(): void {
        const existingIds = this.organizaciones.map(o => o._id).filter(Boolean);
        const dialogRef = this.dialog.open(OrganizationsDialogComponent, {
            width: '500px',
            data: { existingIds },
        });

        dialogRef.afterClosed().pipe(take(1)).subscribe((codigo: string | undefined) => {
            if (!codigo) { return; }

            this.isLoading = true;
            this.organizationsSisaService.addSisaOrganizacion(codigo).pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isLoading = false)
            ).subscribe({
                next: () => {
                    this.snackBar.open('Organización agregada correctamente', 'Cerrar', { duration: 3000 });
                    this.loadOrganizations();
                },
                error: (err) => {
                    this.snackBar.open('Error al agregar la organización', 'Cerrar', { duration: 5000 });
                }
            });
        });
    }

    removeOrganization(org: SubOrganization): void {
        if (this.isSaving) { return; }

        this.removingId = org._id || org.nombre;
        const updated = this.organizaciones.filter(o => {
            if (org._id && o._id) { return o._id !== org._id; }
            return o.nombre !== org.nombre || o.direccion !== org.direccion;
        });

        this.persistOrganizations(updated);
        this.removingId = null;
    }

    private persistOrganizations(organizations: SubOrganization[]): void {
        this.isSaving = true;
        this.organizationsService.saveOrganizations(organizations)
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isSaving = false)
            )
            .subscribe({
                next: (saved) => {
                    this.organizaciones = saved;
                    this.snackBar.open('Organizaciones actualizadas', 'Cerrar', { duration: 3000 });
                },
                error: (error) => {
                    const msg = getHttpErrorMessage(error, 'Error al guardar las organizaciones');
                    this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
                    this.loadOrganizations();
                }
            });
    }
}
