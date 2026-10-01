import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Prescriptions } from '@interfaces/prescriptions';
import { getStatusLabel, getStatusVariant } from '@shared/utils/status.utils';

@Component({
    selector: 'app-prescription-item',
    standalone: false,
    templateUrl: './prescription-item.component.html',
    styleUrls: ['./prescription-item.component.sass']
})
export class PrescriptionItemComponent {

    @Input() prescription!: Prescriptions;
    @Input() selected = false;

    @Output() select = new EventEmitter<Prescriptions>();
    @Output() print = new EventEmitter<Prescriptions>();

    getStatusVariant = getStatusVariant;
    getStatusLabel = getStatusLabel;

    get patientName(): string {
        const patient = this.prescription?.patient;
        if (!patient) { return ''; }
        return `${patient.lastName || ''}, ${patient.firstName || ''}`.replace(/^,\s*/, '');
    }

    get suppliesCount(): number {
        return this.prescription?.supplies?.length || 0;
    }

    get firstSupplyName(): string {
        return this.prescription?.supplies?.[0]?.supply?.name || '';
    }

    get dispensedAt(): Date | undefined {
        return this.prescription?.dispensedAt;
    }

    get canPrint(): boolean {
        return this.prescription?.status === 'Dispensada';
    }

    onSelect(): void {
        this.select.emit(this.prescription);
    }

    onPrint(): void {
        this.print.emit(this.prescription);
    }
}
