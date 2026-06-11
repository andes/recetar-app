import { Component, OnInit, AfterContentInit, ViewChild, OnDestroy, Input } from '@angular/core';
import { Prescriptions } from '@interfaces/prescriptions';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { PrescriptionsService } from '@services/prescriptions.service';
import { AndesPrescriptionsService } from '@services/andesPrescription.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import moment from 'moment';
import { DialogComponent } from '@pharmacists/components/dialog/dialog.component';
import { AuthService } from '@auth/services/auth.service';
import { detailExpand, arrowDirection } from '@animations/animations.template';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { UnifiedPrinterComponent } from '@shared/components/unified-printer/unified-printer.component';
import { getHttpErrorMessage } from '@shared/utils/http-error.util';

type MixedPrescription = Prescriptions | AndesPrescriptions;
type SelectedPatient = Prescriptions['patient'] | AndesPrescriptions['paciente'] | null;

@Component({
    selector: 'app-prescription-list',
    templateUrl: './prescription-list.component.html',
    styleUrls: ['./prescription-list.component.sass'],
    animations: [
        detailExpand,
        arrowDirection
    ],
    standalone: false
})
export class PrescriptionListComponent implements OnInit, AfterContentInit, OnDestroy {
    private destroy$ = new Subject<void>();

    displayedColumns: string[] = ['medicamento', 'date', 'status', 'action', 'arrow'];
    dataSource = new MatTableDataSource<MixedPrescription>([]);
    expandedElement: MixedPrescription | null;
    loadingPrescriptions: boolean;
    lapseTime = 2;
    pharmacistId: string;
    isAdmin = false;
    selectedPatient: SelectedPatient = null; // Paciente seleccionado para mostrar en la vista
    fechaDesde: Date | undefined;
    fechaHasta: Date | undefined;

    // Variable para mantener el último DNI del paciente utilizado
    private lastPatientDni = '';
    private lastPatientSex = '';

