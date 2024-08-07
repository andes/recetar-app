import { Component, OnInit, Input, AfterContentInit, ViewChild } from '@angular/core';
import { Prescriptions } from '@interfaces/prescriptions';
import { PrescriptionsService } from '@services/prescriptions.service';
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
import { User } from '@interfaces/users';
import { UserService } from '@services/users.service';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.sass'],
  animations: [
    detailExpand,
    arrowDirection
  ],
  providers: [PrescriptionPrinterComponent]
})
export class UsersListComponent implements OnInit, AfterContentInit {


  // displayedColumns: string[] = ['businessName', 'date', 'status', 'supplies', 'action', 'arrow'];
  displayedColumns: string[] = ['businessName', 'cuil', 'enrollment', 'isActive'];
  dataSource = new MatTableDataSource<User>([]);
  expandedElement: User | null;
  loadingUsers: boolean;
  auditId: string;
  pharmacistId: string;
  isAdmin: boolean = false;
  fechaDesde: Date;
  fechaHasta: Date;
  users: User[];

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  //@ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('tbSort') tbSort = new MatSort();

  constructor(
    private authService: AuthService,
    private usersService: UserService,
    public dialog: MatDialog) { };

  ngOnInit(): void {
    this.loadingUsers = true;
    this.usersService.getUsers().subscribe((users: User[]) => {
      this.dataSource = new MatTableDataSource<User>(users);
      console.log(users);
      this.dataSource.sortingDataAccessor = (item, property) => {
        switch (property) {
          case 'businessName': return item.businessName;
          case 'role': return item.roles[0].role;
          default: return item[property];
        }
      };
      this.dataSource.sort = this.tbSort;
      this.dataSource.paginator = this.paginator;
      this.loadingUsers = false;
    })
    this.auditId = this.authService.getLoggedUserId();
  }

  ngAfterContentInit() {
    this.dataSource.sort = this.tbSort;
    this.paginator._intl.itemsPerPageLabel = "Usuarios por página";
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
    this.dataSource.filterPredicate = (data: User, filter: string) => {
      const accumulator = (currentTerm, key) => {
        // enable filter by lastName / firstName / date
        return currentTerm + data.businessName + data.cuil + data.enrollment;
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
}
