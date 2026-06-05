import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PrescriptionItemResult, FrequentMedication } from '../../models/prescription-draft';

@Component({
    standalone: true,
    selector: 'app-medication-item',
    imports: [CommonModule, MatIconModule],
    host: {
        '[class.variant-search]': 'variant === \'search\'',
    },
    template: `
        <div class="med-avatar" [class.commercial]="medKind === 'commercial'" [class.generic]="medKind === 'generic'">
            <mat-icon>{{ medKind === 'commercial' ? 'medication' : 'science' }}</mat-icon>
        </div>
        <div class="med-info">
            <div class="med-name">{{ medName }}</div>
            <div class="med-detail">
                <span>{{ medDetail }}</span>
                <span *ngIf="medPrice != null">
                    <span> | </span><span class="mono">{{ medPriceLabel }}</span>
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

        .med-avatar {
            width: 36px;
            height: 36px;
            flex-shrink: 0;
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--secondary-50);
            color: var(--secondary);
        }

        .med-avatar.generic {
            background: #EDE9FE;
            color: #a446e5;
        }

        .med-avatar .mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
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
            text-transform: uppercase;
        }

        .med-detail {
            font-size: 12px;
            color: var(--text-secondary);
            margin-top: 2px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            text-transform: capitalize;
        }
    `]
})
export class MedicationItemComponent {
    @Input({ required: true }) medication!: PrescriptionItemResult | FrequentMedication;
    @Input() variant: 'search' | 'frequent' = 'frequent';

    get medKind(): string {
        return this.medication.kind;
    }

    get medName(): string {
        if ('entry' in this.medication) { return this.medication.entry.nombre; }
        if ('concept' in this.medication) { return this.medication.concept.term; }
        return this.medication.name;
    }

    get medDetail(): string {
        if ('entry' in this.medication) {
            return [this.medication.entry.accion_descrip, this.medication.entry.presentacion]
                .filter(Boolean).join(' | ');
        }
        if ('concept' in this.medication) { return this.medication.concept.fsn; }
        return this.medication.presentation;
    }

    get medPrice(): number | null {
        if ('entry' in this.medication) { return this.medication.entry.precio ?? null; }
        if ('concept' in this.medication) { return null; }
        return this.medication.price || null;
    }

    get medPriceLabel(): string {
        const p = this.medPrice;
        return p != null ? `$${p.toFixed(2)}` : '';
    }
}
