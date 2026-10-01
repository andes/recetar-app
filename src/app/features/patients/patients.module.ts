import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedModule } from '@shared/shared.module';
import { CanvasComponent } from '@shared/components/layout/canvas/canvas.component';
import {
    UiAlertComponent,
    UiDrawerComponent,
    UiFieldInputComponent,
    UiResultsListComponent,
    UiResultsToolbarComponent,
} from '@shared/ui';
import { PatientsRoutingModule, routingComponents } from './patients-routing.module';
import { PatientListItemComponent } from './components/patient-list-item/patient-list-item.component';
import { PatientDetailPanelComponent } from './components/patient-detail-panel/patient-detail-panel.component';
import { PatientEditFormComponent } from './components/patient-edit-form/patient-edit-form.component';
import { DeletePatientDialogComponent } from './components/delete-patient-dialog/delete-patient-dialog.component';

@NgModule({
    declarations: [
        routingComponents,
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        SharedModule,
        CanvasComponent,
        UiAlertComponent,
        UiDrawerComponent,
        UiFieldInputComponent,
        UiResultsListComponent,
        UiResultsToolbarComponent,
        PatientListItemComponent,
        PatientDetailPanelComponent,
        PatientEditFormComponent,
        DeletePatientDialogComponent,
        PatientsRoutingModule,
    ],
})
export class PatientsModule { }
