import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfessionalsRoutingModule, routingComponents } from './professionals-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
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
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { PharmacistsModule } from '@pharmacists/pharmacists.module';

import { PrescriptionsListComponent } from './components/prescriptions-list/prescriptions-list.component';
import { CertificateFormComponent } from './components/certificate-form/certificate-form.component';
import { SupplyListComponent } from './components/supply-list/supply-list.component';
import { PracticesFormComponent } from './components/practices-form/practices-form.component';
import { CertificatePracticePrinterComponent } from './components/certificate-practice-printer/certificate-practice-printer.component';
import { SelectorAmbitoComponent } from './components/selector-ambito/selector-ambito.component';
import { PatientFormComponent } from '@shared/components/patient-form/patient-form.component';
import { SharedModule } from '@shared/shared.module';
import { PatientNamePipe } from '@shared/pipes/patient-name.pipe';
import { EditUserInfoModule } from '@shared/components/edit-user-info/edit-user-info.module';

@NgModule({
  declarations: [
    routingComponents,
    PrescriptionsListComponent,
    SupplyListComponent,
    PracticesFormComponent,
    CertificateFormComponent,
    CertificatePracticePrinterComponent,
    SelectorAmbitoComponent,
    CertificateFormComponent,
    SupplyListComponent,
    PracticesFormComponent,
    CertificatePracticePrinterComponent,
    PatientFormComponent,
    SelectorAmbitoComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    ProfessionalsRoutingModule,
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
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatSnackBarModule,
    EditUserInfoModule,
    SharedModule
  ],
  providers: [PatientNamePipe],
  exports: [PatientFormComponent]
})
export class ProfessionalsModule { }
