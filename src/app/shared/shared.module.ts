import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientNamePipe } from './pipes/patient-name.pipe';
import { PatientSexPipe } from './pipes/patient-sex.pipe';

@NgModule({
    declarations: [
        PatientNamePipe,
        PatientSexPipe
    ],
    imports: [
        CommonModule
    ],
    providers: [
        PatientNamePipe,
        PatientSexPipe
    ],
    exports: [
        PatientNamePipe,
        PatientSexPipe
    ]
})
export class SharedModule { }
