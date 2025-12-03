import { Component, OnInit, OnDestroy, ViewChild, Input, OnChanges, SimpleChanges, AfterContentInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { StockService } from '@services/stock.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { rowsAnimation, detailExpand, arrowDirection } from '@animations/animations.template';
import { StockPrinterComponent } from '../printer/stock-printer.component';

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
    stockColumns: string[] = ['patient', 'dni', 'date', 'status', 'action', 'arrow'];
    loadingStock: boolean = false;
    totalStock = 0;
    expandedElement: any | null;
    stockPageSize = 10;
    stockPageIndex = 0;
    pageSizeOptions = [10, 20, 30];

    public tipoInsumo: any = {
        nutrition: "Nutrición",
        device: "Dispositivo",
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
        this.dataStock = new MatTableDataSource<any>([]);
        this.dataStock.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'patient': return item.patient?.lastName + ' ' + item.patient?.firstName;
                case 'dni': return item.patient?.dni;
                case 'date': return new Date(item.date).getTime();
                case 'status': return item.status;
                default: return item[property];
            }
        };
        this.dataStock.sort = this.sort;
    }

    private loadStock(offset: number = 0, limit: number = 10) {
        this.loadingStock = true;

        let obs = this.stockService.getAll();

        // if (this.searchTerm) {
        //      obs = this.stockService.search(this.searchTerm);
        // }

        obs.pipe(
            takeUntil(this.destroy$)
        ).subscribe((response: any) => {
            this.totalStock = response.length;
            this.dataStock.data = response;
            this.loadingStock = false;
            setTimeout(() => {
                this.setupStockPaginator();
            }, 100);
        });
    }

    // Helper methods for template
    getPatientName(element: any): string {
        return `${element.patient?.lastName || ''}, ${element.patient?.firstName || ''}`;
    }

    getPatientDni(element: any): string {
        return element.patient?.dni || '';
    }

    getDate(element: any): Date {
        return new Date(element.date);
    }

    getStatus(element: any): string {
        return element.status;
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
