import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { SharedModule } from '@shared/shared.module';
import { AuditRoutingModule, routingComponents } from './audit-routing.module';
import { PrescriptionTableComponent } from './components/prescription-table/prescription-table.component';
import { UserCreateComponent } from './components/user-create/user-create.component';
import { AuditDialogComponent } from './components/audit-dialog/audit-dialog.component';
import { PrescriptionPrinterComponent } from './components/prescription-printer/prescription-printer.component';
import { FormatTimePipe } from './pipes/format-time.pipe';

@NgModule({
    declarations: [
        routingComponents,
        PrescriptionTableComponent,
        UserCreateComponent,
        PrescriptionPrinterComponent,
        FormatTimePipe
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        MatMenuModule,
        MatSelectModule,
        MatTableModule,
        MatSortModule,
        SharedModule,
        AuditDialogComponent,
        AuditRoutingModule,
    ]
})
export class AuditFeatureModule { }
