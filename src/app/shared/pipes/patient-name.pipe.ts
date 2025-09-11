import { Pipe, PipeTransform } from '@angular/core';
import { Patient } from '@interfaces/patients';

@Pipe({
    name: 'patientName'
})
export class PatientNamePipe implements PipeTransform {

    transform(patient: Patient | null): string {
        if (!patient) {
            return '';
        }

        // Priorizar nombreAutopercibido si existe, sino usar firstName
        return patient.nombreAutopercibido || patient.firstName || '';
    }

}
