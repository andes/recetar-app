import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { PharmacistsRoutingModule, routingComponent } from './pharmacists-routing.module';
// flex-layout
import { FlexLayoutModule } from '@angular/flex-layout';
// material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PrescriptionListComponent } from './components/prescription-list/prescription-list.component';
import { PrescriptionUndoComponent } from './components/prescription-undo/prescription-undo.component';
import { AndesPrescriptionPrinterComponent } from './components/andes-prescription-printer/andes-prescription-printer.component';
import { FormatTimePipe } from './pipes/format-time.pipe';
import { DialogReportComponent } from './components/dialog-report/dialog-report.component';
import { SharedModule } from '@shared/shared.module';
import { PatientNamePipe } from '@shared/pipes/patient-name.pipe';
@NgModule({
    declarations: [
        routingComponent,
        PrescriptionListComponent,
        PrescriptionUndoComponent,
        AndesPrescriptionPrinterComponent,
        FormatTimePipe,
        DialogReportComponent
    ],
    imports: [
        BrowserModule,
        CommonModule,
        PharmacistsRoutingModule,
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
        SharedModule
    ],
    exports: [
        AndesPrescriptionPrinterComponent
    ],
    providers: [PatientNamePipe],
})
export class PharmacistsModule { }
