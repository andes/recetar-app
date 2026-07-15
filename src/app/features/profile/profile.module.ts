import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ProfileRoutingModule, routingComponents } from './profile-routing.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedModule } from '@shared/shared.module';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { CanvasComponent } from '@shared/components/layout/canvas/canvas.component';

@NgModule({
    declarations: [
        routingComponents
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ProfileRoutingModule,
        FlexLayoutModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatChipsModule,
        MatTooltipModule,
        SharedModule,
        FormFieldComponent,
        CanvasComponent,
    ]
})
export class ProfileModule { }
