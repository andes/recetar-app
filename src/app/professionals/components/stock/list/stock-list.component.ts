import { Component, OnInit, OnDestroy, ViewChild, Input, OnChanges, SimpleChanges, AfterContentInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { StockService, formatTipoInsumo } from '@services/stock.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { rowsAnimation, detailExpand, arrowDirection } from '@animations/animations.template';
import { StockPrinterComponent } from '../printer/stock-printer.component';

import { AuthService } from '@auth/services/auth.service';
import { AmbitoService } from '@auth/services/ambito.service';

@Component({
    selector: 'app-stock-list',
    templateUrl: './stock-list.component.html',
    styleUrls: ['./stock-list.component.sass'],
    animations: [
        rowsAnimation,
        detailExpand,
        arrowDirection
    ]
})
export class StockListComponent implements OnInit, OnDestroy, OnChanges {
    @Input() searchTerm: string = '';


    private destroy$ = new Subject<void>();

    dataStock = new MatTableDataSource<any>([]);
    stockColumns: string[] = ['source', 'patient', 'dni', 'date', 'status', 'action', 'arrow'];
    loadingStock: boolean = false;
    totalStock = 0;

    isAndesPrescription(item: any): boolean {
        if (!item) return false;
        return (item as any).isFromAndes === true || 'idAndes' in item || 'idPrestacion' in item || 'idRegistro' in item || 'insumo' in item || (!!(item as any).paciente && !(item as any).patient);
    }

    isLocalPrescription(item: any): boolean {
        if (!item) return false;
        return !this.isAndesPrescription(item);
    }
    expandedElement: any | null;
    stockPageSize = 10;
    stockPageIndex = 0;
    pageSizeOptions = [10, 20, 30];

    formatType(type: string | undefined): string {
        return formatTipoInsumo(type);
    }

    @ViewChild('stockPaginator') stockPaginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    constructor(
        private stockService: StockService,
        private stockPrinter: StockPrinterComponent,
        private authService: AuthService,
        private ambitoService: AmbitoService
    ) { }

    ngOnInit() {
        this.initDataSource();
        // Initial load
        this.loadStock();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.searchTerm && !changes.searchTerm.firstChange) {
            this.stockPageIndex = 0;
            this.loadStock();
        }
    }

    ngAfterContentInit() {

    }

    initDataSource() {
        this.dataStock = new MatTableDataSource<any>([]);
        this.dataStock.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'patient': return this.getPatientName(item);
                case 'dni': return this.getPatientDni(item);
                case 'date': return this.getDate(item).getTime();
                case 'status': return this.getStatus(item);
                default: return item[property];
            }
        };
        this.dataStock.sort = this.sort;
    }

    private loadStock(offset: number = 0, limit: number = 10) {
        this.loadingStock = true;
        const userId = this.authService.getLoggedUserId();
        const ambito = this.ambitoService.getAmbito() || 'privado';

        let obs = this.stockService.getAll({ userId, ambito });

        obs.pipe(
            takeUntil(this.destroy$)
        ).subscribe((response: any) => {
            const list = Array.isArray(response) ? response : (response?.prescriptions || []);
            list.sort((a: any, b: any) => this.getDate(b).getTime() - this.getDate(a).getTime());
            this.totalStock = list.length;
            this.dataStock.data = list;
            this.loadingStock = false;
            setTimeout(() => {
                this.setupStockPaginator();
            }, 100);
        });
    }

    // Helper methods for template
    getPatientName(element: any): string {
        if (!element) return '';
        if (element.patient) {
            return `${element.patient?.lastName || ''}, ${element.patient?.firstName || ''}`.trim();
        }
        if (element.paciente) {
            return `${element.paciente?.apellido || ''}, ${element.paciente?.nombre || ''}`.trim();
        }
        return 'Sin datos';
    }

    getPatientDni(element: any): string {
        if (!element) return '';
        return element.patient?.dni || element.paciente?.documento || '';
    }

    getDate(element: any): Date {
        if (!element) return new Date();
        const rawDate = element.date || element.fechaPrestacion || element.fechaRegistro || element.origenExterno?.fecha || element.createdAt;
        return rawDate ? new Date(rawDate) : new Date();
    }

    getStatus(element: any): string {
        if (!element) return '';
        const s = element.status || element.estadoActual?.tipo || '';
        return s ? s.toUpperCase() : '';
    }

    isExpanded(element: any): boolean {
        return this.expandedElement === element;
    }

    toggleExpand(element: any) {
        this.expandedElement = this.expandedElement === element ? null : element;
    }

    async printStock(element: any) {
        await this.stockPrinter.print(element);
    }

    private setupStockPaginator() {
        if (this.stockPaginator) {
            this.dataStock.paginator = this.stockPaginator;
            this.configurePaginatorLabels(this.stockPaginator);
        }
    }

    private configurePaginatorLabels(paginator: MatPaginator) {
        if (paginator) {
            paginator._intl.itemsPerPageLabel = 'Elementos por página';
            paginator._intl.firstPageLabel = 'Primera página';
            paginator._intl.lastPageLabel = 'Última página';
            paginator._intl.nextPageLabel = 'Siguiente';
            paginator._intl.previousPageLabel = 'Anterior';
            paginator._intl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
                if (length === 0 || pageSize === 0) {
                    return `0 de ${length}`;
                }

                length = Math.max(length, 0);
                const startIndex = page * pageSize;
                const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
                return `${startIndex + 1} – ${endIndex} de ${length}`;
            };
        }
    }

    onStockPageChange(event: any) {
        this.stockPageIndex = event.pageIndex;
        this.stockPageSize = event.pageSize;
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
