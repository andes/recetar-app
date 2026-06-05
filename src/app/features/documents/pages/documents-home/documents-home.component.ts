import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
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
import { formatTipoInsumo } from '@services/stock.service';
import { DocumentsStatsService, DocumentsStats } from '@services/documents-stats.service';
import { AndesPrescriptionsService } from '@services/andesPrescription.service';
import { UnifiedPrinterComponent } from '@shared/components/unified-printer/unified-printer.component';
import { Prescriptions } from '@interfaces/prescriptions';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { Certificate } from '@interfaces/certificate';
import { Practice } from '@interfaces/practices';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { getStatusVariant as sharedGetStatusVariant, getStatusLabel as sharedGetStatusLabel } from '@shared/utils/status.utils';
import type { StatusVariant } from '@shared/utils/status.utils';

type MixedPrescription = Prescriptions | AndesPrescriptions;
type DocType = 'receta' | 'certificados' | 'practicas' | 'insumos' | null;

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
    drawerPatientName = '';
    drawerPatientDni = '';
    drawerMedName = '';
    drawerMedDetail = '';
    drawerMedIndication = '';
    drawerType: string | null = null;
    drawerStatus = '';
    drawerDate = '';
    drawerPrescriptionId = '';
    drawerProfessionalName = '';
    drawerProfessionalEnrollment = '';
    drawerDiagnosis = '';
    drawerDocumentType: 'prescription' | 'certificate' | 'practice' = 'prescription';
    drawerCertTitle = '';
    drawerCertStartDate = '';
    drawerCertEndDate = '';
    drawerCertCantDias = 0;
    drawerCertAnulated = false;
    drawerCertAnulateLabel = '';
    drawerPractTitle = '';
    drawerPractDiagnostic = '';
    drawerPractIndications = '';
    drawerPractDate = '';
    selectedType: DocType = 'receta';

    typeOptions: ToggleOption[] = [
        { value: 'receta', label: 'Recetas', icon: 'pill', color: 'receta', count: 0 },
        { value: 'certificados', label: 'Certificados', icon: 'verified', color: 'success', count: 0 },
        { value: 'practicas', label: 'Prácticas', icon: 'stethoscope', color: 'warning', count: 0 },
    ];

    readonly prescriptionColumns = ['fecha', 'paciente', 'medicamento', 'estado', 'acciones'];
    readonly certificateColumns = ['fecha', 'paciente', 'certificado', 'vigencia', 'estado', 'acciones'];
    readonly practiceColumns = ['fecha', 'paciente', 'practica', 'diagnostico', 'estado', 'acciones'];
    readonly supplyColumns = ['nombre', 'tipo', 'estado'];

    dataSourcePrescriptions = new MatTableDataSource<MixedPrescription>([]);
    dataSourceCertificates = new MatTableDataSource<Certificate>([]);
    dataSourcePractices = new MatTableDataSource<Practice>([]);
    dataSourceSupplies: Insumo[] = [];

    loadingPrescriptions = false;
    loadingCertificates = false;
    loadingPractices = false;
    loadingSupplies = false;

    pageIndex = 0;
    pageSize = 10;
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
        this.searchControl.setValue('', { emitEvent: false });
        this.load$.next();
    }

    onPageChange(event: PageEvent): void {
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

    isLoading(): boolean {
        return this.loadingPrescriptions || this.loadingCertificates || this.loadingPractices || this.loadingSupplies;
    }

    toggleFilters(): void {
        this.showFilters = !this.showFilters;
    }

    clearFilters(): void {
        this.filterDateFrom.setValue('');
        this.filterDateTo.setValue('');
        this.filterStatus.setValue('');
        this.searchControl.enable({ emitEvent: false });
        this.pageIndex = 0;
        this.load$.next();
    }

    applyFilters(): void {
        this.searchControl.setValue('', { emitEvent: false });
        this.searchControl.disable({ emitEvent: false });
        this.pageIndex = 0;
        this.load$.next();
    }

    openDrawer(item: MixedPrescription): void {
        this.drawerDocumentType = 'prescription';
        this.drawerPatientName = this.getPrescriptionPatientFullName(item);
        this.drawerPatientDni = this.getPrescriptionPatientDni(item);
        this.drawerMedName = this.getPrescriptionMedicamento(item);
        this.drawerType = this.getPrescriptionType(item);
        this.drawerStatus = this.getStatusLabel(this.getPrescriptionStatus(item));

        if (this.isAndesPrescription(item)) {
            const a = item;
            const fecha = a.fechaPrestacion || a.fechaRegistro;
            this.drawerDate = fecha ? fecha.toISOString() : '';
            this.drawerPrescriptionId = a.idAndes || a._id || '';
            this.drawerProfessionalName = (a.profesional as any)?.nombre || '';
            this.drawerProfessionalEnrollment = (a.profesional as any)?.matricula || '';
            this.drawerDiagnosis = a.diagnostico?.descripcion || a.diagnostico?.term || '';
        } else {
            const p = item as Prescriptions;
            this.drawerDate = p.date ? p.date.toISOString() : '';
            this.drawerPrescriptionId = p.prescriptionId || (p as any)._id || '';
            this.drawerProfessionalName = p.professional?.businessName || '';
            this.drawerProfessionalEnrollment = p.professional?.enrollment || '';
            this.drawerDiagnosis = p.diagnostic || p.supplies?.[0]?.diagnostic || '';
            const supply = p.supplies?.[0];
            if (supply) {
                const activePrinciple = (supply.supply as any)?.activePrinciple || (supply.supply as any)?.droga_descrip || '';
                const power = (supply.supply as any)?.power || '';
                const unity = (supply.supply as any)?.unity || '';
                const firstPres = (supply.supply as any)?.firstPresentation || supply.quantityPresentation || '';
                const qty = supply.quantity || 1;
                this.drawerMedDetail = [activePrinciple, firstPres ? `· ${firstPres}` : '', power ? `· ${power}${unity || ''}` : '', qty > 1 ? `· ${qty} unidades` : ''].filter(Boolean).join(' ');
                this.drawerMedIndication = supply.indication || '';
            }
        }

        this.drawerOpen = true;
    }

    openCertificateDrawer(item: Certificate): void {
        this.drawerDocumentType = 'certificate';
        this.drawerPatientName = this.getCertificatePatientFullName(item);
        this.drawerPatientDni = this.getCertificatePatientDni(item);
        this.drawerProfessionalName = item.professional?.businessName || '';
        this.drawerProfessionalEnrollment = item.professional?.enrollment || '';
        this.drawerDate = item.createdAt ? item.createdAt.toISOString() : '';
        this.drawerPrescriptionId = item._id || '';
        this.drawerStatus = this.getCertificateStatusLabel(item);
        this.drawerCertTitle = item.certificate || '';
        this.drawerCertStartDate = item.startDate ? item.startDate.toISOString() : '';
        this.drawerCertEndDate = item.endDate ? item.endDate.toISOString() : '';
        this.drawerCertCantDias = item.cantDias || 0;
        this.drawerCertAnulated = this.isCertificateAnulated(item);
        this.drawerCertAnulateLabel = this.drawerCertAnulated ? this.getCertificateAnulateLabel(item) : '';
        this.drawerOpen = true;
    }

    openPracticeDrawer(item: Practice): void {
        this.drawerDocumentType = 'practice';
        this.drawerPatientName = this.getPracticePatientFullName(item);
        this.drawerPatientDni = this.getPracticePatientDni(item);
        this.drawerProfessionalName = item.professional?.businessName || '';
        this.drawerProfessionalEnrollment = item.professional?.enrollment || '';
        this.drawerDate = item.date ? item.date.toISOString() : '';
        this.drawerPrescriptionId = item._id || '';
        this.drawerStatus = this.getStatusLabel(item.status || '');
        this.drawerPractTitle = item.practice || '';
        this.drawerPractDiagnostic = item.diagnostic || '';
        this.drawerPractIndications = item.indications || '';
        this.drawerPractDate = item.date ? item.date.toISOString() : '';
        this.drawerOpen = true;
    }

    closeDrawer(): void {
        this.drawerOpen = false;
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
                        this.dataSourcePrescriptions.data = items;
                        this.totalPrescriptions = response.total;
                        this.loadingPrescriptions = false;
                    })
                );
            }
            case 'certificados': {
                this.loadingCertificates = true;
                const params: any = { offset, limit: this.pageSize };
                if (searchTerm && searchTerm.length >= 3) { params.searchTerm = searchTerm; }
                const request$ = params.searchTerm
                    ? this.certificatesService.searchByTerm(userId, params)
                    : this.certificatesService.getByUserId(userId, { offset, limit: this.pageSize });
                return request$.pipe(
                    tap(response => {
                        this.dataSourceCertificates.data = response.certificates;
                        this.totalCertificates = response.total;
                        this.loadingCertificates = false;
                    })
                );
            }
            case 'practicas': {
                this.loadingPractices = true;
                const params: any = { offset, limit: this.pageSize };
                if (searchTerm && searchTerm.length >= 3) { params.searchTerm = searchTerm; }
                const request$ = params.searchTerm
                    ? this.practicesService.searchByTerm(userId, params)
                    : this.practicesService.getByUserId(userId, { offset, limit: this.pageSize });
                return request$.pipe(
                    tap(response => {
                        this.dataSourcePractices.data = response.practices;
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

    isAndesPrescription(item: MixedPrescription): item is AndesPrescriptions {
        return 'paciente' in item && !('patient' in item);
    }

    getPrescriptionPatient(item: MixedPrescription) {
        if (this.isAndesPrescription(item)) {
            return item.paciente;
        }
        return item.patient;
    }

    getPrescriptionPatientFullName(item: MixedPrescription): string {
        const p = this.getPrescriptionPatient(item);
        if (!p) { return ''; }
        if (this.isAndesPrescription(item)) {
            const a = p as any;
            return `${a.apellido || ''}, ${a.nombre || ''}`.trim();
        }
        const a = p as any;
        return `${a.lastName || ''}, ${a.firstName || ''}`.trim();
    }

    getPrescriptionPatientDni(item: MixedPrescription): string {
        const p = this.getPrescriptionPatient(item);
        if (!p) { return ''; }
        if (this.isAndesPrescription(item)) {
            return (p as any).documento || '';
        }
        return (p as any).dni || '';
    }

    getCertificatePatientFullName(item: Certificate): string {
        const p = item.patient as any;
        if (!p) { return ''; }
        return `${p.lastName || ''}, ${p.firstName || ''}`.trim();
    }

    getCertificatePatientDni(item: Certificate): string {
        return (item.patient as any)?.dni || '';
    }

    getPracticePatientFullName(item: Practice): string {
        const p = item.patient as any;
        if (!p) { return ''; }
        return `${p.lastName || ''}, ${p.firstName || ''}`.trim();
    }

    getPracticePatientDni(item: Practice): string {
        return (item.patient as any)?.dni || '';
    }

    getPrescriptionMedicamento(item: MixedPrescription): string {
        if (this.isAndesPrescription(item)) {
            return item.medicamento?.concepto?.term || '';
        }
        return item.supplies?.map(s => s.supply?.name || '').join(', ') || '';
    }

    getPrescriptionType(item: MixedPrescription): string | null {
        if (this.isAndesPrescription(item)) {
            return null;
        }
        const supplies = (item as Prescriptions).supplies || [];
        if (supplies.some(s => s.triplicate)) {
            return 'triplicado';
        }
        if (supplies.some(s => s.duplicate)) {
            return 'duplicado';
        }
        return null;
    }

    getPrescriptionStatus(item: MixedPrescription): string {
        if (this.isAndesPrescription(item)) {
            return item.estadoActual?.tipo || '';
        }
        return item.status || '';
    }

    getPrescriptionSource(item: MixedPrescription): string {
        return this.isAndesPrescription(item) ? 'Andes' : 'RecetAR';
    }

    private matchesPrescription(p: MixedPrescription, term: string): boolean {
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

    getStatusVariant(status: string): StatusVariant {
        return sharedGetStatusVariant(status);
    }

    getStatusLabel(status: string): string {
        return sharedGetStatusLabel(status);
    }

    getCertificateStatusVariant(cert: Certificate): 'success' | 'info' | 'warning' | 'error' {
        if (cert.anulateDate) { return 'error'; }
        const now = new Date();
        if (cert.endDate && cert.endDate < now) { return 'error'; }
        if (cert.startDate && cert.startDate > now) { return 'warning'; }
        return 'success';
    }

    getCertificateStatusLabel(cert: Certificate): string {
        if (cert.anulateDate) { return 'Anulado'; }
        const now = new Date();
        if (cert.endDate && cert.endDate < now) { return 'Vencido'; }
        if (cert.startDate && cert.startDate > now) { return 'Pendiente'; }
        return 'Vigente';
    }

    isCertificateAnulated(cert: Certificate): boolean {
        return !!cert.anulateDate;
    }

    getCertificateAnulateLabel(cert: Certificate): string {
        const parts: string[] = [];
        if (cert.anulateDate) {
            parts.push('Anulado el ' + cert.anulateDate.toLocaleDateString('es-AR'));
        }
        if (cert.anulateReason) {
            parts.push(cert.anulateReason);
        }
        return parts.join(' · ') || 'Anulado';
    }

    getSupplyStatusVariant(insumo: Insumo): 'success' | 'info' | 'warning' | 'error' {
        const status = (insumo.estado || insumo.status || '').toLowerCase();
        if (status === 'activo' || status === 'active') { return 'success'; }
        if (status === 'inactivo') { return 'error'; }
        return 'info';
    }

    getSupplyStatusLabel(insumo: Insumo): string {
        const status = insumo.estado || insumo.status || '';
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() || '—';
    }

    formatTipoInsumo = formatTipoInsumo;

    private setTypeCount(value: string, count: number): void {
        const opt = this.typeOptions.find(o => o.value === value);
        if (opt) { opt.count = count; }
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

    private updateTypeOptionCount(value: string, count: number): void {
        const opt = this.typeOptions.find(o => o.value === value);
        if (opt) { opt.count = count; }
    }

    printPrescription(item: MixedPrescription): void {
        if (this.isAndesPrescription(item)) {
            this.printer.printAndesPrescription(item);
        } else {
            this.printer.printPrescription(item);
        }
    }

    printCertificate(item: Certificate): void {
        this.printer.printCertificate(item);
    }

    printPractice(item: Practice): void {
        this.printer.printPractice(item);
    }

    deletePrescription(item: MixedPrescription): void {
        const label = this.getPrescriptionMedicamento(item);
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
                this.load$.next();
            },
            error: () => {
                this.snackBar.open('Error al anular el certificado', 'Cerrar', { duration: 3000 });
            }
        });
    }
}
