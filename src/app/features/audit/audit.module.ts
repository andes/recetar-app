import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { UiToggleComponent } from '@shared/ui/toggle.component';
import { UiRoleSelectComponent } from '@shared/ui/role-select.component';
import { UiAlertComponent } from '@shared/ui/alert.component';
import { UiListItemComponent } from '@shared/ui/list-item.component';
import { UiEntityComponent } from '@shared/ui/entity.component';
import { UiBadgeChipComponent } from '@shared/ui/badge-chip.component';
import { UiDetailPanelComponent } from '@shared/ui/detail-panel.component';
import { UiDetailSectionComponent } from '@shared/ui/detail-section.component';
import { UiResultsListComponent } from '@shared/ui/results-list.component';
import { UiResultsToolbarComponent } from '@shared/ui/results-toolbar.component';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { SharedModule } from '@shared/shared.module';
import { AuditRoutingModule, routingComponents } from './audit-routing.module';
import { PrescriptionItemComponent } from './components/prescription-item/prescription-item.component';
import { PrescriptionDetailPanelComponent } from './components/prescription-detail-panel/prescription-detail-panel.component';
import { UserCreateComponent } from './components/user-create/user-create.component';
import { AuditDialogComponent } from './components/audit-dialog/audit-dialog.component';
import { AuditConfirmDialogComponent } from './components/audit-confirm-dialog/audit-confirm-dialog.component';
import { AuditUserItemComponent } from './components/audit-user-item/audit-user-item.component';
import { AuditUserDetailPanelComponent } from './components/audit-user-detail-panel/audit-user-detail-panel.component';
import { PrescriptionPrinterComponent } from './components/prescription-printer/prescription-printer.component';
import { FormatTimePipe } from './pipes/format-time.pipe';

@NgModule({
    declarations: [
        routingComponents,
        PrescriptionItemComponent,
        PrescriptionDetailPanelComponent,
        UserCreateComponent,
        AuditUserItemComponent,
        AuditUserDetailPanelComponent,
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
        SharedModule,
        UiToggleComponent,
        UiRoleSelectComponent,
        UiAlertComponent,
        UiListItemComponent,
        UiEntityComponent,
        UiBadgeChipComponent,
        UiDetailPanelComponent,
        UiDetailSectionComponent,
        UiResultsListComponent,
        UiResultsToolbarComponent,
        FormFieldComponent,
        AuditDialogComponent,
        AuditConfirmDialogComponent,
        AuditRoutingModule,
    ]
})
export class AuditFeatureModule { }
