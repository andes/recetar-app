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
import { combineLatest, forkJoin } from 'rxjs';
import { TurnstileOptions } from '../../../shared/ngx-turnstile/interfaces/turnstile-options';

@Component({
  selector: 'app-prescription-list',
  templateUrl: './prescription-list.component.html',
  styleUrls: ['./prescription-list.component.sass'],
  animations: [
    detailExpand,
    arrowDirection
  ],
  providers: [PrescriptionPrinterComponent]
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

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private authService: AuthService,
    private prescriptionService: PrescriptionsService,
    private andesPrescriptionService: AndesPrescriptionsService,
    private prescriptionPrinter: PrescriptionPrinterComponent,
    public dialog: MatDialog) { };

  ngOnInit(): void {
    this.loadingPrescriptions = true;
    console.log('init',this.andesPrescriptionService.prescriptions,
      this.prescriptionService.prescriptions);
    combineLatest([
      this.andesPrescriptionService.prescriptions,
      this.prescriptionService.prescriptions
    ]).subscribe(([andesPrescriptions, prescriptions]) => {
      console.log('andes',andesPrescriptions);
      console.log('recetar',prescriptions);
      this.dataSource.data = [...andesPrescriptions, ...prescriptions];
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
    if (prescription instanceof Prescriptions) {
      this.prescriptionService.dispense(prescription._id, this.pharmacistId).subscribe(
        success => {
          if (success) {
            this.openDialog("dispensed", prescription, prescription.professional.businessName);
          }
        }
      );
    } else if (prescription instanceof AndesPrescriptions) {
      this.andesPrescriptionService.dispense(prescription, this.pharmacistId).subscribe(
        success => {
          if (success) {
            //this.openDialog("dispensed", prescription, prescription.profesional.nombre);
          }
        }
      );
    }
  }

  // Dispense prescription, but if was, update table with the correct status.
  cancelDispense(e) {
    this.prescriptionService.cancelDispense(e, this.pharmacistId).subscribe(
      success => {
        if (success) {
          this.openDialog("cancel-dispensed");
        }
      }
    );
  }

  // Show a dialog
  openDialog(aDialogType: string, aPrescription?: Prescriptions, aText?: string): void {
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
    if (prescription instanceof Prescriptions) {
      console.log('prescription');
      return (prescription.status === "Pendiente" && moment() >= moment(prescription.date));
    } else if (prescription instanceof AndesPrescriptions) {
      console.log('andes');
      return (prescription.estadoActual.tipo === "vigente");
    } else {
      return false;
    }
  }

  printPrescription(prescription: Prescriptions) {
    this.prescriptionPrinter.print(prescription);
  } 

  isStatus(prescription: Prescriptions | AndesPrescriptions, status: string): boolean {
    console.log('isStatus',prescription);
    if (prescription instanceof AndesPrescriptions) {
      const tipo = prescription.estadoActual.tipo;
      switch (tipo) {
        case 'vigente': return status === 'Pendiente';
        case 'finalizada': return status === 'Dispensada';
      }
    } else if (prescription instanceof Prescriptions) {
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

}
