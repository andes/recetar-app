import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { AndesPrescriptionsService } from '@services/andesPrescription.service';
import { UnifiedPrinterComponent } from '@shared/components/unified-printer/unified-printer.component';
import { Prescriptions } from '@interfaces/prescriptions';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { Certificate } from '@interfaces/certificate';
import { Practice } from '@interfaces/practices';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

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
    selectedType: DocType = 'receta';

    typeOptions: ToggleOption[] = [
        { value: 'receta', label: 'Medicamentos', icon: 'medication' },
        { value: 'certificados', label: 'Certificados', icon: 'assignment' },
        { value: 'practicas', label: 'Prácticas', icon: 'biotech' },
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
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.sidebarItems = this.sidebarService.getItems();

        this.ambitoService.getAmbitoSeleccionado.pipe(
            takeUntil(this.destroy$)
        ).subscribe(ambito => {
            const hasInsumos = this.typeOptions.some(o => o.value === 'insumos');
            if (ambito === 'publico' && !hasInsumos) {
                this.typeOptions.push({ value: 'insumos', label: 'Insumos', icon: 'inventory_2' });
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

    isLoading(): boolean {
        return this.loadingPrescriptions || this.loadingCertificates || this.loadingPractices || this.loadingSupplies;
    }

    private loadData() {
        const searchTerm = (this.searchControl.value || '').trim();
        if (!this.selectedType) { return of(null); }

        const userId = this.authService.getLoggedUserId();
        const offset = this.pageIndex * this.pageSize;

        switch (this.selectedType) {
            case 'receta': {
                this.loadingPrescriptions = true;
                const request$ = this.prescriptionsService.getByUserId(userId, { offset, limit: this.pageSize });
                return request$.pipe(
                    tap(response => {
                        if (searchTerm && searchTerm.length >= 3) {
                            const term = searchTerm.toLowerCase();
                            const filtered = response.prescriptions.filter(p =>
                                this.matchesPrescription(p, term)
                            );
                            this.dataSourcePrescriptions.data = filtered;
                            this.totalPrescriptions = filtered.length;
                        } else {
                            this.dataSourcePrescriptions.data = response.prescriptions;
                            this.totalPrescriptions = response.total;
                        }
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

    getPrescriptionMedicamento(item: MixedPrescription): string {
        if (this.isAndesPrescription(item)) {
            return item.medicamento?.concepto?.term || '';
        }
        return item.supplies?.map(s => s.supply?.name || '').join(', ') || '';
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

    getStatusVariant(status: string): 'success' | 'info' | 'warning' | 'error' {
        const s = (status || '').toLowerCase();
        if (s === 'vigente' || s === 'activo' || s === 'dispensada' || s === 'active') { return 'success'; }
        if (s === 'vencida' || s === 'suspendida' || s === 'cancelled' || s === 'anulada') { return 'error'; }
        if (s === 'completada' || s === 'completed') { return 'success'; }
        return 'info';
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            vigente: 'Vigente',
            vencida: 'Vencida',
            suspendida: 'Suspendida',
            finalizada: 'Finalizada',
            dispensada: 'Dispensada',
            active: 'Activo',
            completed: 'Completada',
            cancelled: 'Cancelada',
            anulada: 'Anulada',
        };
        return labels[status?.toLowerCase()] || status || '—';
    }

    getCertificateStatusVariant(cert: Certificate): 'success' | 'info' | 'warning' | 'error' {
        if (cert.anulateDate) { return 'error'; }
        const now = new Date();
        if (cert.endDate && cert.endDate < now) { return 'info'; }
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
