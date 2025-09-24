import { Component, OnInit, ViewChild, Output, EventEmitter, OnDestroy, AfterContentInit, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Patient } from '@interfaces/patients';
import { MatSort } from '@angular/material/sort';
import { PrescriptionsService } from '@services/prescriptions.service';
import { AndesPrescriptionsService } from '@services/andesPrescription.service';
import { Prescriptions } from '@interfaces/prescriptions';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { AndesPrescriptionPrinterComponent } from '@pharmacists/components/andes-prescription-printer/andes-prescription-printer.component';
import * as moment from 'moment';
import { AuthService } from '@auth/services/auth.service';
import { UnifiedPrinterComponent } from '@shared/components/unified-printer/unified-printer.component';
import { ProfessionalDialogComponent } from '@professionals/components/professional-dialog/professional-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { rowsAnimation, detailExpand, arrowDirection } from '@animations/animations.template';
import { CertificatesService } from '@services/certificates.service';
import { PracticesService } from '@services/practices.service';
import { Certificate } from '@interfaces/certificate';
import { Practice } from '@interfaces/practices';
import { PatientNamePipe } from '@shared/pipes/patient-name.pipe';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { InteractionService } from '@professionals/interaction.service';
import { AmbitoService } from '@auth/services/ambito.service';
import { PatientsService } from '@services/patients.service';
import { forkJoin, Observable, of } from 'rxjs';

// Tipo union para manejar prescripciones mixtas
type MixedPrescription = Prescriptions | AndesPrescriptions;


@Component({
    selector: 'app-prescriptions-list',
    templateUrl: './prescriptions-list.component.html',
    styleUrls: ['./prescriptions-list.component.sass'],
    animations: [
        rowsAnimation,
        detailExpand,
        arrowDirection
    ],

})
export class PrescriptionsListComponent implements OnInit, AfterContentInit, OnDestroy {
    private destroy$ = new Subject<void>();
    @Output() anulateCertificateEvent = new EventEmitter<Certificate>();
    @Input() tipo: any;

    displayedColumns: string[] = ['source', 'patient', 'dni', 'prescription_date', 'status', 'action', 'arrow'];
    certificatesColumns: string[] = ['patient', 'dni', 'certificate_date', 'end_date', 'status', 'action', 'arrow'];
    practicesColumns: string[] = ['patient', 'dni', 'practice_date', 'action', 'arrow'];
    dataSource = new MatTableDataSource<MixedPrescription>([]);
    expandedElement: MixedPrescription | null;
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
    ambito: 'publico' | 'privado' | null = null;
    patientsData: { [key: string]: Patient } = {};

    private paginatorsInitialized = false;

    @ViewChild('prescriptionsPaginator') prescriptionsPaginator: MatPaginator;
    @ViewChild('certificatesPaginator') certificatesPaginator: MatPaginator;
    @ViewChild('practicesPaginator') practicesPaginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    constructor(
        private prescriptionService: PrescriptionsService,
        private andesPrescriptionsService: AndesPrescriptionsService,
        private certificateService: CertificatesService,
        private practicesService: PracticesService,
        private authService: AuthService,
        private unifiedPrinter: UnifiedPrinterComponent,
        public dialog: MatDialog,
        private interactionService: InteractionService,
        private ambitoService: AmbitoService,
        private patientNamePipe: PatientNamePipe,
        private patientsService: PatientsService
    ) { }


