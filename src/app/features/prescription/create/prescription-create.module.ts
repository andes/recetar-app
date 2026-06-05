import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PrescriptionCreateRoutingModule, routingComponents } from './prescription-create-routing.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { SharedModule } from '@shared/shared.module';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatPaginatorModule } from '@angular/material/paginator';
import { EditPatientComponent } from '@shared/components/edit-patient/edit-patient.component';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';

@NgModule({
    declarations: [
        routingComponents
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        PrescriptionCreateRoutingModule,
        FlexLayoutModule,
        SharedModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatChipsModule,
        MatBadgeModule,
        MatPaginatorModule,
        EditPatientComponent,
        FormFieldComponent,
    ]
})
export class PrescriptionCreateModule { }
