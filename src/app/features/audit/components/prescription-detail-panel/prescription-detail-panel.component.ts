import { Component, Input } from '@angular/core';
import { Prescriptions } from '@interfaces/prescriptions';
import { getStatusLabel, getStatusVariant } from '@shared/utils/status.utils';

@Component({
    selector: 'app-prescription-detail-panel',
    standalone: false,
    templateUrl: './prescription-detail-panel.component.html',
    styleUrls: ['./prescription-detail-panel.component.sass']
})
export class PrescriptionDetailPanelComponent {

    @Input() prescription: Prescriptions | null = null;

    getStatusVariant = getStatusVariant;
    getStatusLabel = getStatusLabel;

    get patientName(): string {
        const patient = this.prescription?.patient;
        if (!patient) { return ''; }
        return `${patient.lastName || ''}, ${patient.firstName || ''}`.replace(/^,\s*/, '');
    }

    get patientDni(): string {
        return this.prescription?.patient?.dni || '';
    }

    get patientSex(): string {
        return this.prescription?.patient?.sex || '';
    }

    get patientObraSocial(): string {
        const first = this.prescription?.supplies?.[0];
        return first?.obraSocial?.nombre || this.prescription?.patient?.obraSocial?.nombre || '';
    }

    get patientAfiliado(): string {
        const first = this.prescription?.supplies?.[0];
        return first?.obraSocial?.numeroAfiliado || this.prescription?.patient?.obraSocial?.numeroAfiliado || '';
    }

    get professionalName(): string {
        return this.prescription?.professional?.businessName || '';
    }

    get professionalEnrollment(): string {
        return this.prescription?.professional?.enrollment || '';
    }

    get organization(): string {
        return this.prescription?.organizacion?.nombre || '';
    }

    get diagnostic(): string {
        return this.prescription?.diagnostic || this.prescription?.supplies?.[0]?.diagnostic || '';
    }

    get observation(): string {
        return this.prescription?.observation || '';
    }

    get supplies(): Prescriptions['supplies'] {
        return this.prescription?.supplies || [];
    }

    get isDispensed(): boolean {
        return (this.prescription?.status || '').toLowerCase() === 'dispensada';
    }

    get dispensedAt(): Date | undefined {
        return this.prescription?.dispensedAt;
    }

    get dispensedByName(): string {
        return this.prescription?.dispensedBy?.businessName || '';
    }

    getDispenserCuil(): string {
        return this.prescription?.dispensedBy?.cuil || '';
    }
}
