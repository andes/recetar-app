import { Component, Input } from '@angular/core';

@Component({
    standalone: true,
    selector: 'ui-detail-section',
    template: `
        <section class="detail-section"
            [class.box]="variant !== 'default'"
            [class.box-info]="variant === 'info'"
            [class.box-neutral]="variant === 'neutral'"
            [class.box-warning]="variant === 'warning'">
            @if (label) {
                <label>{{ label }}</label>
            }
            <div class="detail-section-body">
                <ng-content></ng-content>
            </div>
        </section>
    `,
    styles: [`
        :host {
            display: block;
            margin-top: var(--space-6);
        }

        :host(:first-child) {
            margin-top: 0;
        }

        .detail-section {
            display: flex;
            flex-direction: column;
        }

        .detail-section-body {
            display: flex;
            flex-direction: column;
            gap: var(--space-2);
            min-width: 0;
        }

        .detail-section.box .detail-section-body {
            border-radius: var(--radius-sm);
            padding: var(--space-3);
        }

        .detail-section.box-neutral .detail-section-body {
            background: var(--primary-50);
        }

        .detail-section.box-info .detail-section-body {
            background: var(--secondary-50);
        }

        .detail-section.box-warning .detail-section-body {
            background: var(--warning-bg);
        }

        .detail-section.box ::ng-deep p {
            margin: 0;
            font-style: italic;
        }
    `]
})
export class UiDetailSectionComponent {
    @Input() label = '';
    @Input() variant: 'default' | 'info' | 'neutral' | 'warning' = 'default';
}
