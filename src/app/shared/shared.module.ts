import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientNamePipe } from './pipes/patient-name.pipe';

@NgModule({
    declarations: [
        PatientNamePipe
    ],
    imports: [
        CommonModule
    ],
    exports: [
        PatientNamePipe
    ]
})
export class SharedModule { }
