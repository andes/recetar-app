import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'patientName',
    standalone: true
})
export class PatientNamePipe implements PipeTransform {

    private isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null;
    }

    private asString(value: unknown): string {
        return typeof value === 'string' ? value : '';
    }

    transform(p: unknown): string {
        if (!p) {
            return '';
        }

        if (!this.isRecord(p)) {
            return '';
        }

        const firstName = this.asString(p['firstName']);
        const nombre = this.asString(p['nombre']);
        const nombreAutopercibido = this.asString(p['nombreAutopercibido']);
        const alias = this.asString(p['alias']);
        const name = firstName || nombre;
        const selfPerceivedName = nombreAutopercibido || alias;

        // Priorizar nombreAutopercibido si existe, sino usar firstName
        return `${name} ${selfPerceivedName ? `(Autopercibido ${selfPerceivedName})` : ''}`;
    }

}
