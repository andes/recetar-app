import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'patientSex'
})
export class PatientSexPipe implements PipeTransform {

    transform(value: any): string {
        if (value === null || value === undefined) {
            return '';
        }

        const raw = typeof value === 'string'
            ? value
            : (value.sexo ?? value.sex ?? value.genero ?? '');

        if (!raw) {
            return '';
        }

        const normalized = String(raw).trim().toLowerCase();
        if (normalized === 'otro') {
            return 'No binario';
        }

        return String(raw);
    }

}
