import { Component, Input, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiIconComponent } from './icon.component';

@Component({
    standalone: true,
    selector: 'ui-card',
    imports: [CommonModule, UiIconComponent],
    template: `
        <div class="ui-card" [class.disabled]="disabled" [class.hidden]="hidden">
            <div class="ui-card-header" *ngIf="icon">
                <ui-icon variant="primary" size="md" [icon]="icon" />
                <div class="ui-card-titles">
                    <div class="ui-card-title">{{ title }}</div>
                    <div class="ui-card-subtitle" *ngIf="subtitle">{{ subtitle }}</div>
                </div>
                <div class="ui-card-actions">
                    <ng-content select="[cardAction]" />
                </div>
            </div>
            <div class="ui-card-body">
                <ng-content />
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }

        .ui-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            overflow: hidden;
        }

        .ui-card.disabled {
            opacity: .5;
            pointer-events: none;
        }

        .ui-card.hidden {
            display: none;
        }

        .ui-card-header {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            padding: var(--space-4) var(--space-5);
            border-bottom: 1px solid var(--border-color);
        }

        .ui-card-titles {
            flex: 1;
            min-width: 0;
        }

        .ui-card-title {
            font-size: 15px;
            font-weight: 600;
            color: var(--text-primary);
        }

        .ui-card-subtitle {
            font-size: 12px;
            color: var(--text-secondary);
            margin-top: 2px;
            line-height: 1.4;
        }

        .ui-card-actions {
            flex-shrink: 0;
        }

        .ui-card-body {
            padding: var(--space-5);
        }
    `]
})
export class UiCardComponent {
    @Input() icon: string | undefined;
    @Input() title = '';
    @Input() subtitle = '';
    @Input({ transform: booleanAttribute }) disabled = false;
    @Input({ transform: booleanAttribute }) hidden = false;
}
