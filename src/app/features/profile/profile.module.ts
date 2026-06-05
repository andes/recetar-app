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
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SharedModule } from '@shared/shared.module';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { CanvasComponent } from '@shared/components/layout/canvas/canvas.component';
import { UiCardComponent, UiIconComponent, UiAlertComponent } from '@shared/ui';
import { AccountPanelComponent } from './components/account-panel/account-panel.component';
import { PasswordPanelComponent } from './components/password-panel/password-panel.component';
import { PinPanelComponent } from './components/pin-panel/pin-panel.component';
import { OrganizationsPanelComponent } from './components/organizations-panel/organizations-panel.component';

@NgModule({
    declarations: [
        routingComponents,
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
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        SharedModule,
        FormFieldComponent,
        CanvasComponent,
        UiCardComponent,
        UiIconComponent,
        UiAlertComponent,
        AccountPanelComponent,
        PasswordPanelComponent,
        PinPanelComponent,
        OrganizationsPanelComponent,
    ]
})
export class ProfileModule { }
