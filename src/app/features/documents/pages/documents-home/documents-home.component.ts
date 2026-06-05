import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, tap, filter, catchError } from 'rxjs/operators';

import { SidebarItem } from '@shared/components/layout/sidebar/sidebar.component';
import { SidebarService } from '@shared/services/sidebar.service';
import { ToggleOption } from '@shared/ui/toggle.component';
import { AuthService } from '@auth/services/auth.service';
import { AmbitoService } from '@auth/services/ambito.service';
import { PrescriptionsService } from '@services/prescriptions.service';
import { CertificatesService } from '@services/certificates.service';
import { PracticesService } from '@services/practices.service';
import { StockService } from '@services/stock.service';
import type { Insumo } from '@services/stock.service';
import { DocumentsStatsService, DocumentsStats } from '@services/documents-stats.service';
import { AndesPrescriptionsService } from '@services/andesPrescription.service';
import { UnifiedPrinterComponent } from '@shared/components/unified-printer/unified-printer.component';
import { Prescriptions } from '@interfaces/prescriptions';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { Certificate } from '@interfaces/certificate';
import { Practice } from '@interfaces/practices';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import type { DocumentItemType, DocumentItemData } from '../../components/document-item/document-item.component';

type MixedPrescription = Prescriptions | AndesPrescriptions;
type DocType = DocumentItemType | null;

@Component({
    selector: 'app-documents-home',
    templateUrl: './documents-home.component.html',
    styleUrls: ['./documents-home.component.sass'],
    standalone: false
})
export class DocumentsHomeComponent implements OnInit, OnDestroy {

    sidebarItems: SidebarItem[] = [];

    searchControl = new FormControl('');
    filterDateFrom = new FormControl('');
    filterDateTo = new FormControl('');
    filterStatus = new FormControl('');
    showFilters = false;

    drawerOpen = false;
    selectedDocument: DocumentItemData | null = null;
    selectedType: DocType = 'receta';

    typeOptions: ToggleOption[] = [
        { value: 'receta', label: 'Recetas', icon: 'pill', color: 'receta', count: 0 },
        { value: 'certificados', label: 'Certificados', icon: 'verified', color: 'success', count: 0 },
        { value: 'practicas', label: 'Prácticas', icon: 'stethoscope', color: 'warning', count: 0 },
    ];

    dataSourcePrescriptions: MixedPrescription[] = [];
    dataSourceCertificates: Certificate[] = [];
    dataSourcePractices: Practice[] = [];
    dataSourceSupplies: Insumo[] = [];

    loadingPrescriptions = false;
    loadingCertificates = false;
    loadingPractices = false;
    loadingSupplies = false;

    pageIndex = 0;
    pageSize = 15;
    totalPrescriptions = 0;
    totalCertificates = 0;
    totalPractices = 0;

    stats: DocumentsStats = {
        totals: { receta: 0, certificados: 0, practicas: 0, insumos: 0 },
        prescriptions: { pendiente: 0, dispensada: 0, vencida: 0 },
        certificates: { total: 0, anulados: 0 },
        practices: { active: 0, completed: 0, cancelled: 0 },
    };

    private load$ = new Subject<void>();
    private destroy$ = new Subject<void>();

