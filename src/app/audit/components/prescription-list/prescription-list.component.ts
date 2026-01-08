import { AfterContentInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { arrowDirection, detailExpand } from '@animations/animations.template';
import { AuthService } from '@auth/services/auth.service';
import { Prescriptions } from '@interfaces/prescriptions';
import { UnifiedPrinterComponent } from '@shared/components/unified-printer/unified-printer.component';
import { PrescriptionsService } from '@services/prescriptions.service';
import * as moment from 'moment';
import { DialogReportComponent } from '../dialog-report/dialog-report.component';

@Component({
    selector: 'app-prescription-list',
    templateUrl: './prescription-list.component.html',
    styleUrls: ['./prescription-list.component.sass'],
    animations: [
        detailExpand,
        arrowDirection
    ],

})
export class PrescriptionListComponent implements OnInit, AfterContentInit {

    @Input() prescriptions: Prescriptions[];

    displayedColumns: string[] = ['professional', 'date', 'status', 'supplies', 'action', 'arrow'];
    dataSource = new MatTableDataSource<Prescriptions>([]);
    expandedElement: Prescriptions | null;
    loadingPrescriptions: boolean;
    lapseTime = 2; // lapse of time that a dispensed prescription can been undo action, and put it back as "pendiente"
    auditId: string;
    pharmacistId: string;
    isAdmin = false;
    fechaDesde: Date;
    fechaHasta: Date;

    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    constructor(
        private authService: AuthService,
        private prescriptionService: PrescriptionsService,
        private unifiedPrinter: UnifiedPrinterComponent,
        public dialog: MatDialog) { };

    ngOnInit(): void {
        this.loadingPrescriptions = true;
        this.prescriptionService.prescriptions.subscribe((prescriptions: Prescriptions[]) => {
            this.dataSource = new MatTableDataSource<Prescriptions>(prescriptions);
            // sort after populate dataSource
            this.dataSource.sortingDataAccessor = (item, property) => {
                switch (property) {
                    case 'patient': return item.patient.lastName + item.patient.firstName;
                    case 'prescription_date': return new Date(item.date).getTime();
                    default: return item[property];
                }
            };
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.loadingPrescriptions = false;
        });
        this.auditId = this.authService.getLoggedUserId();
        this.isAdmin = this.authService.isAdminRole();
    }

    ngAfterContentInit() {
        this.paginator._intl.itemsPerPageLabel = 'Prescripciones por página';
        this.paginator._intl.firstPageLabel = 'Primer página';
        this.paginator._intl.lastPageLabel = 'Última página';
        this.paginator._intl.nextPageLabel = 'Siguiente';
        this.paginator._intl.previousPageLabel = 'Anterior';
        this.paginator._intl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
            if (length === 0 || pageSize === 0) {
                return `0 de ${length}`;
            }
            length = Math.max(length, 0);
            const startIndex = page * pageSize;
            const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
            return `${startIndex + 1} – ${endIndex} de ${length}`;
        };
    }

    applyFilter(filterValue: string) {
        this.dataSource.filterPredicate = (data: Prescriptions, filter: string) => {
            const accumulator = (currentTerm, key) => {
                // enable filter by lastName / firstName / date
                return currentTerm + data.status + moment(data.date, 'YYYY-MM-DD').format('DD/MM/YYY').toString();
            };

            const dataStr = Object.keys(data).reduce(accumulator, '').toLowerCase();
            // Transform the filter by converting it to lowercase and removing whitespace.
            const transformedFilter = filter.trim().toLowerCase();
            return dataStr.indexOf(transformedFilter) !== -1;
        };
        this.dataSource.filter = filterValue.trim().toLowerCase();
        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    // Return true if was dispensed and is seeing who dispensed the prescription
    canPrint(prescription: Prescriptions): boolean {
        return (prescription.status === 'Dispensada') && (prescription.dispensedBy?.userId === this.authService.getLoggedUserId());
    }

    async printPrescription(prescription: Prescriptions) {
        await this.unifiedPrinter.printPrescription(prescription);
    }

    isStatus(prescritpion: Prescriptions, status: string): boolean {
        return prescritpion.status === status;
    }


    generateReport() {
        const dialogReport = this.dialog.open(DialogReportComponent, {
            width: '400px',
            data: { fechaDesde: this.fechaDesde, fechaHasta: this.fechaHasta, pharmacistId: this.dataSource.data[0].dispensedBy.userId }
        });

        dialogReport.afterClosed().subscribe(result => {
            if (result) {
                this.prescriptionService.getCsv(result).subscribe();
            }
        });
    }

}
