import { AfterContentInit, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { StockService, formatTipoInsumo } from '@services/stock.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { rowsAnimation, detailExpand, arrowDirection } from '@animations/animations.template';
import { StockPrintData, StockPrinterComponent } from '../printer/stock-printer.component';

interface StockListSupply {
    supply?: {
        name?: string;
        type?: string;
        specification?: string;
    };
    quantity?: number;
    quantityPresentation?: string;
}

interface StockListProfessional {
    businessName: string;
    enrollment?: string;
    profesionGrado?: Array<{ profesion: string; numeroMatricula: string }>;
}

interface StockListItem {
    _id?: string;
    patient?: {
        lastName?: string;
        firstName?: string;
        dni?: string;
        fechaNac?: Date | string;
        obraSocial?: {
            nombre?: string;
            numeroAfiliado?: string;
        };
        sex?: string;
    };
    date?: string | Date;
    status?: string;
    supplies?: StockListSupply[];
    professional?: StockListProfessional;
    prescriptionId?: string;
}

@Component({
    selector: 'app-stock-list',
    templateUrl: './stock-list.component.html',
    styleUrls: ['./stock-list.component.sass'],
    animations: [
        rowsAnimation,
        detailExpand,
        arrowDirection
    ],
    standalone: false
})
export class StockListComponent implements OnInit, OnDestroy, OnChanges, AfterContentInit {
    @Input() searchTerm = '';


    private destroy$ = new Subject<void>();
    private paginatorSetupFrameId: number | null = null;

    dataStock = new MatTableDataSource<StockListItem>([]);
    stockColumns: string[] = ['patient', 'dni', 'date', 'status', 'action', 'arrow'];
    loadingStock = false;
    totalStock = 0;
    expandedElement: StockListItem | null;
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
        private stockPrinter: StockPrinterComponent
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
        this.dataStock = new MatTableDataSource<StockListItem>([]);
        this.dataStock.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'patient': return item.patient?.lastName + ' ' + item.patient?.firstName;
                case 'dni': return item.patient?.dni;
                case 'date': return new Date(item.date).getTime();
                case 'status': return item.status;
                default: {
                    const value = (item as unknown as Record<string, unknown>)[property];
                    return value == null ? '' : String(value);
                }
            }
        };
        this.dataStock.sort = this.sort;
    }

    private loadStock(offset: number = 0, limit: number = 10) {
        this.loadingStock = true;

        const obs = this.stockService.getAll();

        // if (this.searchTerm) {
        //      obs = this.stockService.search(this.searchTerm);
        // }

        obs.pipe(
            takeUntil(this.destroy$)
        ).subscribe((response: StockListItem[]) => {
            this.totalStock = response.length;
            this.dataStock.data = response;
            this.loadingStock = false;
            this.scheduleStockPaginatorSetup(() => {
                this.setupStockPaginator();
            });
        });
    }

    private scheduleStockPaginatorSetup(action: () => void): void {
        if (this.paginatorSetupFrameId !== null) {
            cancelAnimationFrame(this.paginatorSetupFrameId);
        }

        this.paginatorSetupFrameId = requestAnimationFrame(() => {
            this.paginatorSetupFrameId = null;
            action();
        });
    }

    // Helper methods for template
    getPatientName(element: StockListItem): string {
        return `${element.patient?.lastName || ''}, ${element.patient?.firstName || ''}`;
    }

    getPatientDni(element: StockListItem): string {
        return element.patient?.dni || '';
    }

    getDate(element: StockListItem): Date {
        return new Date(element.date);
    }

    getStatus(element: StockListItem): string {
        return element.status;
    }

    isExpanded(element: StockListItem): boolean {
        return this.expandedElement === element;
    }

    toggleExpand(element: StockListItem) {
        this.expandedElement = this.expandedElement === element ? null : element;
    }

    async printStock(element: StockListItem) {
        await this.stockPrinter.print(element as unknown as StockPrintData);
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

    onStockPageChange(event: PageEvent) {
        this.stockPageIndex = event.pageIndex;
        this.stockPageSize = event.pageSize;
    }

    ngOnDestroy() {
        if (this.paginatorSetupFrameId !== null) {
            cancelAnimationFrame(this.paginatorSetupFrameId);
            this.paginatorSetupFrameId = null;
        }

        this.destroy$.next();
        this.destroy$.complete();
    }
}
