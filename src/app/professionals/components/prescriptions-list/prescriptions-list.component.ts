import { Component, OnInit, ViewChild, Output, EventEmitter, OnDestroy, AfterContentInit, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { PrescriptionsService } from '@services/prescriptions.service';
import { Prescriptions } from '@interfaces/prescriptions';
import * as moment from 'moment';
import { AuthService } from '@auth/services/auth.service';
import { PrescriptionPrinterComponent } from '@professionals/components/prescription-printer/prescription-printer.component';
import { CertificatePracticePrinterComponent } from '@professionals/components/certificate-practice-printer/certificate-practice-printer.component';
import { ProfessionalDialogComponent } from '@professionals/components/professional-dialog/professional-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { rowsAnimation, detailExpand, arrowDirection } from '@animations/animations.template';
import { CertificatesService } from '@services/certificates.service';
import { PracticesService } from '@services/practices.service';
import { Certificate } from '@interfaces/certificate';
import { Practice } from '@interfaces/practices';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InteractionService } from '@professionals/interaction.service';


@Component({
    selector: 'app-prescriptions-list',
    templateUrl: './prescriptions-list.component.html',
    styleUrls: ['./prescriptions-list.component.sass'],
    animations: [
        rowsAnimation,
        detailExpand,
        arrowDirection
    ],
    providers: [PrescriptionPrinterComponent, CertificatePracticePrinterComponent]
})
export class PrescriptionsListComponent implements OnInit, AfterContentInit, OnDestroy {
    private destroy$ = new Subject<void>();
    @Output() anulateCertificateEvent = new EventEmitter<Certificate>();
    @Input() tipo: any;

    displayedColumns: string[] = ['patient', 'dni', 'prescription_date', 'status', 'action', 'arrow'];
    certificatesColumns: string[] = ['patient', 'dni', 'certificate_date', 'end_date', 'status', 'action', 'arrow'];
    practicesColumns: string[] = ['patient', 'dni', 'practice_date', 'action', 'arrow'];
    dataSource = new MatTableDataSource<Prescriptions>([]);
    expandedElement: Prescriptions | null;
    loadingPrescriptions: boolean;
    loadingCertificates: boolean;
    loadingPractices: boolean;
    selectedType: string = null;
    dataCertificates = new MatTableDataSource<Certificate>([]);
    dataPractices = new MatTableDataSource<Practice>([]);

    totalPrescriptions = 0;
    totalCertificates = 0;
    totalPractices = 0;

    prescriptionsPageSize = 10;
    certificatesPageSize = 10;
    practicesPageSize = 10;
    prescriptionsPageIndex = 0;
    certificatesPageIndex = 0;
    practicesPageIndex = 0;
    pageSizeOptions = [10, 20, 30];

    currentSearchTerm = '';

    private paginatorsInitialized = false;

    @ViewChild('prescriptionsPaginator') prescriptionsPaginator: MatPaginator;
    @ViewChild('certificatesPaginator') certificatesPaginator: MatPaginator;
    @ViewChild('practicesPaginator') practicesPaginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    constructor(
        private prescriptionService: PrescriptionsService,
        private certificateService: CertificatesService,
        private practicesService: PracticesService,
        private authService: AuthService,
        private prescriptionPrinter: PrescriptionPrinterComponent,
        private certificatePracticePrinter: CertificatePracticePrinterComponent,
        public dialog: MatDialog,
        private interactionService: InteractionService) { }


    ngOnInit() {
        this.initDataSource();

        this.interactionService.deletePrescription$
            .pipe(takeUntil(this.destroy$))
            .subscribe(prescription => {
                if (this.selectedType === 'receta') {
                    this.loadPrescriptions();
                }
            });
    }

    loadDataForSelectedType() {
        if (!this.selectedType) {
            return;
        }

        switch (this.selectedType) {
            case 'receta':
                this.loadPrescriptions();
                break;
            case 'certificados':
                this.loadCertificates();
                break;
            case 'practicas':
                this.loadPractices();
                break;
        }
    }

