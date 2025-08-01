import { Component, OnInit, ViewChild, Output, EventEmitter, OnDestroy, AfterContentInit } from '@angular/core';
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
    @Output() editPrescriptionEvent = new EventEmitter();

    displayedColumns: string[] = ['patient', 'dni', 'prescription_date', 'status', 'action', 'arrow'];
    certificatesColumns: string[] = ['patient', 'dni', 'certificate_date', 'end_date', 'action', 'arrow'];
    practicesColumns: string[] = ['patient', 'dni', 'practice_date', 'action', 'arrow'];
    dataSource = new MatTableDataSource<Prescriptions>([]);
    expandedElement: Prescriptions | null;
    loadingPrescriptions: boolean;
    loadingCertificates: boolean;
    loadingPractices: boolean;
    selectedType: string = null; // No default selection
    dataCertificates = new MatTableDataSource<Certificate>([]);
    dataPractices = new MatTableDataSource<Practice>([]);

    // Totales para paginación
    totalPrescriptions = 0;
    totalCertificates = 0;
    totalPractices = 0;

    // Configuración de paginadores
    prescriptionsPageSize = 10;
    certificatesPageSize = 10;
    practicesPageSize = 10;
    prescriptionsPageIndex = 0;
    certificatesPageIndex = 0;
    practicesPageIndex = 0;
    pageSizeOptions = [10, 20, 30];

    // Variable para almacenar el término de búsqueda
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
        public dialog: MatDialog) { }


    ngOnInit() {
        this.initDataSource();
        // No cargar datos inicialmente
    }

    // Cargar datos según el tipo seleccionado
    loadDataForSelectedType() {
        if (!this.selectedType) {
            return; // No cargar si no hay selección
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

    // Cargar prescripciones
    private loadPrescriptions(offset: number = 0, limit: number = 10) {
        this.loadingPrescriptions = true;
        const userId = this.authService.getLoggedUserId();

        const serviceCall = this.currentSearchTerm ?
            this.prescriptionService.searchByTerm(userId, { searchTerm: this.currentSearchTerm, offset, limit }) :
            this.prescriptionService.getByUserId(userId, { offset, limit });

        serviceCall.pipe(
            takeUntil(this.destroy$)
        ).subscribe((response) => {
            // Capturar el total de la respuesta del servidor
            this.totalPrescriptions = response.total || 0;

            // Usar directamente los datos de la respuesta
            this.dataSource.data = response.prescriptions;
            this.loadingPrescriptions = false;

            // Configurar paginator después de que los datos estén cargados
            setTimeout(() => {
                this.setupPrescriptionsPaginator();
            }, 100);
        });
    }

    // Cargar certificados
    private loadCertificates(offset: number = 0, limit: number = 10) {
        this.loadingCertificates = true;
        const userId = this.authService.getLoggedUserId();

        const serviceCall = this.currentSearchTerm ?
            this.certificateService.searchByTerm(userId, { searchTerm: this.currentSearchTerm, offset, limit }) :
            this.certificateService.getByUserId(userId, { offset, limit });

        serviceCall.pipe(
            takeUntil(this.destroy$)
        ).subscribe((response) => {
            // Capturar el total de la respuesta del servidor
            this.totalCertificates = response.total || 0;

            // Usar directamente los datos de la respuesta
            this.dataCertificates.data = response.certificates;
            this.loadingCertificates = false;

            // Configurar paginator después de que los datos estén cargados
            setTimeout(() => {
                this.setupCertificatesPaginator();
            }, 100);
        });
    }

    // Cargar prácticas
    private loadPractices(offset: number = 0, limit: number = 10) {
        this.loadingPractices = true;
        const userId = this.authService.getLoggedUserId();

        const serviceCall = this.currentSearchTerm ?
            this.practicesService.searchByTerm(userId, { searchTerm: this.currentSearchTerm, offset, limit }) :
            this.practicesService.getByUserId(userId, { offset, limit });

        serviceCall.pipe(
            takeUntil(this.destroy$)
        ).subscribe((response) => {
            // Capturar el total de la respuesta del servidor
            this.totalPractices = response.total || 0;

            // Usar directamente los datos de la respuesta
            this.dataPractices.data = response.practices;
            this.loadingPractices = false;

            // Configurar paginator después de que los datos estén cargados
            setTimeout(() => {
                this.setupPracticesPaginator();
            }, 100);
        });
    }

    ngAfterContentInit() {
        // Configurar paginators después de que la vista esté inicializada
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
        // Los eventos de paginación ahora se manejan directamente desde el HTML
        // Este método se mantiene para compatibilidad pero ya no es necesario
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
        // Inicializar DataSources vacíos
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
        // Actualizar el término de búsqueda
        this.currentSearchTerm = filterValue.trim();

        // Resetear índices de página
        this.prescriptionsPageIndex = 0;
        this.certificatesPageIndex = 0;
        this.practicesPageIndex = 0;

        // Recargar datos según el tipo seleccionado
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

    canEdit(prescription: Prescriptions): boolean {
        return prescription.status === 'Pendiente';
    }

    canDelete(prescription: Prescriptions): boolean {
        return (prescription.professional.userId === this.authService.getLoggedUserId() && prescription.status === 'Pendiente');
    }

    printPrescription(prescription: Prescriptions) {
        this.prescriptionPrinter.print(prescription);
    }

    editPrescription(prescription: Prescriptions) {
        this.editPrescriptionEvent.emit(prescription);
    }

    isStatus(prescritpion: Prescriptions, status: string): boolean {
        return prescritpion.status === status;
    }

    deleteDialogPrescription(prescription: Prescriptions) {
        this.openDialog('delete', prescription);
    }

    deleteDialogCertificate(certificate: Certificate) {
        this.openDialog('delete_certificate', certificate);
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

    // Show a dialog
    private openDialog(aDialogType: string, aItem?: any, aText?: string): void {
        const dialogRef = this.dialog.open(ProfessionalDialogComponent, {
            width: '400px',
            data: { dialogType: aDialogType, item: aItem, text: aText }
        });
    }

    // Métodos para manejar eventos de paginación
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

    // Método para manejar el cambio de tipo de selector
    onSelectedTypeChange() {
        // Resetear índices de página cuando cambia el tipo
        this.prescriptionsPageIndex = 0;
        this.certificatesPageIndex = 0;
        this.practicesPageIndex = 0;

        // Limpiar el término de búsqueda
        this.currentSearchTerm = '';

        // Cargar datos para el tipo seleccionado
        this.loadDataForSelectedType();

        // Reinicializar paginators cuando cambia el tipo
        setTimeout(() => {
            this.initializePaginators();
        }, 100);
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
