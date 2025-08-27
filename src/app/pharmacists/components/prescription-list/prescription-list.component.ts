import { Component, OnInit, AfterContentInit, ViewChild, OnDestroy } from '@angular/core';
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
import { PrescriptionPrinterComponent } from '@pharmacists/components/prescription-printer/prescription-printer.component';
import { detailExpand, arrowDirection } from '@animations/animations.template';
import { DialogReportComponent } from '../dialog-report/dialog-report.component';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AndesPrescriptionPrinterComponent } from '@pharmacists/components/andes-prescription-printer/andes-prescription-printer.component';

@Component({
    selector: 'app-prescription-list',
    templateUrl: './prescription-list.component.html',
    styleUrls: ['./prescription-list.component.sass'],
    animations: [
        detailExpand,
        arrowDirection
    ],
    providers: [PrescriptionPrinterComponent, AndesPrescriptionPrinterComponent]
})
export class PrescriptionListComponent implements OnInit, AfterContentInit, OnDestroy {
    private destroy$ = new Subject<void>();

    displayedColumns: string[] = ['medicamento', 'date', 'status', 'action', 'arrow'];
    dataSource = new MatTableDataSource<any>([]);
    expandedElement: Prescriptions | null;
    loadingPrescriptions: boolean;
    lapseTime = 2; // lapse of time that a dispensed prescription can been undo action, and put it back as "pendiente"
    pharmacistId: string;
    isAdmin = false;
    fechaDesde: Date;
    fechaHasta: Date;

    canDispenseMap = new Map<string, boolean>();
    isStatusMap = new Map<string, boolean>();
    canCounterMap = new Map<string, boolean>();

    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    constructor(
        private authService: AuthService,
        private prescriptionService: PrescriptionsService,
        private andesPrescriptionService: AndesPrescriptionsService,
        private prescriptionPrinter: PrescriptionPrinterComponent,
        private andesPrescriptionPrinter: AndesPrescriptionPrinterComponent,
        public dialog: MatDialog) { };

    ngOnInit(): void {
        this.pharmacistId = this.authService.getLoggedUserId();
        this.isAdmin = this.authService.isAdminRole();
        this.initDataSource();
        this.loadPrescriptions();
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
        this.loadingPrescriptions = true;

        // Para farmacéuticos, necesitamos cargar todas las prescripciones disponibles
        // no solo las del usuario actual como en el caso de profesionales
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
                            // La paginación aquí es local ya que se cargan todas las prescripciones
                            // Si se requiere paginación del servidor, se necesitaría modificar los servicios
                        });
                    }
                });
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
     * Útil para asegurar que los datos estén sincronizados
     */
    refreshPrescriptions(): void {
        this.loadingPrescriptions = true;
        
        // Refrescar ambos tipos de prescripciones
        // Nota: Esto podría necesitar ajustes según la implementación específica de los servicios
        // Por ahora, simplemente forzamos la actualización de los mapas
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

    // Dispense prescription, but if was, update table with the correct status.
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

    // Cancel dispense prescription, but if was, update table with the correct status.
    cancelDispense(prescription: Prescriptions | AndesPrescriptions) {
        if ('status' in prescription) {
            this.prescriptionService.cancelDispense(prescription._id, this.pharmacistId).subscribe(
                success => {
                    if (success) {
                        // Actualizar los mapas después de la operación exitosa
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
                        // Actualizar los mapas después de la operación exitosa
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

    // Return true if was dispensed and is seeing who dispensed the prescription
    canPrint(prescription: Prescriptions): boolean {
        return (prescription.status === 'Dispensada') && (prescription.dispensedBy?.userId === this.authService.getLoggedUserId());
    }

    canDispense(prescription: Prescriptions | AndesPrescriptions): boolean {
        // Usar el mapa calculado para mejor rendimiento
        const canDispenseFromMap = this.canDispenseMap.get(prescription._id);
        if (canDispenseFromMap !== undefined) {
            return canDispenseFromMap;
        }

        // Fallback al cálculo directo si no está en el mapa
        return this.calculateCanDispense(prescription);
    }

    printPrescription(prescription: Prescriptions | AndesPrescriptions) {
        if ('status' in prescription) {
            this.prescriptionPrinter.print(prescription);
        } else if ('estadoActual' in prescription) {
            this.andesPrescriptionPrinter.print(prescription);
        }
    }

    isStatus(prescription: Prescriptions | AndesPrescriptions, status: string): boolean {
        // Para casos específicos como 'Vencida', usar el mapa
        if (status === 'Vencida') {
            const isExpiredFromMap = this.isStatusMap.get(prescription._id);
            if (isExpiredFromMap !== undefined) {
                return isExpiredFromMap;
            }
        }

        // Para otros estados, cálculo directo
        return this.calculateIsStatus(prescription, status);
    }

    // Return boolean, according with dispensed time plus 2 hours is greater than now
    canCounter(prescription: Prescriptions | AndesPrescriptions): boolean {
        // Usar el mapa calculado para mejor rendimiento
        const canCounterFromMap = this.canCounterMap.get(prescription._id);
        if (canCounterFromMap !== undefined) {
            return canCounterFromMap;
        }

        // Fallback al cálculo directo si no está en el mapa
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

    updateMaps() {
        // Limpiar mapas existentes
        this.canDispenseMap.clear();
        this.isStatusMap.clear();
        this.canCounterMap.clear();
        
        // Recalcular todos los valores para las prescripciones actuales
        this.dataSource.data.forEach(prescription => {
            if (prescription && prescription._id) {
                this.canDispenseMap.set(prescription._id, this.calculateCanDispense(prescription));
                this.isStatusMap.set(prescription._id, this.calculateIsStatus(prescription, 'Vencida'));
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
            // Prescripción regular
            if (prescription.status === 'Dispensada' &&
                typeof prescription.dispensedAt !== 'undefined' &&
                prescription.dispensedBy?.userId === this.pharmacistId) {

                const dispensedAt = moment(prescription.dispensedAt);
                const now = moment();
                dispensedAt.add(this.lapseTime, 'hours');
                return dispensedAt.isAfter(now);
            }
        } else if ('estadoActual' in prescription) {
            // Prescripción de Andes
            if (prescription.estadoActual.tipo === 'finalizada' &&
                typeof prescription.estadoActual.createdAt !== 'undefined' &&
                prescription.dispensa && prescription.dispensa.length > 0 &&
                prescription.dispensa[0].organizacion.id === this.pharmacistId) {

                const dispensedAt = moment(prescription.estadoActual.createdAt);
                const now = moment();
                dispensedAt.add(this.lapseTime, 'hours');
                return dispensedAt.isAfter(now);
            }
        }
        return false;
    }
}
