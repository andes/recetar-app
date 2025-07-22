import { Component, OnInit, ViewChild, Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { PrescriptionsService } from '@services/prescriptions.service';
import { Prescriptions } from '@interfaces/prescriptions';
import * as moment from 'moment';
import { AuthService } from '@auth/services/auth.service';
import { PrescriptionPrinterComponent } from '@professionals/components/prescription-printer/prescription-printer.component';
import { ProfessionalDialogComponent } from '@professionals/components/professional-dialog/professional-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { rowsAnimation, detailExpand, arrowDirection } from '@animations/animations.template';
import { CertificatesService } from '@services/certificates.service';
import { Certificates } from '@interfaces/certificate';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';


@Component({
  selector: 'app-prescriptions-list',
  templateUrl: './prescriptions-list.component.html',
  styleUrls: ['./prescriptions-list.component.sass'],
  animations: [
    rowsAnimation,
    detailExpand,
    arrowDirection
  ],
  providers: [PrescriptionPrinterComponent]
})
export class PrescriptionsListComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @Output() editPrescriptionEvent = new EventEmitter();

  displayedColumns: string[] = ['patient', 'prescription_date', 'status', 'action', 'arrow'];
  certificatesColumns: string[] = ['patient', 'certificate_date', 'action', 'arrow'];
  dataSource = new MatTableDataSource<Prescriptions>([]);
  expandedElement: Prescriptions | null;
  loadingPrescriptions: boolean;
  loadingCertificates: boolean;
  selectedType: string = 'receta'; // Default type
  dataCertificates = new MatTableDataSource<Certificates>([]);

  private paginatorsInitialized = false;

  @ViewChild('prescriptionsPaginator') prescriptionsPaginator: MatPaginator;
  @ViewChild('certificatesPaginator') certificatesPaginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private prescriptionService: PrescriptionsService,
    private certificateService: CertificatesService,
    private authService: AuthService,
    private prescriptionPrinter: PrescriptionPrinterComponent,
    public dialog: MatDialog) { }


  ngOnInit() {
    this.initDataSource();
  }

  ngAfterViewInit() {
    // Configurar paginators después de que la vista esté inicializada
    this.initializePaginators();
  }

  private initializePaginators() {
    setTimeout(() => {
      this.configurePaginatorLabels(this.prescriptionsPaginator);
      this.configurePaginatorLabels(this.certificatesPaginator);
      this.assignPaginatorsToDataSources();
      this.paginatorsInitialized = true;
    });
  }

  private assignPaginatorsToDataSources() {
    if (this.dataSource.data.length > 0 && this.prescriptionsPaginator) {
      this.dataSource.paginator = this.prescriptionsPaginator;
    }
    if (this.dataCertificates.data.length > 0 && this.certificatesPaginator) {
      this.dataCertificates.paginator = this.certificatesPaginator;
    }
  }

  private configurePaginatorLabels(paginator: MatPaginator) {
    if (paginator) {
      paginator._intl.itemsPerPageLabel = "Elementos por página";
      paginator._intl.firstPageLabel = "Primera página";
      paginator._intl.lastPageLabel = "Última página";
      paginator._intl.nextPageLabel = "Siguiente";
      paginator._intl.previousPageLabel = "Anterior";
      paginator._intl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
        if (length == 0 || pageSize == 0) {
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
    this.loadingPrescriptions = true;
    this.loadingCertificates = true;

    // Combinar ambos observables usando combineLatest
    combineLatest([
      this.prescriptionService.prescriptions,
      this.certificateService.certificates
    ]).pipe(
      takeUntil(this.destroy$),
      map(([prescriptions, certificates]) => ({ prescriptions, certificates }))
    ).subscribe(({ prescriptions, certificates }) => {
      // Configurar DataSource para prescripciones
      this.dataSource = new MatTableDataSource<Prescriptions>(prescriptions);
      this.dataSource.sortingDataAccessor = (item, property) => {
        switch (property) {
          case 'patient': return item.patient.lastName + item.patient.firstName;
          case 'prescription_date': return new Date(item.date).getTime();
          default: return item[property];
        }
      };
      this.dataSource.sort = this.sort;

      // Asignar paginator si está disponible
      setTimeout(() => {
        if (this.prescriptionsPaginator) {
          this.dataSource.paginator = this.prescriptionsPaginator;
          this.configurePaginatorLabels(this.prescriptionsPaginator);
        }
      });
      this.loadingPrescriptions = false;

      // Configurar DataSource para certificados
      this.dataCertificates = new MatTableDataSource<Certificates>(certificates);
      this.dataCertificates.sortingDataAccessor = (item, property) => {
        switch (property) {
          case 'patient': return item.patient.lastName + item.patient.firstName;
          case 'prescription_date': return new Date(item.createdAt).getTime();
          default: return item[property];
        }
      };
      this.dataCertificates.sort = this.sort;

      // Asignar paginator si está disponible
      setTimeout(() => {
        if (this.certificatesPaginator) {
          this.dataCertificates.paginator = this.certificatesPaginator;
          this.configurePaginatorLabels(this.certificatesPaginator);
        }
      });
      this.loadingCertificates = false;
    });
  }


  applyFilter(filterValue: string) {
    this.dataSource.filterPredicate = (data: Prescriptions, filter: string) => {
      const accumulator = (currentTerm, key) => {
        return currentTerm + data.patient.lastName + data.patient.firstName + moment(data.date, 'YYYY-MM-DD').format('DD/MM/YYY').toString()
      };

      const dataStr = Object.keys(data).reduce(accumulator, '').toLowerCase();
      const transformedFilter = filter.trim().toLowerCase();
      return dataStr.indexOf(transformedFilter) !== -1;
    };
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.dataCertificates.filter = filterValue.trim().toLowerCase();

    // Resetear paginación para ambas tablas
    if (this.prescriptionsPaginator) {
      this.prescriptionsPaginator.firstPage();
    }
    if (this.certificatesPaginator) {
      this.certificatesPaginator.firstPage();
    }
  }

  canPrint(prescription: Prescriptions): boolean {
    return (prescription.professional.userId === this.authService.getLoggedUserId()) && prescription.status !== 'Vencida';
  }

  canEdit(prescription: Prescriptions): boolean {
    return prescription.status === "Pendiente";
  }

  canDelete(prescription: Prescriptions): boolean {
    return (prescription.professional.userId === this.authService.getLoggedUserId() && prescription.status === "Pendiente");
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
    this.openDialog("delete", prescription);
  }

  deleteDialogCertificate(certificate: Certificates) {
    this.openDialog("delete_certificate", certificate);
  }

  // Show a dialog
  private openDialog(aDialogType: string, aItem?: any, aText?: string): void {
    const dialogRef = this.dialog.open(ProfessionalDialogComponent, {
      width: '400px',
      data: { dialogType: aDialogType, item: aItem, text: aText }
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('The dialog was closed');
    });
  }

  // Método para manejar el cambio de tipo de selector
  onSelectedTypeChange() {
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