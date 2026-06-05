import { Component, Inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MedicationSearchComponent } from '@shared/components/medication-search/medication-search.component';
import { MedicationItemComponent } from '@shared/ui/medication-item.component';
import { MedicationItem, FrequentMedication, PrescriptionItemResult } from '@shared/models/medication.types';
import { MixedPrescription } from '../../services/dispense.service';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { Prescriptions } from '@interfaces/prescriptions';

export interface DispenseConfirmData {
    prescription: MixedPrescription;
    medication: FrequentMedication;
    quantity: number;
}

export interface DispenseConfirmResult {
    action: 'confirm' | 'replace';
    replacement?: MedicationItem;
}

@Component({
    standalone: true,
    selector: 'app-dispense-confirm-dialog',
    templateUrl: './dispense-confirm-dialog.component.html',
    styleUrls: ['./dispense-confirm-dialog.component.sass'],
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MedicationSearchComponent,
        MedicationItemComponent,
    ],
})
export class DispenseConfirmDialogComponent {
    mode: 'confirm' | 'replace' = 'confirm';
    replacement: MedicationItem | null = null;

    @ViewChild('medSearch') medSearch?: MedicationSearchComponent;

    constructor(
        public dialogRef: MatDialogRef<DispenseConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DispenseConfirmData,
    ) { }

    get patientName(): string {
        const p = this.data.prescription;
        if ('estadoActual' in p) {
            const andes = p as AndesPrescriptions;
            return `${andes.paciente?.apellido || ''}, ${andes.paciente?.nombre || ''}`.replace(/^,\s*/, '');
        }
        const local = p as Prescriptions;
        return `${local?.patient?.lastName || ''}, ${local?.patient?.firstName || ''}`.replace(/^,\s*/, '');
    }

    get replacementMedication(): PrescriptionItemResult | FrequentMedication | null {
        if (!this.replacement) { return null; }
        if (this.replacement.supply) {
            return { kind: 'commercial', entry: this.replacement.supply };
        }
        if (this.replacement.snomedConcept) {
            return { kind: 'generic', concept: this.replacement.snomedConcept };
        }
        return null;
    }

    onConfirm(): void {
        this.dialogRef.close({
            action: this.replacement ? 'replace' : 'confirm',
            replacement: this.replacement || undefined,
        } as DispenseConfirmResult);
    }

    onSwitchToReplace(): void {
        this.mode = 'replace';
    }

    onSelectReplacement(): void {
        this.medSearch?.confirmMedication();
    }

    onReplacementConfirmed(replacement: MedicationItem): void {
        this.replacement = replacement;
        this.mode = 'confirm';
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