    ngOnInit() {
        this.initDataSource();
        // No cargar datos inicialmente

        this.ambitoService.getAmbitoSeleccionado
            .pipe(takeUntil(this.destroy$))
            .subscribe(ambito => {
                this.ambito = ambito;
            });

        // Suscribirse a eventos de eliminación de prescripciones
        this.interactionService.deletePrescription$
            .pipe(takeUntil(this.destroy$))
            .subscribe(prescription => {
                // Recargar los datos si estamos viendo prescripciones
                if (this.selectedType === 'receta') {
                    this.loadPrescriptions();
                }
            });
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

            const list = response.prescriptions;
            this.dataSource.data = list;
            this.loadingPrescriptions = false;

            const patientDnis: any = {};

            list.forEach((p: any) => {
                const dni = p.patient ? p.patient.dni : (p.paciente ? p.paciente.documento : null);
                if (dni) {
                    patientDnis[dni] = dni;
                }
            });

            if (Object.keys(patientDnis).length > 0) {
                const requests = [];
                for (const key in patientDnis) {
                    requests.push(this.patientsService.getPatientByDni(key).pipe(
                        catchError(() => of([]))
                    ));
                }

                forkJoin(requests).subscribe((results: any[]) => {
                    results.forEach((patients: any[]) => {
                        if (patients && patients.length > 0) {
                            const patient = patients[0];
                            if (patient.dni) {
                                this.patientsData[patient.dni] = patient;
                            }
                        }
                    });
                });
            }

            // Configurar paginator después de que los datos estén cargados
            setTimeout(() => {
                this.setupPrescriptionsPaginator();
            }, 100);
        });
    }

    // Expose loadCertificates method to be called from outside
    loadCertificates(offset: number = 0, limit: number = 10) {
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
        this.dataSource = new MatTableDataSource<MixedPrescription>([]);
        this.dataSource.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'patient': return this.getPatientName(item);
                case 'prescription_date': return this.getPrescriptionDate(item).getTime();
                default: return item[property];
            }
        };
        this.dataSource.sort = this.sort;

        this.dataCertificates = new MatTableDataSource<Certificate>([]);
        this.dataCertificates.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'patient': return item.patient.lastName + this.patientNamePipe.transform(item.patient);
                case 'certificate_date': return new Date(item.createdAt).getTime();
                default: return item[property];
            }
        };
        this.dataCertificates.sort = this.sort;

        this.dataPractices = new MatTableDataSource<Practice>([]);
        this.dataPractices.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'patient': return item.patient.lastName + this.patientNamePipe.transform(item.patient);
                case 'practice_date': return new Date(item.date).getTime();
                default: return item[property];
            }
        };
        this.dataPractices.sort = this.sort;
    }

    // Métodos auxiliares para trabajar con prescripciones mixtas
    isAndesPrescription(item: MixedPrescription): item is AndesPrescriptions {
        return 'idAndes' in item || 'paciente' in item;
    }

    isLocalPrescription(item: MixedPrescription): item is Prescriptions {
        return 'patient' in item && '_id' in item;
    }

    getPatientName(item: MixedPrescription): string {
        const dni = this.getPatientDni(item);
        if (dni && this.patientsData[dni]) {
            return `${this.patientsData[dni].lastName} ${this.patientNamePipe.transform(this.patientsData[dni])}`;
        }
        if ((item as any).patient) {
            return `${(item as any).patient.lastName} ${this.patientNamePipe.transform((item as any).patient)}`;
        }
        if (this.isAndesPrescription(item)) {
            return `${item.paciente.apellido} ${item.paciente.nombre}`;
        }
        return '';
    }

    getPatientDni(item: MixedPrescription): string {
        if (this.isAndesPrescription(item)) {
            return item.paciente.documento;
        } else {
            return item.patient.dni;
        }
    }

    getPrescriptionDate(item: MixedPrescription): Date {
        if (this.isAndesPrescription(item)) {
            return new Date(item.fechaPrestacion);
        } else {
            return new Date(item.date);
        }
    }

    getPrescriptionStatus(item: MixedPrescription): string {
        if (this.isAndesPrescription(item)) {
            return this.normalizeStatus(item.estadoActual.tipo);
        } else {
            return this.normalizeStatus(item.status);
        }
    }

    // Método para normalizar los estados y mostrarlos en mayúsculas con equivalencias de Andes
    private normalizeStatus(status: string): string {
        if (!status) {
            return '';
        }

        const statusLower = status.toLowerCase();

        // Mapeo de estados: Todo se normaliza a la nomenclatura de Andes en mayúsculas
        const statusMap: { [key: string]: string } = {
            // Estados de Andes (ya normalizados)
            'vigente': 'VIGENTE',
            'finalizada': 'FINALIZADA',
            'vencida': 'VENCIDA',
            'suspendida': 'SUSPENDIDA',
            'rechazada': 'RECHAZADA',

            // Estados locales mapear a equivalentes de Andes
            'pendiente': 'VIGENTE',
            'dispensada': 'FINALIZADA'
        };

        return statusMap[statusLower] || status.toUpperCase();
    }

    getPrescriptionId(item: MixedPrescription): string {
        if (this.isAndesPrescription(item)) {
            return item.idAndes || item._id;
        } else {
            return item._id;
        }
    }

    isExpanded(element: MixedPrescription): boolean {
        if (!this.expandedElement) {
            return false;
        }
        return this.getPrescriptionId(element) === this.getPrescriptionId(this.expandedElement);
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

    canPrint(prescription: MixedPrescription): boolean {
        if (this.isAndesPrescription(prescription)) {
            // Las prescripciones de ANDES se pueden imprimir si no están vencidas
            return !['VENCIDA', 'SUSPENDIDA', 'FINALIZADA'].includes(this.normalizeStatus(prescription.estadoActual.tipo));
        } else {
            return (prescription.professional.userId === this.authService.getLoggedUserId()) && this.normalizeStatus(prescription.status) !== 'VENCIDA' && this.normalizeStatus(prescription.status) !== 'SUSPENDIDA';
        }
    }
    canDelete(prescription: MixedPrescription): boolean {
        if (this.isAndesPrescription(prescription)) {
            // Las prescripciones de ANDES se pueden suspender si están vigentes y el profesional es el autor
            return this.canSuspendAndesPrescription(prescription);
        } else {
            return (prescription.professional.userId === this.authService.getLoggedUserId() && this.normalizeStatus(prescription.status) === 'VIGENTE');
        }
    }

    canSuspendAndesPrescription(prescription: AndesPrescriptions): boolean {
        // Solo verificar si el estado actual es vigente
        const isVigente = this.normalizeStatus(prescription.estadoActual?.tipo) === 'VIGENTE';

        return isVigente;
    }

    async printPrescription(prescription: MixedPrescription) {
        if (this.isLocalPrescription(prescription)) {
            await this.unifiedPrinter.printPrescription(prescription);
        } else if (this.isAndesPrescription(prescription)) {
            await this.unifiedPrinter.printAndesPrescription(prescription);
        }
    }
    anulateCertificate(certificate: Certificate) {
        this.certificateService.setCertificate(certificate);
        this.anulateCertificateEvent.emit(certificate);
    }

    isStatus(prescription: MixedPrescription, status: string): boolean {
        const currentStatus = this.getPrescriptionStatus(prescription);
        return currentStatus === status.toUpperCase();
    }

    deleteDialogPrescription(prescription: MixedPrescription) {
        if (this.isLocalPrescription(prescription)) {
            this.openDialog('delete', prescription);
        } else if (this.isAndesPrescription(prescription)) {
            this.openDialog('suspend_andes', prescription);
        }
    }

    suspendAndesPrescription(prescription: AndesPrescriptions) {
        const profesionalId = this.authService.getLoggedUserId();
        const recetaId = prescription._id;
        this.andesPrescriptionsService.suspendPrescription(recetaId, profesionalId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.openSuccessDialog('suspend_andes_success');
                    // Recargar los datos si estamos viendo prescripciones
                    if (this.selectedType === 'receta') {
                        this.loadPrescriptions(
                            this.prescriptionsPageIndex * this.prescriptionsPageSize,
                            this.prescriptionsPageSize
                        );
                    }
                },
                error: (error) => {
                    this.openSuccessDialog('suspend_andes_error');
                }
            });
    }

    anulateDialogCertificate(certificate: Certificate) {
        this.openDialog('anulate_certificate', certificate);
    }


    deleteDialogPractice(practice: Practice) {
        this.openDialog('delete_practice', practice);
    }

    async printCertificate(certificate: Certificate) {
        await this.unifiedPrinter.printCertificate(certificate);
    }

    async printPractice(practice: Practice) {
        await this.unifiedPrinter.printPractice(practice);
    }

    // Show a dialog
    private openDialog(aDialogType: string, aItem?: any, aText?: string): void {
        const dialogRef = this.dialog.open(ProfessionalDialogComponent, {
            width: '400px',
            data: { dialogType: aDialogType, item: aItem, text: aText }
        });

        // Manejar el resultado del dialog
        dialogRef.afterClosed().subscribe(result => {
            if (result === 'deleted') {
                // Mostrar mensaje de éxito
                this.openSuccessDialog('deleted');
            } else if (result === 'error') {
                // Mostrar mensaje de error
                this.openSuccessDialog('error-dispensed');
            } else if (result === 'suspend_andes') {
                // Suspender prescripción de ANDES
                this.suspendAndesPrescription(aItem as AndesPrescriptions);
            }
        });
    }

    // Método para mostrar mensajes de éxito o error
    private openSuccessDialog(dialogType: string): void {
        this.dialog.open(ProfessionalDialogComponent, {
            width: '400px',
            data: { dialogType: dialogType }
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

    getCertificateStatus(certificate: Certificate): string {
        if (certificate.anulateDate) {
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
