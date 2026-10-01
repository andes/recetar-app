import { Component, Input, booleanAttribute } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { getStatusLabel, getStatusVariant, StatusVariant } from '../utils/status.utils';

export type BadgeChipVariant = StatusVariant | 'secondary' | 'neutral';

@Component({
    standalone: true,
    selector: 'ui-badge-chip',
    imports: [MatChipsModule, MatIconModule],
    template: `
        <mat-chip disableRipple [class]="chipClass">
            <span class="badge-dot" *ngIf="dot"></span>
            <mat-icon *ngIf="icon" class="xs">{{ icon }}</mat-icon>
            <ng-content>{{ status ? resolvedLabel : '' }}</ng-content>
        </mat-chip>
    `,
    styles: [`
        :host {
            display: inline-flex;
        }

        .badge-dot {
            width: 6px;
            height: 6px;
            border-radius: var(--radius-full);
            background: currentColor;
            flex-shrink: 0;
        }
    `]
})
export class UiBadgeChipComponent {
    @Input() variant: BadgeChipVariant = 'neutral';
    @Input() status = '';
    @Input() size: 'sm' | 'md' = 'sm';
    @Input() icon: string | undefined;
    @Input({ transform: booleanAttribute }) dot = false;

    get resolvedVariant(): BadgeChipVariant {
        return this.status ? getStatusVariant(this.status) : this.variant;
    }

    get resolvedLabel(): string {
        return this.status ? getStatusLabel(this.status) : '';
    }

    get chipClass(): string {
        const parts = ['ui-badge-chip'];
        if (this.resolvedVariant !== 'neutral') {
            parts.push(this.resolvedVariant);
        }
        if (this.size === 'sm') {
            parts.push('sm');
        }
        return parts.join(' ');
    }
}
