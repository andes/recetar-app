import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    standalone: true,
    selector: 'ui-empty-state',
    imports: [MatIconModule],
    template: `
        <div class="empty-state">
            <mat-icon>{{ icon }}</mat-icon>
            <ng-content />
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: var(--space-2);
            padding: var(--space-8) var(--space-4);
            color: var(--text-disabled);
            text-align: center;
            font-size: 0.75rem;
        }

        .empty-state .mat-icon {
            font-size: 28px;
            width: 28px;
            height: 28px;
            color: var(--text-disabled);
        }
    `]
})
export class UiEmptyStateComponent {
    @Input() icon = '';
}
