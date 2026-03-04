import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AuditRoutingModule, routingComponent } from './audit-routing.module';
// flex-layout
import { FlexLayoutModule } from '@angular/flex-layout';
// material
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PatientNamePipe } from '@shared/pipes/patient-name.pipe';
import { DialogReportComponent } from './components/dialog-report/dialog-report.component';
import { PrescriptionListComponent } from './components/prescription-list/prescription-list.component';
import { UserCreateComponent } from './components/user-create/user-create.component';
import { UsersListComponent } from './components/user-list/users-list.component';
import { FormatTimePipe } from './pipes/format-time.pipe';

@NgModule({
  declarations: [
    routingComponent,
    UsersListComponent,
    UserCreateComponent,
    PrescriptionListComponent,
    FormatTimePipe,
    DialogReportComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AuditRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    FlexLayoutModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatRadioModule
  ],
  providers: [PatientNamePipe]
})
export class AuditModule { }
