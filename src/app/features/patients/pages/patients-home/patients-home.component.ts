import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { merge, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs/operators';
import { SidebarItem } from '@shared/components/layout/sidebar/sidebar.component';
import { SidebarService } from '@shared/services/sidebar.service';
import { NotificationService } from '@shared/services/notification.service';
import { Patient } from '@interfaces/patients';
import { PatientsService } from '@services/patients.service';
import { DeletePatientDialogComponent } from '../../components/delete-patient-dialog/delete-patient-dialog.component';

@Component({
    selector: 'app-patients-home',
    templateUrl: './patients-home.component.html',
    styleUrls: ['./patients-home.component.sass'],
    standalone: false
})
export class PatientsHomeComponent implements OnInit, OnDestroy {
    sidebarItems: SidebarItem[] = [];

    searchControl = new FormControl('');
    estadoControl = new FormControl('');
    sexoControl = new FormControl('');
    emailControl = new FormControl('');
    telefonoControl = new FormControl('');

    patients: Patient[] = [];
    loading = false;
    hasMore = false;
    offset = 0;
    readonly limit = 20;

    drawerOpen = false;
    selectedPatient: Patient | null = null;
    isValidating = false;

    private destroy$ = new Subject<void>();
    private searchSub: Subscription | null = null;

    constructor(
        private sidebarService: SidebarService,
        private patientsService: PatientsService,
        private dialog: MatDialog,
        private notification: NotificationService,
        private router: Router,
        private route: ActivatedRoute,
    ) { }

    ngOnInit(): void {
        this.sidebarItems = this.sidebarService.getItems();
        this.initializeFromQueryParams();

        merge(
            this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()),
            this.estadoControl.valueChanges,
            this.sexoControl.valueChanges,
            this.emailControl.valueChanges.pipe(debounceTime(300)),
            this.telefonoControl.valueChanges.pipe(debounceTime(300)),
        ).pipe(takeUntil(this.destroy$)).subscribe(() => this.search(true));

        this.search(true);
    }

    ngOnDestroy(): void {
        this.searchSub?.unsubscribe();
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initializeFromQueryParams(): void {
        const params = this.route.snapshot.queryParamMap;
        this.searchControl.setValue(params.get('q') || '', { emitEvent: false });
        this.estadoControl.setValue(params.get('estado') || '', { emitEvent: false });
        this.sexoControl.setValue(params.get('sexo') || '', { emitEvent: false });
        this.emailControl.setValue(params.get('email') || '', { emitEvent: false });
        this.telefonoControl.setValue(params.get('telefono') || '', { emitEvent: false });
    }

    private syncQueryParams(): void {
        const queryParams: Params = {
            q: this.searchControl.value?.trim() || null,
            estado: this.estadoControl.value || null,
            sexo: this.sexoControl.value || null,
            email: this.emailControl.value || null,
            telefono: this.telefonoControl.value || null,
        };

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams,
            replaceUrl: true,
        });
    }

    get activeFilterCount(): number {
        return [this.estadoControl.value, this.sexoControl.value, this.emailControl.value, this.telefonoControl.value]
            .filter(Boolean).length;
    }

    get hasActiveFilters(): boolean {
        return this.activeFilterCount > 0;
    }

    get emptyMessage(): string {
        return this.hasSearchCriteria
            ? 'No se encontraron pacientes con esos criterios.'
            : 'Buscá un paciente por nombre, DNI, email o teléfono.';
    }

    get hasSearchCriteria(): boolean {
        return !!this.searchControl.value?.trim() || this.hasActiveFilters;
    }

    get selectedIsValidated(): boolean {
        return (this.selectedPatient?.status || this.selectedPatient?.estado || '').toLowerCase() === 'validado';
    }

    get canValidateSelected(): boolean {
        return !!this.selectedPatient?.dni && !this.isValidating;
    }

    isSelected(patient: Patient): boolean {
        if (!this.drawerOpen) { return false; }
        const key = this.patientKey(patient);
        return !!key && key === this.patientKey(this.selectedPatient);
    }

    search(reset = true): void {
        if (reset) {
            this.syncQueryParams();
        }

        const term = (this.searchControl.value || '').trim();
        if (!this.hasSearchCriteria || (term.length > 0 && term.length < 3 && !this.hasActiveFilters)) {
            this.patients = [];
            this.hasMore = false;
            return;
        }

        if (reset) {
            this.offset = 0;
            this.patients = [];
        }

        this.searchSub?.unsubscribe();
        this.loading = true;

        this.searchSub = this.patientsService.searchPatientsPage({
            ...(term ? { q: term } : {}),
            ...(this.estadoControl.value ? { estado: this.estadoControl.value } : {}),
            ...(this.sexoControl.value ? { sexo: this.sexoControl.value } : {}),
            ...(this.emailControl.value ? { email: this.emailControl.value } : {}),
            ...(this.telefonoControl.value ? { celular: this.telefonoControl.value } : {}),
            offset: this.offset,
            limit: this.limit,
        }).pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading = false),
        ).subscribe({
            next: (response) => {
                this.patients = reset ? response.items : [...this.patients, ...response.items];
                this.hasMore = response.hasMore;
            },
            error: () => {
                this.notification.error('No pudimos buscar pacientes en este momento.');
            }
        });
    }

    loadMore(): void {
        if (this.loading || !this.hasMore) { return; }
        this.offset += this.limit;
        this.search(false);
    }

    clearFilters(): void {
        this.estadoControl.setValue('', { emitEvent: false });
        this.sexoControl.setValue('', { emitEvent: false });
        this.emailControl.setValue('', { emitEvent: false });
        this.telefonoControl.setValue('', { emitEvent: false });
        this.search(true);
    }

    openDetail(patient: Patient): void {
        this.selectedPatient = patient;
        this.drawerOpen = true;
    }

    closeDrawer(): void {
        this.drawerOpen = false;
    }

    editPatient(patient: Patient): void {
        const id = patient.idMPI || patient._id;
        if (!id) {
            this.notification.warning('No se puede editar un paciente sin identificador.');
            return;
        }

        this.drawerOpen = false;
        this.router.navigate(['/pacientes', id, 'editar'], {
            queryParams: this.route.snapshot.queryParams,
        });
    }

    editSelected(): void {
        if (!this.selectedPatient) { return; }
        this.editPatient(this.selectedPatient);
    }

    createPatient(): void {
        this.router.navigate(['/pacientes/nuevo'], {
            queryParams: this.route.snapshot.queryParams,
        });
    }

    validateSelected(): void {
        if (!this.selectedPatient || !this.selectedPatient.dni || this.isValidating) { return; }
        const id = this.selectedPatient.idMPI || this.selectedPatient._id;
        if (!id) { return; }

        this.isValidating = true;
        this.patientsService.validatePatientById(id).pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isValidating = false),
        ).subscribe({
            next: (patient) => {
                this.selectedPatient = patient;
                this.notification.success('Paciente validado correctamente');
                this.search(true);
            },
            error: () => {
                this.notification.error('No fue posible validar el paciente');
            }
        });
    }

    deleteSelected(): void {
        if (!this.selectedPatient) { return; }
        const patient = this.selectedPatient;
        const ref = this.dialog.open(DeletePatientDialogComponent, {
            width: '460px',
            data: {
                name: `${patient.lastName}, ${patient.firstName}`.replace(/^,\s*/, ''),
                dni: patient.dni,
            }
        });

        ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed) => {
            if (!confirmed) { return; }
            const id = patient.idMPI || patient._id;
            if (!id) { return; }
            this.patientsService.deletePatient(id).pipe(takeUntil(this.destroy$)).subscribe({
                next: () => {
                    this.drawerOpen = false;
                    this.selectedPatient = null;
                    this.notification.success('Paciente eliminado');
                    this.search(true);
                },
                error: () => {
                    this.notification.error('No fue posible eliminar el paciente');
                }
            });
        });
    }

    trackByPatient(_index: number, patient: Patient): string {
        return patient.idMPI || patient._id || patient.dni || '';
    }

    private patientKey(patient?: Patient | null): string {
        return patient ? (patient.idMPI || patient._id || patient.dni || '') : '';
    }
}
