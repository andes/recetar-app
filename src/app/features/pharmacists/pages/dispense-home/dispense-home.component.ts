import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import moment from 'moment';
import { SidebarItem } from '@shared/components/layout/sidebar/sidebar.component';
import { SidebarService } from '@shared/services/sidebar.service';
import { UnifiedPrinterComponent } from '@shared/components/unified-printer/unified-printer.component';
import { DispenseService, MixedPrescription } from '../../services/dispense.service';
import { DispenseMedicationsService, MedicationSummary, MedicationPrescriptionRef } from '../../services/dispense-medications.service';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { Prescriptions } from '@interfaces/prescriptions';
import { Observable } from 'rxjs';

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
    medications$: Observable<MedicationSummary[]>;
    medicationsLoading$: Observable<boolean>;

    searchControl = new FormControl('');
    dateFromControl = new FormControl('');
    dateToControl = new FormControl('');
    statusControl = new FormControl('');

    showFilters = false;
    drawerOpen = false;
    selectedPrescription: MixedPrescription | null = null;
    pageIndex = 0;
    pageSize = 20;
    private _total = 0;

    statusOptions = [
        { value: '', label: 'Todos los estados' },
        { value: 'pendiente', label: 'Pendiente / Vigente' },
        { value: 'dispensada', label: 'Dispensada' },
        { value: 'vencida', label: 'Vencida' },
        { value: 'finalizada', label: 'Finalizada' },
        { value: 'suspendida', label: 'Suspendida' },
        { value: 'rechazada', label: 'Rechazada' },
    ];

    get hasActiveFilters(): boolean {
        return !!(this.dateFromControl.value || this.dateToControl.value || this.statusControl.value);
    }

    get activeFilterCount(): number {
        return (this.dateFromControl.value ? 1 : 0)
            + (this.dateToControl.value ? 1 : 0)
            + (this.statusControl.value ? 1 : 0);
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
        private medicationsService: DispenseMedicationsService,
        private printer: UnifiedPrinterComponent,
    ) {
        this.prescriptions$ = this.dispenseService.prescriptions$;
        this.loading$ = this.dispenseService.loading$;
        this.total$ = this.dispenseService.total$;
        this.sources$ = this.dispenseService.sources$;
        this.medications$ = this.medicationsService.medications$;
        this.medicationsLoading$ = this.medicationsService.loading$;
    }

    ngOnInit(): void {
        this.sidebarItems = this.sidebarService.getItems();
        this.total$.subscribe((t) => this._total = t).unsubscribe();
        this.loadInitial();
    }

    loadInitial(): void {
        this.dispenseService.load({ status: 'pendiente' });
        this.medicationsService.load();
    }

    onSearch(): void {
        this.pageIndex = 0;
        this.dispenseService.load({
            status: this.statusControl.value || 'pendiente',
            dateFrom: this.dateFromControl.value ? moment(this.dateFromControl.value).format('YYYY-MM-DD') : undefined,
            dateTo: this.dateToControl.value ? moment(this.dateToControl.value).format('YYYY-MM-DD') : undefined,
            searchTerm: (this.searchControl.value || '').trim() || undefined,
        });
    }

    onClear(): void {
        this.searchControl.setValue('', { emitEvent: false });
        this.dateFromControl.setValue('', { emitEvent: false });
        this.dateToControl.setValue('', { emitEvent: false });
        this.statusControl.setValue('', { emitEvent: false });
        this.pageIndex = 0;
        this.dispenseService.load({ status: 'pendiente' });
    }

    onRefresh(): void {
        this.dispenseService.refresh();
    }

    onMedicationsRefresh(): void {
        this.medicationsService.refresh();
    }

    openDrawer(prescription: MixedPrescription): void {
        this.selectedPrescription = prescription;
        this.drawerOpen = true;
    }

    closeDrawer(): void {
        this.drawerOpen = false;
    }

    onMedicationClick(med: MedicationSummary): void {
        const prescriptions = this.getCurrentPrescriptions();
        const match = prescriptions.find((p) => {
            const name = this.dispenseService.isAndesPrescription(p)
                ? (p as AndesPrescriptions).medicamento?.concepto?.term || ''
                : (p as Prescriptions).supplies?.[0]?.supply?.name || '';
            return name === med.name;
        });
        if (match) { this.openDrawer(match); }
    }

    onMedicationPrescriptionClick(ref: MedicationPrescriptionRef): void {
        const prescriptions = this.getCurrentPrescriptions();
        const match = prescriptions.find((p) => {
            const code = this.dispenseService.isAndesPrescription(p)
                ? (p as AndesPrescriptions).idAndes || p._id
                : (p as Prescriptions).prescriptionId || p._id;
            return code === ref.code;
        });
        if (match) { this.openDrawer(match); }
    }

    onPrint(prescription: MixedPrescription): void {
        if (this.dispenseService.isAndesPrescription(prescription)) {
            this.printer.printAndesPrescription(prescription);
        } else {
            this.printer.printPrescription(prescription);
        }
    }

    onDispense(prescription: MixedPrescription): void {
        this.dispenseService.dispense(prescription).subscribe((result) => {
            if (result.success) {
                this.selectedPrescription = null;
                this.medicationsService.refresh();
            }
        });
    }

    onDispenseFromDrawer(prescription: MixedPrescription): void {
        this.dispenseService.dispense(prescription).subscribe((result) => {
            if (result.success) {
                this.closeDrawer();
                this.medicationsService.refresh();
            }
        });
    }

    onCancelDispense(prescription: MixedPrescription): void {
        this.dispenseService.cancelDispense(prescription).subscribe((result) => {
            if (result.success) { this.medicationsService.refresh(); }
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
        if (!this.selectedPrescription) { return false; }
        return this.selectedPrescription._id === p._id;
    }

    private getCurrentPrescriptions(): MixedPrescription[] {
        let list: MixedPrescription[] = [];
        this.prescriptions$.subscribe((p) => list = p).unsubscribe();
        return list;
    }

    ngOnDestroy(): void {
    }
}
