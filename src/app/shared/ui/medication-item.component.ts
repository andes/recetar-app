import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrescriptionItemResult, FrequentMedication } from '@shared/models/medication.types';
import { VademecumEntry } from '@interfaces/vademecum';
import { CapitalizePipe } from '../pipes/capitalize.pipe';
import { UiMedAvatarComponent } from './med-avatar.component';

@Component({
    standalone: true,
    selector: 'app-medication-item',
    imports: [CommonModule, CapitalizePipe, UiMedAvatarComponent],
    host: {
        '[class.variant-search]': 'variant === \'search\'',
    },
    template: `
        <ui-med-avatar />
        <div class="med-info">
            <div class="med-name">{{ medName | titlecase }}</div>
            <div class="med-detail">
                <small>{{ medDetail | capitalize }}</small>
                <span *ngIf="medPrice != null">
                    <small> | </small><small class="mono">{{ medPriceLabel }}</small>
                </span>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: flex;
            flex: 1;
            align-items: center;
            gap: var(--space-3);
            min-width: 0;
        }

        .med-info {
            flex: 1;
            min-width: 0;
        }

        .med-name {
            font-size: 13px;
            font-weight: 500;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        .med-detail {
            font-size: 12px;
            color: var(--text-secondary);
            margin-top: 2px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
    `]
})
export class MedicationItemComponent {
    @Input({ required: true }) medication!: VademecumEntry | PrescriptionItemResult | FrequentMedication;
    @Input() variant: 'search' | 'frequent' = 'frequent';

    get medName(): string {
        if ('entry' in this.medication) { return this.medication.entry.nombre; }
        if ('concept' in this.medication) { return this.medication.concept.term; }
        if ('nombre' in this.medication) { return this.medication.nombre; }
        return this.medication.name;
    }

    get medDetail(): string {
        if ('entry' in this.medication) {
            return [this.drugLabel(this.medication.entry), this.medication.entry.accion_descrip, this.medication.entry.presentacion]
                .filter(Boolean).join(' | ');
        }
        if ('concept' in this.medication) { return this.medication.concept.fsn; }
        if ('nombre' in this.medication) {
            return [this.drugLabel(this.medication), this.medication.accion_descrip, this.medication.presentacion]
                .filter(Boolean).join(' | ');
        }
        return this.medication.presentation;
    }

    private drugLabel(e: VademecumEntry): string {
        return e.droga_descrip
            ? [e.droga_descrip, e.potencia].filter(Boolean).join(' ')
            : '';
    }

    get medPrice(): number | null {
        if ('entry' in this.medication) { return this.medication.entry.precio ?? null; }
        if ('concept' in this.medication) { return null; }
        if ('nombre' in this.medication) { return this.medication.precio ?? null; }
        return this.medication.price || null;
    }

    get medPriceLabel(): string {
        const p = this.medPrice;
        return p != null ? `$${p.toFixed(2)}` : '';
    }
}
