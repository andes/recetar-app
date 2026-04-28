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
import { PatientNamePipe } from './pipes/patient-name.pipe';
import { PatientFormComponent } from './components/patient-form/patient-form.component';

const MATERIAL_MODULES = [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
];

@NgModule({
    declarations: [
        PatientNamePipe,
        PatientFormComponent
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
        ...MATERIAL_MODULES,
    ]
})
export class SharedModule { }