    statusFilter = 'vigente';
    dateFromFilter: Date | undefined;
    dateToFilter: Date | undefined;
    dateRangeInvalid = false;
    statusOptions = [
        { value: 'vigente', label: 'Vigente' },
        { value: 'vencida', label: 'Vencida' },
        { value: 'finalizada', label: 'Finalizada' },
        { value: 'dispensada', label: 'Dispensada' },
        { value: 'rechazada', label: 'Rechazada' },
        { value: 'suspendida', label: 'Suspendida' },
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'todas', label: 'Todas' }
    ];

    canDispenseMap = new Map<string, boolean>();
    isStatusMap = new Map<string, boolean>();
    canCounterMap = new Map<string, boolean>();

    // Control para habilitar/deshabilitar los filtros desde el padre
    @Input() filtersEnabled = false;

    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    constructor(
        private authService: AuthService,
        private prescriptionService: PrescriptionsService,
        private andesPrescriptionService: AndesPrescriptionsService,
        private unifiedPrinter: UnifiedPrinterComponent,
        public dialog: MatDialog) { };

    ngOnInit(): void {
        this.pharmacistId = this.authService.getLoggedUserId();
        this.isAdmin = this.authService.isAdminRole();

        // Inicializar filtros de fecha con el último mes
        this.initializeDateFilters();

        this.initDataSource();
        this.loadPrescriptions();
    }

    // Permite al componente padre establecer el contexto del paciente explícitamente
    public setPatientContext(dni: string, sex: string): void {
        this.lastPatientDni = dni || '';
        this.lastPatientSex = sex || '';
    }

    // Resetea los filtros al valor por defecto
    public resetFiltersToDefault(): void {
        this.statusFilter = 'vigente';
        this.initializeDateFilters();
        this.dateRangeInvalid = false;
    }

    private initializeDateFilters(): void {
        const today = new Date();
        this.dateToFilter = new Date(today);
        this.dateFromFilter = new Date(today);
        this.dateFromFilter.setMonth(today.getMonth() - 1); // Último mes

        // También inicializar las fechas existentes para compatibilidad
        this.fechaHasta = new Date(this.dateToFilter);
        this.fechaDesde = new Date(this.dateFromFilter);
    }

    private initDataSource(): void {
        this.dataSource.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'patient':
                    return this.isAndesPrescription(item)
                        ? `${item.paciente?.apellido || ''}${item.paciente?.nombre || ''}`
                        : `${item.patient?.lastName || ''}${item.patient?.firstName || ''}`;
                case 'prescription_date': return this.getPrescriptionDate(item).getTime();
                default: {
                    const value = (item as unknown as Record<string, unknown>)[property];
                    return value == null ? '' : String(value);
                }
            }
        };

        this.dataSource.sort = this.sort;
    }

    private loadPrescriptions(offset: number = 0, limit: number = 10): void {
        // Evitar cargar si el rango de fechas es inválido
        if (this.dateRangeInvalid || (this.dateFromFilter && this.dateToFilter && this.dateFromFilter > this.dateToFilter)) {
            this.loadingPrescriptions = false;
            return;
        }

        this.loadingPrescriptions = true;

        // Preparar filtros para la API
        const filters = {
            status: this.statusFilter,
            dateFrom: this.dateFromFilter ? moment(this.dateFromFilter).format('DD-MM-YYYY') : undefined,
            dateTo: this.dateToFilter ? moment(this.dateToFilter).format('DD-MM-YYYY') : undefined
        };

        // Obtener el DNI y sexo del paciente de los datos existentes o usar los últimos conocidos
        let patientDni = '';
        let patientSex = '';
        if (this.dataSource.data.length > 0) {
            // Intentar obtener el DNI y sexo del primer elemento
            const firstElement = this.dataSource.data[0];
            patientDni = this.getPatientDni(firstElement);
            patientSex = this.getPatientSex(firstElement);
            // Actualizar el último DNI y sexo conocidos si se encuentran
            if (patientDni) {
                this.lastPatientDni = patientDni;
            }
            if (patientSex) {
                this.lastPatientSex = patientSex;
            }
        }

        // Si no hay DNI en los datos actuales, usar el último DNI y sexo conocidos
        if (!patientDni && this.lastPatientDni) {
            patientDni = this.lastPatientDni;
            patientSex = this.lastPatientSex;
        }

        // Si no hay DNI disponible, no hacer ninguna búsqueda
        if (!patientDni) {
            this.loadingPrescriptions = false;
            return;
        }

        // Si tenemos DNI, usar el método del servicio de prescriptions (que ahora retorna recetas combinadas de Andes y locales)
        this.prescriptionService.getPrescriptionsWithFiltersDirect(patientDni, { ...filters, sexo: patientSex }).pipe(
            takeUntil(this.destroy$)
        ).subscribe((prescriptions) => {
            const previousDataLength = this.dataSource.data.length;
            const newData = prescriptions;

            this.dataSource.data = newData;
            this.updateMaps();

            // Buscar paciente con nombreAutopercibido o usar el primero disponible
            this.selectedPatient = this.findSelectedPatient(newData);

            if (previousDataLength !== newData.length || previousDataLength === 0) {
                if (this.paginator) {
                    this.dataSource.paginator = this.paginator;
                }
            }

            this.loadingPrescriptions = false;
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Refresca las prescripciones desde los servicios
     */
    refreshPrescriptions(): void {
        this.loadingPrescriptions = true;
        this.updateMaps();
        this.loadingPrescriptions = false;
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
        // El filtro de texto ahora se aplica localmente solo para búsqueda rápida
        // Los filtros principales (estado y fecha) se manejan en la API
        const textFilter = filterValue.trim().toLowerCase();

        this.dataSource.filterPredicate = (data: MixedPrescription, filter: string) => {
            // Si no hay filtro de texto, mostrar el elemento
            if (!textFilter) {
                return true;
            }

            // Aplicar filtro de texto
            const accumulator = (currentTerm: string, key: string): string => {
                // enable filter by lastName / firstName / date / status
                const patientName = this.isAndesPrescription(data)
                    ? `${data.paciente?.apellido || ''} ${data.paciente?.nombre || ''}`
                    : `${data.patient?.lastName || ''} ${data.patient?.firstName || ''}`;

                const medicamento = this.getMedicationName(data);

                const dateStr = moment(this.getPrescriptionDate(data), 'YYYY-MM-DD').format('DD/MM/YYYY');

                return currentTerm + patientName + medicamento + dateStr + this.getPrescriptionStatusForFilter(data);
            };

            const dataStr = Object.keys(data).reduce(accumulator, '').toLowerCase();
            return dataStr.indexOf(textFilter) !== -1;
        };

        this.dataSource.filter = textFilter || Math.random().toString();

        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    // Métodos de filtro simplificados - ahora solo llaman a la API
    onStatusFilterChange(): void {
        // No cargar automáticamente; se aplicará al presionar el botón
    }

    onDateFilterChange(): void {
        // También actualizar las fechas existentes para compatibilidad
        this.fechaDesde = this.dateFromFilter ? new Date(this.dateFromFilter) : undefined;
        this.fechaHasta = this.dateToFilter ? new Date(this.dateToFilter) : undefined;
        // Validar rango de fechas: fecha desde no puede ser mayor a fecha hasta
        this.dateRangeInvalid = !!(this.dateFromFilter && this.dateToFilter && this.dateFromFilter > this.dateToFilter);
    }

    // Aplicar filtros manualmente al presionar el botón
    applyFilters(): void {
        // Refrescar compatibilidad
        this.fechaDesde = this.dateFromFilter ? new Date(this.dateFromFilter) : undefined;
        this.fechaHasta = this.dateToFilter ? new Date(this.dateToFilter) : undefined;
        this.dateRangeInvalid = !!(this.dateFromFilter && this.dateToFilter && this.dateFromFilter > this.dateToFilter);

        if (!this.dateRangeInvalid) {
            this.loadPrescriptions();
        }
    }

    dispense(prescription: Prescriptions | AndesPrescriptions) {
        if ('status' in prescription) {
            this.prescriptionService.dispense(prescription._id, this.pharmacistId).subscribe(
                success => {
                    if (success) {
                        // Actualizar los mapas después de la operación exitosa
                        this.updateMaps();
                        this.openDialog('dispensed', prescription, prescription.professional.businessName);
                    }
                },
                error => {
                    this.openDialog('error-dispensed', prescription, getHttpErrorMessage(error, 'Error al dispensar la prescripción'));
                }
            );
        } else if ('estadoActual' in prescription) {
            this.andesPrescriptionService.dispense(prescription, this.pharmacistId).subscribe(
                success => {
                    if (success) {
                        // Actualizar los mapas después de la operación exitosa
                        this.updateMaps();
                        this.openDialog('dispensed', prescription, prescription.profesional.nombre);
                    }
                },
                error => {
                    this.openDialog('error-dispensed', prescription, getHttpErrorMessage(error, 'Error al dispensar la prescripción'));
                }
            );
        }
    }

    cancelDispense(prescription: Prescriptions | AndesPrescriptions) {
        if ('status' in prescription) {
            this.prescriptionService.cancelDispense(prescription._id, this.pharmacistId).subscribe(
                success => {
                    if (success) {
                        this.updateMaps();
                        this.openDialog('cancel-dispensed', prescription);
                    }
                },
                error => {
                    this.openDialog('error-cancel-dispensed', prescription, getHttpErrorMessage(error, 'Error al cancelar la dispensación'));
                }
            );
        } else if ('estadoActual' in prescription) {
            this.andesPrescriptionService.cancelDispense(prescription._id, this.pharmacistId).subscribe(
                success => {
                    if (success) {
                        this.updateMaps();
                        this.openDialog('cancel-dispensed', prescription);
                    }
                },
                error => {
                    this.openDialog('error-cancel-dispensed', prescription, getHttpErrorMessage(error, 'Error al cancelar la dispensación'));
                }
            );
        }
    }

    // Show a dialog
    openDialog(aDialogType: string, aPrescription?: Prescriptions | AndesPrescriptions, aText?: string): void {
        const dialogRef = this.dialog.open(DialogComponent, {
            width: '400px',
            data: { dialogType: aDialogType, prescription: aPrescription, text: aText }
        });

        dialogRef.afterClosed().pipe(take(1)).subscribe(() => {
            // eslint-disable-next-line no-console
            console.log('The dialog was closed');
        });
    }

    canPrint(prescription: Prescriptions): boolean {
        return (prescription.status === 'Dispensada') && (prescription.dispensedBy?.userId === this.authService.getLoggedUserId());
    }

    canDispense(prescription: Prescriptions | AndesPrescriptions): boolean {
        const canDispenseFromMap = this.canDispenseMap.get(prescription._id);
        if (canDispenseFromMap !== undefined) {
            return canDispenseFromMap;
        }
        return this.calculateCanDispense(prescription);
    }

    async printPrescription(prescription: Prescriptions | AndesPrescriptions) {
        if ('status' in prescription) {
            await this.unifiedPrinter.printPrescription(prescription);
        } else if ('estadoActual' in prescription) {
            await this.unifiedPrinter.printAndesPrescription(prescription);
        }
    }

    isStatus(prescription: Prescriptions | AndesPrescriptions, status: string): boolean {
        if (status === 'Vencida') {
            const isExpiredFromMap = this.isStatusMap.get(prescription._id);
            if (isExpiredFromMap !== undefined) {
                return isExpiredFromMap;
            }
        }
        return this.calculateIsStatus(prescription, status);
    }

    canCounter(prescription: Prescriptions | AndesPrescriptions): boolean {
        const canCounterFromMap = this.canCounterMap.get(prescription._id);
        if (canCounterFromMap !== undefined) {
            return canCounterFromMap;
        }
        return this.calculateCanCounter(prescription);
    }

    private findSelectedPatient(prescriptions: MixedPrescription[]): SelectedPatient {
        if (!prescriptions || prescriptions.length === 0) {
            return null;
        }

        // Buscar paciente con nombreAutopercibido
        const patientWithAutopercibido = prescriptions.find(prescription => {
            // Para prescripciones de Andes
            if (this.isAndesPrescription(prescription) && prescription.paciente && 'nombreAutopercibido' in prescription.paciente) {
                return true;
            }
            // Para prescripciones regulares
            if (!this.isAndesPrescription(prescription) && prescription.patient && prescription.patient.nombreAutopercibido) {
                return true;
            }
            return false;
        });

        if (patientWithAutopercibido) {
            // Retornar el paciente encontrado (puede ser .patient o .paciente)
            return this.isAndesPrescription(patientWithAutopercibido)
                ? patientWithAutopercibido.paciente
                : patientWithAutopercibido.patient;
        }

        // Si no se encuentra, usar el primer paciente disponible
        const firstPrescription = prescriptions[0];
        return this.isAndesPrescription(firstPrescription)
            ? firstPrescription.paciente
            : firstPrescription.patient;
    }

    updateMaps() {
        // Limpiar mapas existentes
        this.isStatusMap.clear();
        this.canDispenseMap.clear();
        this.canCounterMap.clear();

        // Recalcular todos los valores para las prescripciones actuales
        this.dataSource.data.forEach(prescription => {
            if (prescription && prescription._id) {
                this.isStatusMap.set(prescription._id, this.calculateIsStatus(prescription, 'Vencida'));
                this.canDispenseMap.set(prescription._id, this.calculateCanDispense(prescription));
                this.canCounterMap.set(prescription._id, this.calculateCanCounter(prescription));
            }
        });
    }

    calculateCanDispense(prescription: Prescriptions | AndesPrescriptions): boolean {
        if ('status' in prescription) {
            return prescription.status === 'Pendiente' && moment() >= moment(prescription.date);
        } else if ('estadoActual' in prescription) {
            return prescription.estadoActual.tipo === 'vigente';
        }
        return false;
    }

    calculateIsStatus(prescription: Prescriptions | AndesPrescriptions, status: string): boolean {
        if ('estadoActual' in prescription) {
            return prescription.estadoActual.tipo.toLowerCase() === status.toLowerCase();
        } else if ('status' in prescription) {
            return prescription.status.toLowerCase() === status.toLowerCase();
        }
        return false;
    }

    calculateCanCounter(prescription: Prescriptions | AndesPrescriptions): boolean {
        if ('status' in prescription) {
            if (prescription.status === 'Dispensada' &&
                typeof prescription.dispensedAt !== 'undefined' &&
                prescription.dispensedBy?.userId === this.pharmacistId) {

                const dispensedAt = moment(prescription.dispensedAt);
                const now = moment();
                dispensedAt.add(this.lapseTime, 'hours');
                return dispensedAt.isAfter(now);
            }
        } else if ('estadoActual' in prescription) {
            if (prescription.estadoActual.tipo === 'finalizada' && prescription.estadoDispensaActual.tipo === 'dispensada' &&
                typeof prescription.estadoDispensaActual.fecha !== 'undefined' &&
                prescription.dispensa[0].organizacion.id === this.pharmacistId) {

                const dispensedAt = moment(prescription.estadoDispensaActual.fecha);
                const now = moment();
                dispensedAt.add(this.lapseTime, 'hours');
                return dispensedAt.isAfter(now);
            }
        }
        return false;
    }

    getStatus(prescription: Prescriptions | AndesPrescriptions): string {
        if ('estadoActual' in prescription) {
            return this.normalizeStatus(prescription.estadoActual?.tipo);
        } else if ('status' in prescription) {
            return this.normalizeStatus(prescription.status);
        }
        return '';
    }

    getStatusColor(prescription: Prescriptions | AndesPrescriptions): string {
        const status = this.getStatus(prescription);
        if (status === 'VENCIDA') {
            return 'red';
        }
        return '#000000de';
    }

    private normalizeStatus(status: string): string {
        if (!status) {
            return '';
        }
        const statusLower = status.toLowerCase();
        const statusMap: { [key: string]: string } = {
            'vigente': 'VIGENTE',
            'finalizada': 'FINALIZADA',
            'vencida': 'VENCIDA',
            'suspendida': 'SUSPENDIDA',
            'rechazada': 'RECHAZADA',
            'pendiente': 'VIGENTE',
            'dispensada': 'FINALIZADA'
        };
        return statusMap[statusLower] || status.toUpperCase();
    }

    private isAndesPrescription(prescription: MixedPrescription): prescription is AndesPrescriptions {
        return 'estadoActual' in prescription;
    }

    private getPatientDni(prescription: MixedPrescription): string {
        return this.isAndesPrescription(prescription)
            ? prescription.paciente?.documento || ''
            : prescription.patient?.dni || '';
    }

    private getPatientSex(prescription: MixedPrescription): string {
        return this.isAndesPrescription(prescription)
            ? prescription.paciente?.sexo || ''
            : prescription.patient?.sex || '';
    }

    private getMedicationName(prescription: MixedPrescription): string {
        if (this.isAndesPrescription(prescription)) {
            return prescription.medicamento?.concepto?.term || '';
        }

        return prescription.supplies?.length ? (prescription.supplies[0]?.supply?.name || '') : '';
    }

    private getPrescriptionDate(prescription: MixedPrescription): Date {
        if (this.isAndesPrescription(prescription)) {
            return new Date(prescription.fechaRegistro || prescription.fechaPrestacion);
        }

        return new Date(prescription.date);
    }

    private getPrescriptionStatusForFilter(prescription: MixedPrescription): string {
        return this.isAndesPrescription(prescription)
            ? (prescription.estadoActual?.tipo || '')
            : (prescription.status || '');
    }

    get selectedPatientLastName(): string {
        const patient = this.selectedPatient;

        if (!patient) {
            return '';
        }

        return this.isAndesSelectedPatient(patient)
            ? patient.apellido
            : patient.lastName;
    }

    get selectedPatientDocument(): string {
        const patient = this.selectedPatient;

        if (!patient) {
            return '';
        }

        return this.isAndesSelectedPatient(patient)
            ? patient.documento
            : patient.dni;
    }

    private isAndesSelectedPatient(patient: Exclude<SelectedPatient, null>): patient is AndesPrescriptions['paciente'] {
        return 'documento' in patient;
    }
}