    private loadPrescriptions(offset: number = 0, limit: number = 10) {
        this.loadingPrescriptions = true;
        const userId = this.authService.getLoggedUserId();

        const serviceCall = this.currentSearchTerm ?
            this.prescriptionService.searchByTerm(userId, { searchTerm: this.currentSearchTerm, offset, limit }) :
            this.prescriptionService.getByUserId(userId, { offset, limit });

        serviceCall.pipe(
            takeUntil(this.destroy$)
        ).subscribe((response) => {
            this.totalPrescriptions = response.total || 0;

            this.dataSource.data = response.prescriptions;
            this.loadingPrescriptions = false;

            setTimeout(() => {
                this.setupPrescriptionsPaginator();
            }, 100);
        });
    }

    loadCertificates(offset: number = 0, limit: number = 10) {
        this.loadingCertificates = true;
        const userId = this.authService.getLoggedUserId();

        const serviceCall = this.currentSearchTerm ?
            this.certificateService.searchByTerm(userId, { searchTerm: this.currentSearchTerm, offset, limit }) :
            this.certificateService.getByUserId(userId, { offset, limit });

        serviceCall.pipe(
            takeUntil(this.destroy$)
        ).subscribe((response) => {
            this.totalCertificates = response.total || 0;

            this.dataCertificates.data = response.certificates;
            this.loadingCertificates = false;

            setTimeout(() => {
                this.setupCertificatesPaginator();
            }, 100);
        });
    }

    private loadPractices(offset: number = 0, limit: number = 10) {
        this.loadingPractices = true;
        const userId = this.authService.getLoggedUserId();

        const serviceCall = this.currentSearchTerm ?
            this.practicesService.searchByTerm(userId, { searchTerm: this.currentSearchTerm, offset, limit }) :
            this.practicesService.getByUserId(userId, { offset, limit });

        serviceCall.pipe(
            takeUntil(this.destroy$)
        ).subscribe((response) => {
            this.totalPractices = response.total || 0;

            this.dataPractices.data = response.practices;
            this.loadingPractices = false;

            setTimeout(() => {
                this.setupPracticesPaginator();
            }, 100);
        });
    }

    ngAfterContentInit() {
        this.initializePaginators();
    }

    private initializePaginators() {
        this.configurePaginatorLabels(this.prescriptionsPaginator);
        this.configurePaginatorLabels(this.certificatesPaginator);
        this.configurePaginatorLabels(this.practicesPaginator);
        this.setupPaginationEvents();
        this.assignPaginatorsToDataSources();
        this.paginatorsInitialized = true;
    }

    private setupPaginationEvents() {
    }

    private assignPaginatorsToDataSources() {
        if (this.dataSource.data.length > 0 && this.prescriptionsPaginator) {
            this.dataSource.paginator = this.prescriptionsPaginator;
        }
        if (this.dataCertificates.data.length > 0 && this.certificatesPaginator) {
            this.dataCertificates.paginator = this.certificatesPaginator;
        }
        if (this.dataPractices.data.length > 0 && this.practicesPaginator) {
            this.dataPractices.paginator = this.practicesPaginator;
        }
    }

    private setupPrescriptionsPaginator() {
        if (this.prescriptionsPaginator) {
            this.configurePaginatorLabels(this.prescriptionsPaginator);
        }
    }

    private setupCertificatesPaginator() {
        if (this.certificatesPaginator) {
            this.configurePaginatorLabels(this.certificatesPaginator);
        }
    }

