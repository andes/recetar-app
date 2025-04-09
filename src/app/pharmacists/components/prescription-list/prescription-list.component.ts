import { Component, OnInit, Input, AfterContentInit, ViewChild } from '@angular/core';
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
import { combineLatest } from 'rxjs';
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
export class PrescriptionListComponent implements OnInit, AfterContentInit {
  

  displayedColumns: string[] = ['professional', 'date', 'status', 'supplies', 'action', 'arrow'];
  dataSource = new MatTableDataSource<any>([]);
  expandedElement: Prescriptions | null;
  loadingPrescriptions: boolean;
  lapseTime: number = 2; // lapse of time that a dispensed prescription can been undo action, and put it back as "pendiente"
  pharmacistId: string;
  isAdmin: boolean = false;
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
    this.loadingPrescriptions = true;
    
    combineLatest([
      this.andesPrescriptionService.prescriptions,
      this.prescriptionService.prescriptions
    ]).subscribe(([andesPrescriptions, prescriptions]) => {
      this.dataSource.data = [...andesPrescriptions, ...prescriptions];
      this.updateMaps();
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

    this.pharmacistId = this.authService.getLoggedUserId();
    this.isAdmin = this.authService.isAdminRole();
  }

  ngAfterContentInit() {
    this.paginator._intl.itemsPerPageLabel = "Prescripciones por página";
    this.paginator._intl.firstPageLabel = "Primer página";
    this.paginator._intl.lastPageLabel = "Última página";
    this.paginator._intl.nextPageLabel = "Siguiente";
    this.paginator._intl.previousPageLabel = "Anterior";
    this.paginator._intl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
      if (length == 0 || pageSize == 0) {
        return `0 de ${length}`;
      }
      length = Math.max(length, 0);
      const startIndex = page * pageSize;
      const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
      return `${startIndex + 1} – ${endIndex} de ${length}`;
    }
  }

  applyFilter(filterValue: string) {
    this.dataSource.filterPredicate = (data: Prescriptions, filter: string) => {
      const accumulator = (currentTerm, key) => {
        // enable filter by lastName / firstName / date
        return currentTerm + data.status + moment(data.date, 'YYYY-MM-DD').format('DD/MM/YYY').toString()
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
    if ("status" in prescription) {
      this.prescriptionService.dispense(prescription._id, this.pharmacistId).subscribe(
        success => {
          if (success) {
            this.openDialog("dispensed", prescription, prescription.professional.businessName);
          }
        }
      );
    } else if ("estadoActual" in prescription) {
      this.andesPrescriptionService.dispense(prescription, this.pharmacistId).subscribe(
        success => {
          if (success) {
            this.openDialog("dispensed", prescription, prescription.profesional.nombre);
          }
        }
      );
    }
  }

  // Dispense prescription, but if was, update table with the correct status.
  cancelDispense(e) {
    if ("status" in e) {
      this.prescriptionService.cancelDispense(e._id, this.pharmacistId).subscribe(
        success => {
          if (success) {
            this.openDialog("cancel-dispensed", e);
          }
        }
      );
    } else if ("estadoActual" in e) {
      this.andesPrescriptionService.cancelDispense(e._id, this.pharmacistId).subscribe(
        success => {
          if (success) {
            this.openDialog("cancel-dispensed", e);
          }
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
      console.log('The dialog was closed');
    });
  }

  // Return true if was dispensed and is seeing who dispensed the prescription
  canPrint(prescription: Prescriptions): boolean {
    return (prescription.status === "Dispensada") && (prescription.dispensedBy?.userId === this.authService.getLoggedUserId());
  }

  canDispense(prescription: Prescriptions | AndesPrescriptions): boolean {
    console.log('canDispense');
    if ("status" in prescription) {
      console.log('prescription');
      return (prescription.status === "Pendiente" && moment() >= moment(prescription.date));
    } else if ("estadoActual" in prescription) {
      console.log('andes');
      return (prescription.estadoActual.tipo === "vigente");
    } else {
      return false;
    }
  }

  printPrescription(prescription: Prescriptions | AndesPrescriptions) {
    if ("status" in prescription) {
      this.prescriptionPrinter.print(prescription);
    } else if ("estadoActual" in prescription) {
      this.andesPrescriptionPrinter.print(prescription);
    }
  } 

  isStatus(prescription: Prescriptions | AndesPrescriptions, status: string): boolean {
    console.log('isStatus',prescription);
    if ("estadoActual" in prescription) {
      const tipo = prescription.estadoActual.tipo;
      switch (tipo) {
        case 'vigente': return status === 'Pendiente';
        case 'finalizada': return status === 'Dispensada';
      }
    } else if ("status" in prescription) {
      return prescription.status === status;
    }
  }

  // Return boolean, accordding with dispensed time plus 2 hours is greater than now
  canCounter(prescription: Prescriptions): boolean {
    if (prescription.status === 'Dispensada' &&
      typeof prescription.dispensedAt !== 'undefined' &&
      prescription.dispensedBy?.userId === this.pharmacistId) {

      const dispensedAt = moment(prescription.dispensedAt);
      const now = moment();
      // dispensedAt.add(10, 'seconds');
      dispensedAt.add(this.lapseTime, 'hours');
      return dispensedAt.isAfter(now);

    }
    return false
  }

  generateReport() {
    const dialogReport = this.dialog.open(DialogReportComponent, {
      width: '400px',
      data: { fechaDesde: this.fechaDesde, fechaHasta: this.fechaHasta, pharmacistId: this.pharmacistId }
    })

    dialogReport.afterClosed().subscribe(result => {
      if (result) {
        this.prescriptionService.getCsv(result).subscribe();
      }
    });
  }

  updateMaps() {
    this.dataSource.data.forEach(prescription => {
      this.canDispenseMap.set(prescription._id, this.calculateCanDispense(prescription));
      this.isStatusMap.set(prescription._id, this.calculateIsStatus(prescription, 'Vencida'));
      this.canCounterMap.set(prescription._id, this.calculateCanCounter(prescription));
    });
  }

  calculateCanDispense(prescription: Prescriptions | AndesPrescriptions): boolean {
    if ("status" in prescription) {
      return prescription.status === "Pendiente" && moment() >= moment(prescription.date);
    } else if ("estadoActual" in prescription) {
      return prescription.estadoActual.tipo === "vigente";
    }
    return false;
  }

  calculateIsStatus(prescription: Prescriptions | AndesPrescriptions, status: string): boolean {
    if ("estadoActual" in prescription) {
      return prescription.estadoActual.tipo.toLowerCase() === status.toLowerCase();
    } else if ("status" in prescription) {
      return prescription.status.toLowerCase() === status.toLowerCase();
    }
    return false;
  }

  calculateCanCounter(prescription: Prescriptions | AndesPrescriptions): boolean {
    if ("status" in prescription) {
      return prescription.status === 'Dispensada' &&
        typeof prescription.dispensedAt !== 'undefined' &&
        prescription.dispensedBy?.userId === this.pharmacistId;
    } else if ("estadoActual" in prescription) {
      return prescription.estadoActual.tipo === 'finalizada' &&
        typeof prescription.estadoActual.createdAt !== 'undefined' &&
        prescription.dispensa[0].organizacion.id === this.pharmacistId;
    }
    return false;
  }
}
