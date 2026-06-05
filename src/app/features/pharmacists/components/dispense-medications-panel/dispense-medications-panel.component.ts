import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MedicationSummary } from '../../services/dispense-medications.service';

@Component({
    selector: 'app-dispense-medications-panel',
    templateUrl: './dispense-medications-panel.component.html',
    styleUrls: ['./dispense-medications-panel.component.sass'],
    standalone: false
})
export class DispenseMedicationsPanelComponent {

    @Input() medications: MedicationSummary[] = [];
    @Input() loading = false;

    @Output() refresh = new EventEmitter<void>();
    @Output() medicationSelect = new EventEmitter<MedicationSummary>();

    selectedMedication: string | null = null;

    get pendingMeds(): MedicationSummary[] {
        return this.medications.filter((m) => !this.isDispensed(m) && !this.isExpired(m));
    }

    get dispensedMeds(): MedicationSummary[] {
        return this.medications.filter((m) => this.isDispensed(m));
    }

    get expiredMeds(): MedicationSummary[] {
        return this.medications.filter((m) => this.isExpired(m));
    }

    get totalRecipes(): number {
        return this.medications.reduce((sum, m) => sum + m.count, 0);
    }

    get pendingCount(): number {
        return this.pendingMeds.reduce((sum, m) => sum + m.count, 0);
    }

    selectMedication(med: MedicationSummary): void {
        this.selectedMedication = med.name;
        this.medicationSelect.emit(med);
    }

    isDispensed(med: MedicationSummary): boolean {
        return med.status === 'dispensada';
    }

    isExpired(med: MedicationSummary): boolean {
        return med.status === 'vencida';
    }

    onRefresh(): void {
        this.refresh.emit();
    }
}