    private setupPracticesPaginator() {
        if (this.practicesPaginator) {
            this.configurePaginatorLabels(this.practicesPaginator);
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

    initDataSource() {
        this.dataSource = new MatTableDataSource<Prescriptions>([]);
        this.dataSource.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'patient': return item.patient.lastName + item.patient.firstName;
                case 'prescription_date': return new Date(item.date).getTime();
                default: return item[property];
            }
        };
        this.dataSource.sort = this.sort;

        this.dataCertificates = new MatTableDataSource<Certificate>([]);
        this.dataCertificates.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'patient': return item.patient.lastName + item.patient.firstName;
                case 'certificate_date': return new Date(item.createdAt).getTime();
                default: return item[property];
            }
        };
        this.dataCertificates.sort = this.sort;

        this.dataPractices = new MatTableDataSource<Practice>([]);
        this.dataPractices.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'patient': return item.patient.lastName + item.patient.firstName;
                case 'practice_date': return new Date(item.date).getTime();
                default: return item[property];
            }
        };
        this.dataPractices.sort = this.sort;
    }

    applyFilter(filterValue: string) {
        this.currentSearchTerm = filterValue.trim();

        this.prescriptionsPageIndex = 0;
        this.certificatesPageIndex = 0;
        this.practicesPageIndex = 0;

        if (this.selectedType === 'receta') {
            this.loadPrescriptions(0, this.prescriptionsPageSize);
        } else if (this.selectedType === 'certificados') {
            this.loadCertificates(0, this.certificatesPageSize);
        } else if (this.selectedType === 'practicas') {
            this.loadPractices(0, this.practicesPageSize);
        }
    }

    canPrint(prescription: Prescriptions): boolean {
        return (prescription.professional.userId === this.authService.getLoggedUserId()) && prescription.status !== 'Vencida';
    }
    canDelete(prescription: Prescriptions): boolean {
        return (prescription.professional.userId === this.authService.getLoggedUserId() && prescription.status === 'Pendiente');
    }

    printPrescription(prescription: Prescriptions) {
        this.prescriptionPrinter.print(prescription);
    }
    anulateCertificate(certificate: Certificate) {
        this.certificateService.setCertificate(certificate);
        this.anulateCertificateEvent.emit(certificate);
    }

    isStatus(prescritpion: Prescriptions, status: string): boolean {
        return prescritpion.status === status;
    }

    deleteDialogPrescription(prescription: Prescriptions) {
        this.openDialog('delete', prescription);
    }

    anulateDialogCertificate(certificate: Certificate) {
        this.openDialog('anulate_certificate', certificate);
    }


    deleteDialogPractice(practice: Practice) {
        this.openDialog('delete_practice', practice);
    }

    printCertificate(certificate: Certificate) {
        this.certificatePracticePrinter.printCertificate(certificate);
    }

    printPractice(practice: Practice) {
        this.certificatePracticePrinter.printPractice(practice);
    }

    private openDialog(aDialogType: string, aItem?: any, aText?: string): void {
        const dialogRef = this.dialog.open(ProfessionalDialogComponent, {
            width: '400px',
            data: { dialogType: aDialogType, item: aItem, text: aText }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === 'deleted') {
                this.openSuccessDialog('deleted');
            } else if (result === 'error') {
                this.openSuccessDialog('error-dispensed');
            }
        });
    }

    private openSuccessDialog(dialogType: string): void {
        this.dialog.open(ProfessionalDialogComponent, {
            width: '400px',
            data: { dialogType: dialogType }
        });
    }

    onPrescriptionsPageChange(event: any) {
        this.prescriptionsPageIndex = event.pageIndex;
        this.prescriptionsPageSize = event.pageSize;
        this.loadPrescriptions(event.pageIndex * event.pageSize, event.pageSize);
    }

    onCertificatesPageChange(event: any) {
        this.certificatesPageIndex = event.pageIndex;
        this.certificatesPageSize = event.pageSize;
        this.loadCertificates(event.pageIndex * event.pageSize, event.pageSize);
    }

    onPracticesPageChange(event: any) {
        this.practicesPageIndex = event.pageIndex;
        this.practicesPageSize = event.pageSize;
        this.loadPractices(event.pageIndex * event.pageSize, event.pageSize);
    }

    onSelectedTypeChange() {
        this.prescriptionsPageIndex = 0;
        this.certificatesPageIndex = 0;
        this.practicesPageIndex = 0;

        this.currentSearchTerm = '';

        this.loadDataForSelectedType();

        setTimeout(() => {
            this.initializePaginators();
        }, 100);
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    getCertificateStatus(certificate: Certificate): string {
        if (certificate.anulateDate ) {
            return 'anulado';
        }
        const currentDate = new Date();
        const endDate = new Date(certificate.endDate);

        if (currentDate > endDate) {
            return 'expirado';
        }
        return 'vigente';
    }

    getCertificateStatusColor(certificate: Certificate): string {
        const status = this.getCertificateStatus(certificate);

        switch (status) {
            case 'vigente':
                return 'green';
            case 'expirado':
                return 'orange';
            case 'anulado':
                return 'red';
            default:
                return '#000000de';
        }
    }
}
