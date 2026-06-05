import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    selector: 'ui-section-divider',
    imports: [CommonModule],
    template: `
        <div class="section-divider">
            <ng-content />
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }

        .section-divider {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            color: var(--text-secondary);
            font-size: 11px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: .3px;
            margin: var(--space-5) 0;
        }

        .section-divider::before,
        .section-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--border-color);
        }
    `]
})
export class UiSectionDividerComponent { }
