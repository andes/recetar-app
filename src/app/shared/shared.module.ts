import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PatientNamePipe } from './pipes/patient-name.pipe';
import { PatientFormComponent } from './components/patient-form/patient-form.component';
import { SessionExpirationBannerComponent } from './components/session-expiration-banner/session-expiration-banner.component';
import { EditUserInfoComponent } from '../professionals/components/edit-user-info/edit-user-info.component';

const MATERIAL_MODULES = [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule
];

@NgModule({
    declarations: [
        PatientNamePipe,
        PatientFormComponent,
        SessionExpirationBannerComponent,
        EditUserInfoComponent
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        ...MATERIAL_MODULES,
    ],
    exports: [
        PatientNamePipe,
        PatientFormComponent,
        FlexLayoutModule,
        SessionExpirationBannerComponent,
        EditUserInfoComponent,
        ...MATERIAL_MODULES,
    ]
})
export class SharedModule { }
