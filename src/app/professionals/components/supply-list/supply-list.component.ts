import { Component, OnInit, ViewChild, AfterContentInit, Output, EventEmitter} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import { SuppliesService } from '@services/supplies.service';
import { AuthService } from '@auth/services/auth.service';
import { ProfessionalDialogComponent } from '@professionals/components/professional-dialog/professional-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { rowsAnimation, detailExpand, arrowDirection } from '@animations/animations.template';



@Component({
    selector: 'app-supply-list',
    templateUrl: './supply-list.component.html',
    styleUrls: ['./supply-list.component.sass'],
    animations: [
        rowsAnimation,
        detailExpand,
        arrowDirection
    ],
    standalone: false
})
export class SupplyListComponent implements OnInit, AfterContentInit {
  @Output() editSupplyEvent = new EventEmitter();

  // displayedColumns: string[] = ['patient', 'prescription_date', 'status', 'supply_count', 'action', 'arrow'];
  displayedColumns: string[] = ['name', 'action'];
  dataSource = new MatTableDataSource<any>([]);
  expandedElement: any | null;
  loadingPrescriptions: boolean;
  supplyName: string;

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(
    private supplyService: SuppliesService,
    private authService: AuthService,
    public dialog: MatDialog){}


  ngOnInit() {
    this.loadingPrescriptions = true;
    this.searchSupplies();
  }

  searchSupplies() {
    this.supplyService.get(this.supplyName).subscribe((supply: any[]) => {
      this.dataSource = new MatTableDataSource<any>(supply);
     
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.loadingPrescriptions = false;
    });
  }

  ngAfterContentInit(){
    this.paginator._intl.itemsPerPageLabel = "Prescripciones por página";
    this.paginator._intl.firstPageLabel = "Primer página";
    this.paginator._intl.lastPageLabel = "Última página";
    this.paginator._intl.nextPageLabel = "Siguiente";
    this.paginator._intl.previousPageLabel = "Anterior";
    this.paginator._intl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
      if (length == 0 || pageSize == 0)
      {
        return `0 de ${length}`;
      }
      length = Math.max(length, 0);
      const startIndex = page * pageSize;
      const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
      return `${startIndex + 1} – ${endIndex} de ${length}`;
    }
  }


  applyFilter(filterValue: string) {
    this.supplyName = filterValue;
    this.searchSupplies();
  }

  canPrint(prescription: any): boolean{
    return (prescription.professional.userId === this.authService.getLoggedUserId()) && prescription.status !== 'Vencida';
  }

  canEdit(prescription: any): boolean{
    return prescription.status === "Pendiente";
  }

  canDelete(prescription: any): boolean{
    return (prescription.professional.userId === this.authService.getLoggedUserId() && prescription.status === "Pendiente");
  }

  editSupply(supply: any){
    this.editSupplyEvent.emit(supply);
  }

  isStatus(prescritpion: any, status: string): boolean{
    return prescritpion.status === status;
  }

  deleteDialogPrescription(prescription: any){
    this.openDialog("delete", prescription);
  }

   // Show a dialog
  private openDialog(aDialogType: string, aPrescription?: any, aText?: string): void {
    const dialogRef = this.dialog.open(ProfessionalDialogComponent, {
      width: '400px',
      data: {dialogType: aDialogType, prescription: aPrescription, text: aText }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }
}