    constructor(
        private sidebarService: SidebarService,
        private authService: AuthService,
        private ambitoService: AmbitoService,
        private prescriptionsService: PrescriptionsService,
        private certificatesService: CertificatesService,
        private practicesService: PracticesService,
        private stockService: StockService,
        private andesPrescriptionsService: AndesPrescriptionsService,
        private printer: UnifiedPrinterComponent,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private statsService: DocumentsStatsService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.sidebarItems = this.sidebarService.getItems();

        this.loadStats();

        this.ambitoService.getAmbitoSeleccionado.pipe(
            takeUntil(this.destroy$)
        ).subscribe(ambito => {
            const hasInsumos = this.typeOptions.some(o => o.value === 'insumos');
            if (ambito === 'publico' && !hasInsumos) {
                this.typeOptions.push({ value: 'insumos', label: 'Insumos', icon: 'healing', color: 'info', count: 0 });
            } else if (ambito !== 'publico' && hasInsumos) {
                const idx = this.typeOptions.findIndex(o => o.value === 'insumos');
                if (idx >= 0) { this.typeOptions.splice(idx, 1); }
                if (this.selectedType === 'insumos') { this.selectedType = 'receta'; }
            }
        });

        this.load$.pipe(
            takeUntil(this.destroy$),
            switchMap(() => this.loadData().pipe(
                catchError(() => {
                    this.loadingPrescriptions = false;
                    this.loadingCertificates = false;
                    this.loadingPractices = false;
                    this.loadingSupplies = false;
                    return of(null);
                })
            ))
        ).subscribe();

        this.searchControl.valueChanges.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.pageIndex = 0;
            this.load$.next();
        });

        this.load$.next();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onTypeChange(type: string): void {
        this.selectedType = type as DocType;
        this.pageIndex = 0;
        this.closeDrawer();
        this.searchControl.setValue('', { emitEvent: false });
        this.load$.next();
    }

    onPageChange(event: { pageIndex: number; pageSize: number }): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.load$.next();
    }

    get activeFilterCount(): number {
        return (this.filterDateFrom.value ? 1 : 0) +
            (this.filterDateTo.value ? 1 : 0) +
            (this.filterStatus.value ? 1 : 0);
    }

    get hasActiveFilters(): boolean {
        return this.activeFilterCount > 0;
    }

    get totalResults(): number {
        switch (this.selectedType) {
            case 'receta': return this.totalPrescriptions;
            case 'certificados': return this.totalCertificates;
            case 'practicas': return this.totalPractices;
            case 'insumos': return this.dataSourceSupplies.length;
            default: return 0;
        }
    }

    get resultsLabel(): string {
        switch (this.selectedType) {
            case 'receta': return 'Recetas';
            case 'certificados': return 'Certificados';
            case 'practicas': return 'Prácticas';
            case 'insumos': return 'Insumos';
            default: return '';
        }
    }

    get resultsRange(): { from: number; to: number } {
        const from = this.totalResults === 0 ? 0 : this.pageIndex * this.pageSize + 1;
        const to = Math.min(from + this.pageSize - 1, this.totalResults);
        return { from, to };
    }

    get currentItems(): DocumentItemData[] {
        switch (this.selectedType) {
            case 'receta': return this.dataSourcePrescriptions;
            case 'certificados': return this.dataSourceCertificates;
            case 'practicas': return this.dataSourcePractices;
            case 'insumos': return this.dataSourceSupplies;
            default: return [];
        }
    }

    get drawerTitle(): string {
        switch (this.selectedType) {
            case 'certificados': return 'Detalle de certificado';
            case 'practicas': return 'Detalle de práctica';
            case 'insumos': return 'Detalle de insumo';
            default: return 'Detalle de receta';
        }
    }

    isLoading(): boolean {
        return this.loadingPrescriptions || this.loadingCertificates || this.loadingPractices || this.loadingSupplies;
    }

    toggleFilters(): void {
        this.showFilters = !this.showFilters;
    }

    clearSearch(): void {
        this.searchControl.setValue('', { emitEvent: false });
        this.pageIndex = 0;
        this.load$.next();
    }

    clearFilters(): void {
        this.filterDateFrom.setValue('');
        this.filterDateTo.setValue('');
        this.filterStatus.setValue('');
        this.searchControl.setValue('', { emitEvent: false });
        this.pageIndex = 0;
        this.load$.next();
    }

    refresh(): void {
        this.loadStats();
        this.load$.next();
    }

    selectDocument(item: DocumentItemData): void {
        this.selectedDocument = item;
        this.drawerOpen = true;
    }

    closeDrawer(): void {
        this.drawerOpen = false;
    }

    isSelected(item: DocumentItemData): boolean {
        return this.drawerOpen && !!this.selectedDocument && this.docId(this.selectedDocument) === this.docId(item);
    }

    canPrintSelected(): boolean {
        return this.selectedType === 'receta' || this.selectedType === 'certificados' || this.selectedType === 'practicas';
    }

    canDeleteSelected(): boolean {
        return this.selectedType === 'receta' || this.selectedType === 'practicas';
    }

    canAnulateSelected(): boolean {
        return this.selectedType === 'certificados' && !(this.selectedDocument as Certificate)?.anulateDate;
    }

    printSelected(): void {
        if (!this.selectedDocument) { return; }
        if (this.selectedType === 'receta') {
            this.printPrescription(this.selectedDocument as MixedPrescription);
        } else if (this.selectedType === 'certificados') {
            this.printer.printCertificate(this.selectedDocument as Certificate);
        } else if (this.selectedType === 'practicas') {
            this.printer.printPractice(this.selectedDocument as Practice);
        }
    }

    deleteSelected(): void {
        if (!this.selectedDocument) { return; }
        if (this.selectedType === 'receta') {
            this.deletePrescription(this.selectedDocument as MixedPrescription);
        } else if (this.selectedType === 'practicas') {
            this.deletePractice(this.selectedDocument as Practice);
        }
    }

    anulateSelected(): void {
        if (!this.selectedDocument || this.selectedType !== 'certificados') { return; }
        this.anulateCertificate(this.selectedDocument as Certificate);
    }

    private docId(item: DocumentItemData): string {
        return (item as { _id?: string })._id || '';
    }

    private loadData() {
        const searchTerm = this.hasActiveFilters ? '' : (this.searchControl.value || '').trim();
        const dateFrom = this.filterDateFrom.value;
        const dateTo = this.filterDateTo.value;
        const statusFilter = (this.filterStatus.value || '').trim();
        if (!this.selectedType) { return of(null); }

        const userId = this.authService.getLoggedUserId();
        const offset = this.pageIndex * this.pageSize;

        switch (this.selectedType) {
            case 'receta': {
                this.loadingPrescriptions = true;
                const request$ = this.prescriptionsService.getByUserId(userId, {
                    offset, limit: this.pageSize,
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                    status: statusFilter || undefined,
                });
                return request$.pipe(
                    tap(response => {
                        let items = response.prescriptions;
                        if (searchTerm && searchTerm.length >= 3) {
                            const term = searchTerm.toLowerCase();
                            items = items.filter(p => this.matchesPrescription(p, term));
                        }
                        this.dataSourcePrescriptions = items;
                        this.totalPrescriptions = response.total;
                        this.loadingPrescriptions = false;
                    })
                );
            }
            case 'certificados': {
                this.loadingCertificates = true;
                const params: { offset: number; limit: number; searchTerm?: string } = { offset, limit: this.pageSize };
                if (searchTerm && searchTerm.length >= 3) { params.searchTerm = searchTerm; }
                const request$ = params.searchTerm
                    ? this.certificatesService.searchByTerm(userId, params)
                    : this.certificatesService.getByUserId(userId, { offset, limit: this.pageSize });
                return request$.pipe(
                    tap(response => {
                        this.dataSourceCertificates = response.certificates;
                        this.totalCertificates = response.total;
                        this.loadingCertificates = false;
                    })
                );
            }
            case 'practicas': {
                this.loadingPractices = true;
                const params: { offset: number; limit: number; searchTerm?: string } = { offset, limit: this.pageSize };
                if (searchTerm && searchTerm.length >= 3) { params.searchTerm = searchTerm; }
                const request$ = params.searchTerm
                    ? this.practicesService.searchByTerm(userId, params)
                    : this.practicesService.getByUserId(userId, { offset, limit: this.pageSize });
                return request$.pipe(
                    tap(response => {
                        this.dataSourcePractices = response.practices;
                        this.totalPractices = response.total;
                        this.loadingPractices = false;
                    })
                );
            }
            case 'insumos': {
                this.loadingSupplies = true;
                return this.stockService.getAll().pipe(
                    tap(insumos => {
                        this.dataSourceSupplies = searchTerm
                            ? insumos.filter(i =>
                                (i.name || i.insumo || '').toLowerCase().includes(searchTerm.toLowerCase()))
                            : insumos;
                        this.loadingSupplies = false;
                    })
                );
            }
            default:
                return of(null);
        }
    }

    matchesPrescription(p: MixedPrescription, term: string): boolean {
        if (this.isAndesPrescription(p)) {
            const nombre = (p.paciente?.nombre || '').toLowerCase();
            const apellido = (p.paciente?.apellido || '').toLowerCase();
            const documento = (p.paciente?.documento || '').toLowerCase();
            const medicamento = (p.medicamento?.concepto?.term || '').toLowerCase();
            return nombre.includes(term) || apellido.includes(term)
                || documento.includes(term) || medicamento.includes(term);
        }
        const firstName = (p.patient?.firstName || '').toLowerCase();
        const lastName = (p.patient?.lastName || '').toLowerCase();
        const dni = (p.patient?.dni || '').toLowerCase();
        const supplies = (p.supplies || []).map(s => (s.supply?.name || '').toLowerCase()).join(' ');
        return firstName.includes(term) || lastName.includes(term)
            || dni.includes(term) || supplies.includes(term);
    }

    isAndesPrescription(item: MixedPrescription): item is AndesPrescriptions {
        return 'paciente' in item && !('patient' in item);
    }

    private loadStats(): void {
        this.statsService.getStats().pipe(
            takeUntil(this.destroy$),
            catchError(() => of(null))
        ).subscribe(data => {
            if (data) {
                this.stats = data;
                this.typeOptions = this.typeOptions.map(opt => ({
                    ...opt,
                    count: data.totals[opt.value as keyof typeof data.totals] ?? opt.count
                }));
                this.cdr.markForCheck();
            }
        });
    }

    printPrescription(item: MixedPrescription): void {
        if (this.isAndesPrescription(item)) {
            this.printer.printAndesPrescription(item);
        } else {
            this.printer.printPrescription(item);
        }
    }

    printDocument(item: DocumentItemData): void {
        switch (this.selectedType) {
            case 'receta': this.printPrescription(item as MixedPrescription); break;
            case 'certificados': this.printer.printCertificate(item as Certificate); break;
            case 'practicas': this.printer.printPractice(item as Practice); break;
        }
    }

    removeDocument(item: DocumentItemData): void {
        switch (this.selectedType) {
            case 'receta': this.deletePrescription(item as MixedPrescription); break;
            case 'practicas': this.deletePractice(item as Practice); break;
        }
    }

    anulateDocument(item: DocumentItemData): void {
        this.anulateCertificate(item as Certificate);
    }

    deletePrescription(item: MixedPrescription): void {
        const label = this.isAndesPrescription(item)
            ? (item.medicamento?.concepto?.term || '')
            : (item.supplies?.map(s => s.supply?.name || '').join(', ') || '');
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            panelClass: ['confirm-dialog-panel', 'dialog-sm'],
            data: { title: 'Eliminar receta', message: `¿Eliminar la receta de "${label}"?` }
        });
        dialogRef.afterClosed().pipe(
            filter(result => result === true),
            switchMap(() => {
                if (this.isAndesPrescription(item)) {
                    return this.andesPrescriptionsService.suspendPrescription(
                        item.idAndes || item._id,
                        item.profesional?.id || ''
                    );
                }
                return this.prescriptionsService.deletePrescription(item._id!);
            })
        ).subscribe({
            next: () => {
                this.snackBar.open('Receta eliminada', 'Cerrar', { duration: 3000 });
                this.closeDrawer();
                this.load$.next();
            },
            error: () => {
                this.snackBar.open('Error al eliminar la receta', 'Cerrar', { duration: 3000 });
            }
        });
    }

    deletePractice(item: Practice): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            panelClass: ['confirm-dialog-panel', 'dialog-sm'],
            data: { title: 'Eliminar práctica', message: `¿Eliminar la práctica "${item.practice}"?` }
        });
        dialogRef.afterClosed().pipe(
            filter(result => result === true),
            switchMap(() => this.practicesService.deletePractice(item._id!))
        ).subscribe({
            next: () => {
                this.snackBar.open('Práctica eliminada', 'Cerrar', { duration: 3000 });
                this.closeDrawer();
                this.load$.next();
            },
            error: () => {
                this.snackBar.open('Error al eliminar la práctica', 'Cerrar', { duration: 3000 });
            }
        });
    }

    anulateCertificate(item: Certificate): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            panelClass: ['confirm-dialog-panel', 'dialog-sm'],
            data: { title: 'Anular certificado', message: '¿Anular este certificado?' }
        });
        dialogRef.afterClosed().pipe(
            filter(result => result === true),
            switchMap(() => this.certificatesService.anulateCertificate(item))
        ).subscribe({
            next: () => {
                this.snackBar.open('Certificado anulado', 'Cerrar', { duration: 3000 });
                this.closeDrawer();
                this.load$.next();
            },
            error: () => {
                this.snackBar.open('Error al anular el certificado', 'Cerrar', { duration: 3000 });
            }
        });
    }
}
