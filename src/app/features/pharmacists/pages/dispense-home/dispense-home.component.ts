import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import moment from 'moment';
import { SidebarItem } from '@shared/components/layout/sidebar/sidebar.component';
import { SidebarService } from '@shared/services/sidebar.service';
import { UnifiedPrinterComponent } from '@shared/components/unified-printer/unified-printer.component';
import { NotificationService } from '@shared/services/notification.service';
import { DispenseService, MixedPrescription, DispenseReplacement } from '../../services/dispense.service';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { Prescriptions } from '@interfaces/prescriptions';
import { Observable, Subject, Subscription, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { DispenseConfirmDialogComponent, DispenseConfirmResult } from '../../components/dispense-confirm-dialog/dispense-confirm-dialog.component';
import { FrequentMedication } from '@shared/models/medication.types';

@Component({
    selector: 'app-dispense-home',
    templateUrl: './dispense-home.component.html',
    styleUrls: ['./dispense-home.component.sass'],
    standalone: false
})
export class DispenseHomeComponent implements OnInit, OnDestroy {
    sidebarItems: SidebarItem[] = [];
    prescriptions$: Observable<MixedPrescription[]>;
    loading$: Observable<boolean>;
    total$: Observable<number>;
    sources$: Observable<{ local: number; andes: number }>;

    searchControl = new FormControl('');
    dateFromControl = new FormControl('');
    dateToControl = new FormControl('');
    statusControl = new FormControl('');
    sexoControl = new FormControl('');

    showFilters = false;
    selectedPrescription: MixedPrescription | null = null;
    drawerOpen = false;
    pageIndex = 0;
    pageSize = 15;
    private _total = 0;
    private destroy$ = new Subject<void>();
    private prescriptionsSub: Subscription | null = null;
    private totalSub: Subscription | null = null;

    statusOptions = [
        { value: '', label: 'Todos los estados' },
        { value: 'pendiente', label: 'Pendiente / Vigente' },
        { value: 'dispensada', label: 'Dispensada' },
        { value: 'vencida', label: 'Vencida' },
        { value: 'finalizada', label: 'Finalizada' },
        { value: 'suspendida', label: 'Suspendida' },
        { value: 'rechazada', label: 'Rechazada' },
    ];

    sexoOptions = [
        { value: '', label: 'Todos los sexos' },
        { value: 'm', label: 'Masculino' },
        { value: 'f', label: 'Femenino' },
    ];

    get hasActiveFilters(): boolean {
        return this.activeFilterCount > 0;
    }

    get activeFilterCount(): number {
        let count = 0;
        if (this.dateFromControl.value) { count++; }
        if (this.dateToControl.value) { count++; }
        if (this.statusControl.value) { count++; }
        if (this.sexoControl.value) { count++; }
        return count;
    }

    get resultsFrom(): number {
        return this._total === 0 ? 0 : this.pageIndex * this.pageSize + 1;
    }

    get resultsTo(): number {
        return Math.min(this.resultsFrom + this.pageSize - 1, this._total);
    }

    constructor(
        private sidebarService: SidebarService,
        private dispenseService: DispenseService,
        private printer: UnifiedPrinterComponent,
        private dialog: MatDialog,
        private notification: NotificationService,
    ) {
        this.prescriptions$ = this.dispenseService.prescriptions$;
        this.loading$ = this.dispenseService.loading$;
        this.total$ = this.dispenseService.total$;
        this.sources$ = this.dispenseService.sources$;
    }

    ngOnInit(): void {
        this.sidebarItems = this.sidebarService.getItems();
        this.prescriptionsSub = this.prescriptions$.subscribe((list) => this.syncSelection(list));
        this.totalSub = this.total$.subscribe((total) => { this._total = total; });

        const search$ = this.searchControl.valueChanges.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            takeUntil(this.destroy$),
        );
        const filters$ = merge(
            this.statusControl.valueChanges,
            this.sexoControl.valueChanges,
            this.dateFromControl.valueChanges,
            this.dateToControl.valueChanges,
        ).pipe(takeUntil(this.destroy$));

        merge(search$, filters$).pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.pageIndex = 0;
            this.dispenseService.load(this.buildFilters());
        });

        this.loadInitial();
    }

    loadInitial(): void {
        this.dispenseService.load({});
    }

    private buildFilters(): { status?: string; sexo?: string; dateFrom?: string; dateTo?: string; searchTerm?: string } {
        return {
            status: this.statusControl.value || undefined,
            sexo: this.sexoControl.value || undefined,
            dateFrom: this.dateFromControl.value ? moment(this.dateFromControl.value).format('YYYY-MM-DD') : undefined,
            dateTo: this.dateToControl.value ? moment(this.dateToControl.value).format('YYYY-MM-DD') : undefined,
            searchTerm: (this.searchControl.value || '').trim() || undefined,
        };
    }

    private syncSelection(list: MixedPrescription[]): void {
        if (!list.length) {
            this.selectedPrescription = null;
            return;
        }
        if (!this.selectedPrescription || !list.some((p) => p._id === this.selectedPrescription!._id)) {
            this.selectedPrescription = list[0];
        }
    }

    onSearch(): void {
        this.pageIndex = 0;
        this.dispenseService.load(this.buildFilters());
    }

    onClearSearch(): void {
        this.searchControl.setValue('', { emitEvent: false });
        this.pageIndex = 0;
        this.dispenseService.load(this.buildFilters());
    }

    onClear(): void {
        this.searchControl.setValue('', { emitEvent: false });
        this.dateFromControl.setValue('', { emitEvent: false });
        this.dateToControl.setValue('', { emitEvent: false });
        this.statusControl.setValue('', { emitEvent: false });
        this.sexoControl.setValue('', { emitEvent: false });
        this.pageIndex = 0;
        this.dispenseService.load({});
    }

    onRefresh(): void {
        this.dispenseService.refresh();
    }

    selectPrescription(prescription: MixedPrescription): void {
        this.selectedPrescription = prescription;
        this.drawerOpen = true;
    }

    closeDrawer(): void {
        this.drawerOpen = false;
    }

    onPrint(prescription: MixedPrescription): void {
        if (this.dispenseService.isAndesPrescription(prescription)) {
            this.printer.printAndesPrescription(prescription);
        } else {
            this.printer.printPrescription(prescription);
        }
    }

    onDispense(prescription: MixedPrescription): void {
        this.closeDrawer();
        this.openDispenseConfirmDialog(prescription);
    }

    private openDispenseConfirmDialog(prescription: MixedPrescription): void {
        const info = this.extractPrescriptionInfo(prescription);

        const dialogRef = this.dialog.open(DispenseConfirmDialogComponent, {
            data: {
                prescription,
                medication: info.medication,
                quantity: info.quantity,
            },
            width: '680px',
            maxHeight: '95vh',
            panelClass: 'dispense-confirm-dialog',
            disableClose: true,
        });

        dialogRef.afterClosed().subscribe((result: DispenseConfirmResult | undefined) => {
            if (!result) { return; }

            const replacement: DispenseReplacement | undefined = result.action === 'replace'
                ? {
                    name: result.replacement!.supply?.nombre || result.replacement!.snomedConcept?.term || '',
                    quantity: Number(result.replacement!.quantity) || 1,
                    ...(result.replacement!.snomedConcept ? {
                        snomedConcept: {
                            conceptId: result.replacement!.snomedConcept.conceptId,
                            term: result.replacement!.snomedConcept.term,
                        },
                    } : {}),
                }
                : undefined;

            this.dispenseService.dispense(prescription, replacement).subscribe((dispenseResult) => {
                if (dispenseResult.success) {
                    this.notification.success('Dispensa realizada correctamente');
                    this.dispenseService.refresh();
                } else {
                    this.notification.error(dispenseResult.errorMessage || 'No se pudo realizar la dispensa');
                }
            });
        });
    }

    private extractPrescriptionInfo(p: MixedPrescription): { medication: FrequentMedication; quantity: number } {
        const isAndes = (item: MixedPrescription): item is AndesPrescriptions => 'estadoActual' in item;
        if (isAndes(p)) {
            const concepto = p.medicamento?.concepto;
            return {
                medication: {
                    id: `sno:${concepto?.conceptId || ''}`,
                    kind: 'generic',
                    name: concepto?.term || '',
                    presentation: concepto?.fsn || '',
                    price: 0,
                    actionDesc: concepto?.semanticTag || '',
                    snomedConcept: concepto,
                },
                quantity: p.medicamento?.cantEnvases || 1,
            };
        }
        const supply = p.supplies?.[0]?.supply;
        return {
            medication: {
                id: `vad:${supply?._id || ''}`,
                kind: 'commercial',
                name: supply?.name || '',
                presentation: supply?.snomedConcept?.fsn || '',
                price: 0,
                actionDesc: '',
            },
            quantity: p.supplies?.[0]?.quantity || 1,
        };
    }

    onCancelDispense(prescription: MixedPrescription): void {
        this.dispenseService.cancelDispense(prescription).subscribe((result) => {
            if (result.success) {
                this.notification.success('Dispensa deshecha correctamente');
                this.dispenseService.refresh();
            } else {
                this.notification.error(result.errorMessage || 'No se pudo deshacer la dispensa');
            }
        });
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.dispenseService.setFilters({
            offset: event.pageIndex * event.pageSize,
            limit: event.pageSize,
        });
    }

    isSelected(p: MixedPrescription): boolean {
        return this.drawerOpen && !!this.selectedPrescription && this.selectedPrescription._id === p._id;
    }

    isPendingSelected(): boolean {
        const p = this.selectedPrescription;
        if (!p) { return false; }
        const status = this.dispenseService.isAndesPrescription(p)
            ? (p as AndesPrescriptions).estadoActual?.tipo || ''
            : (p as Prescriptions).status || '';
        const s = status.toLowerCase();
        return s === 'pendiente' || s === 'vigente';
    }

    isDispensedSelected(): boolean {
        const p = this.selectedPrescription;
        if (!p) { return false; }
        const status = this.dispenseService.isAndesPrescription(p)
            ? (p as AndesPrescriptions).estadoActual?.tipo || ''
            : (p as Prescriptions).status || '';
        const s = status.toLowerCase();
        return s === 'dispensada' || s === 'dispensado' || s === 'finalizada';
    }

    get undoDisabledSelected(): boolean {
        const p = this.selectedPrescription;
        if (!p || !this.isDispensedSelected()) { return true; }
        const dispensedAt = this.dispenseService.isAndesPrescription(p)
            ? (p as AndesPrescriptions).estadoDispensaActual?.fecha
            : (p as Prescriptions).dispensedAt;
        if (!dispensedAt) { return false; }
        const elapsed = (Date.now() - new Date(dispensedAt).getTime()) / (1000 * 60 * 60);
        return elapsed >= 2;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.prescriptionsSub?.unsubscribe();
        this.totalSub?.unsubscribe();
    }
}
