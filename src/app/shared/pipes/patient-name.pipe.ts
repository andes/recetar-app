import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'patientName'
})
export class PatientNamePipe implements PipeTransform {

    transform(p: any): string {
        if (!p) {
            return '';
        }

        // Priorizar nombreAutopercibido si existe, sino usar firstName
        return `${p.firstName || p.nombre} ${((p.nombreAutopercibido || p.alias) ? `(Autopercibido ${p.nombreAutopercibido || p.alias})` : '')}`;
    }

}
