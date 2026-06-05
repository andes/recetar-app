import { Component, Input, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiIconComponent } from './icon.component';

@Component({
    standalone: true,
    selector: 'ui-card',
    imports: [CommonModule, UiIconComponent],
    template: `
        <div class="ui-card" [class.disabled]="disabled" [class.dashed]="dashed" [class.hidden]="hidden" [class.stretch]="stretch">
            <div class="ui-card-header" *ngIf="title">
                <div class="ui-card-icon">
                    <ng-content select="[cardIcon]">
                        <ui-icon *ngIf="icon" variant="primary" size="md" [icon]="icon" />
                    </ng-content>
                </div>
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

        .ui-card.dashed {
            border: 2px dashed var(--border-color);
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

        .ui-card-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
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

        .ui-card.stretch .ui-card-body {
            padding: var(--space-3);
        }
    `]
})
export class UiCardComponent {
    @Input() icon: string | undefined;
    @Input() title = '';
    @Input() subtitle = '';
    @Input({ transform: booleanAttribute }) disabled = false;
    @Input({ transform: booleanAttribute }) dashed = false;
    @Input({ transform: booleanAttribute }) hidden = false;
    @Input({ transform: booleanAttribute }) stretch = false;
}
