import { Component, OnInit, AfterContentInit, ViewChild, OnDestroy, Input } from '@angular/core';
import { Prescriptions } from '@interfaces/prescriptions';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { PrescriptionsService } from '@services/prescriptions.service';
import { AndesPrescriptionsService } from '@services/andesPrescription.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import * as moment from 'moment';
import { DialogComponent } from '@pharmacists/components/dialog/dialog.component';
import { AuthService } from '@auth/services/auth.service';
import { detailExpand, arrowDirection } from '@animations/animations.template';
import { DialogReportComponent } from '../dialog-report/dialog-report.component';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UnifiedPrinterComponent } from '@shared/components/unified-printer/unified-printer.component';

@Component({
    selector: 'app-prescription-list',
    templateUrl: './prescription-list.component.html',
    styleUrls: ['./prescription-list.component.sass'],
    animations: [
        detailExpand,
        arrowDirection
    ],

})
export class PrescriptionListComponent implements OnInit, AfterContentInit, OnDestroy {
    private destroy$ = new Subject<void>();

    displayedColumns: string[] = ['medicamento', 'date', 'status', 'action', 'arrow'];
    dataSource = new MatTableDataSource<any>([]);
    expandedElement: Prescriptions | null;
    loadingPrescriptions: boolean;
    lapseTime = 2;
    pharmacistId: string;
    isAdmin = false;
    selectedPatient: any = null; // Paciente seleccionado para mostrar en la vista
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
                case 'patient': return item.patient?.lastName + item.patient?.firstName;
                case 'prescription_date': return new Date(item.date || item.fechaPrestacion).getTime();
                default: return item[property];
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
            patientDni = firstElement.patient?.dni || firstElement.paciente?.documento || '';
            patientSex = firstElement.patient?.sex || firstElement.paciente?.sexo || '';
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

        // Si no hay DNI disponible, usar los observables directamente (carga inicial)
        if (!patientDni) {
            combineLatest([
                this.andesPrescriptionService.prescriptions,
                this.prescriptionService.prescriptions
            ]).pipe(
                takeUntil(this.destroy$)
            ).subscribe(([andesPrescriptions, prescriptions]) => {
                const previousDataLength = this.dataSource.data.length;
                const newData = [...andesPrescriptions, ...prescriptions];

                this.dataSource.data = newData;
                this.updateMaps();

                // Si hay cambios en la cantidad de datos o es la primera carga,
                // actualizar la paginación
                if (previousDataLength !== newData.length || previousDataLength === 0) {
                    setTimeout(() => {
                        if (this.paginator) {
                            this.dataSource.paginator = this.paginator;
                            // Configurar eventos de paginación si es necesario
                            this.paginator.page.pipe(
                                takeUntil(this.destroy$)
                            ).subscribe((pageEvent) => {
                                // La paginación aquí es local ya que se cargan todas las prescripciones filtradas
                            });
                        }
                    });
                }

                this.loadingPrescriptions = false;
            });
            return;
        }

        // Si tenemos DNI, usar los métodos con filtros
        const andesFilters = { ...filters, patient_sex: patientSex };
        combineLatest([
            this.andesPrescriptionService.getPrescriptionsWithFilters(patientDni, andesFilters),
            this.prescriptionService.getPrescriptionsWithFilters(patientDni, filters)
        ]).pipe(
            takeUntil(this.destroy$)
        ).subscribe(([andesResult, prescriptionsResult]) => {
            // Los datos ya están actualizados en los servicios a través de los métodos
            // Ahora obtenemos los datos actualizados de los observables
            combineLatest([
                this.andesPrescriptionService.prescriptions,
                this.prescriptionService.prescriptions
            ]).pipe(
                takeUntil(this.destroy$)
            ).subscribe(([andesPrescriptions, prescriptions]) => {
                const previousDataLength = this.dataSource.data.length;
                const newData = [...andesPrescriptions, ...prescriptions];

                this.dataSource.data = newData;
                this.updateMaps();

                // Buscar paciente con nombreAutopercibido o usar el primero disponible
                this.selectedPatient = this.findSelectedPatient(newData);

                // Si hay cambios en la cantidad de datos o es la primera carga,
                // actualizar la paginación
                if (previousDataLength !== newData.length || previousDataLength === 0) {
                    setTimeout(() => {
                        if (this.paginator) {
                            this.dataSource.paginator = this.paginator;
                            this.paginator.page.pipe(
                                takeUntil(this.destroy$)
                            ).subscribe((pageEvent) => {
                            });
                        }
                    });
                }

                this.loadingPrescriptions = false;
            });
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

        this.dataSource.filterPredicate = (data: any, filter: string) => {
            // Si no hay filtro de texto, mostrar el elemento
            if (!textFilter) {
                return true;
            }

            // Aplicar filtro de texto
            const accumulator = (currentTerm, key) => {
                // enable filter by lastName / firstName / date / status
                const patientName = data.patient ?
                    `${data.patient.lastName} ${data.patient.firstName}` :
                    (data.paciente ? `${data.paciente.apellido} ${data.paciente.nombre}` : '');

                const medicamento = data.medicamento?.concepto?.term ||
                    (data.supplies?.length ? data.supplies[0]?.supply?.name : '');

                const dateStr = moment(data.date || data.fechaRegistro || data.fechaPrestacion, 'YYYY-MM-DD').format('DD/MM/YYYY');

                return currentTerm + patientName + medicamento + dateStr + (data.status || data.estadoActual?.tipo || '');
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
                    this.openDialog('error-dispensed', prescription, error.message || 'Error al dispensar la prescripción');
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
                    this.openDialog('error-dispensed', prescription, error.message || 'Error al dispensar la prescripción');
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
                    this.openDialog('error-cancel-dispensed', prescription, error.message || 'Error al cancelar la dispensación');
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
                    this.openDialog('error-cancel-dispensed', prescription, error.message || 'Error al cancelar la dispensación');
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

        dialogRef.afterClosed().subscribe(result => {
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

    generateReport() {
        const dialogReport = this.dialog.open(DialogReportComponent, {
            width: '400px',
            data: { fechaDesde: this.fechaDesde, fechaHasta: this.fechaHasta, pharmacistId: this.pharmacistId }
        });

        dialogReport.afterClosed().subscribe(result => {
            if (result) {
                this.prescriptionService.getCsv(result).subscribe();
            }
        });
    }

    private findSelectedPatient(prescriptions: any[]): any {
        if (!prescriptions || prescriptions.length === 0) {
            return null;
        }

        // Buscar paciente con nombreAutopercibido
        const patientWithAutopercibido = prescriptions.find(prescription => {
            // Para prescripciones de Andes
            if (prescription.paciente && prescription.paciente.nombreAutopercibido) {
                return true;
            }
            // Para prescripciones regulares
            if (prescription.patient && prescription.patient.nombreAutopercibido) {
                return true;
            }
            return false;
        });

        if (patientWithAutopercibido) {
            // Retornar el paciente encontrado (puede ser .patient o .paciente)
            return patientWithAutopercibido.patient || patientWithAutopercibido.paciente;
        }

        // Si no se encuentra, usar el primer paciente disponible
        const firstPrescription = prescriptions[0];
        return firstPrescription.patient || firstPrescription.paciente || null;
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
}
