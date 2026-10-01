import { Component, Input, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
    standalone: true,
    selector: 'ui-alert',
    imports: [CommonModule, MatIconModule],
    template: `
        <div class="alert" [class]="variant" [class.fullwidth]="fullwidth" [class.transparent]="transparent"
             [class.align-center]="textAlign === 'center'" [class.align-right]="textAlign === 'right'">
            <mat-icon class="alert-icon">{{ icon || defaultIcon }}</mat-icon>
            <div class="alert-body"><ng-content /></div>
            <a *ngIf="action && !hasActionsSlot" class="alert-action" [href]="actionUrl || '#'">{{ action }}</a>
            <div *ngIf="hasActionsSlot" class="alert-actions">
                <ng-content select="[alertActions]"></ng-content>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: flex;
            justify-content: center;
        }
        .alert {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            border-radius: var(--radius-md);
            background: var(--bg-card);
            font-size: 12px;
            line-height: 1.4;
        }
        .alert.fullwidth {
            width: 100%;
        }
        .alert-icon {
            flex-shrink: 0;
            font-size: 18px;
            width: 18px;
            height: 18px;
            line-height: 18px;
        }
        .alert-body {
            flex: 1;
            min-width: 0;
        }
        .alert.align-center {
            justify-content: center;
        }
        .alert.align-center .alert-body {
            flex: 0 1 auto;
            text-align: center;
        }
        .alert.align-right {
            justify-content: flex-end;
        }
        .alert.align-right .alert-body {
            flex: 0 1 auto;
            text-align: right;
        }
        .alert-body ::ng-deep b,
        .alert-body ::ng-deep strong {
            font-weight: 700;
        }
        .alert-action {
            flex-shrink: 0;
            font-weight: 600;
            text-decoration: none;
            white-space: nowrap;
            margin-left: auto;
            padding: 4px 10px;
            border-radius: var(--radius-sm);
            border: 1px solid transparent;
            transition: all 0.15s;
        }
        .alert-action:hover {
            text-decoration: none;
        }

        .alert-actions {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: auto;
        }

        /* Variants */
        .warning {
            background-color: var(--warning-bg);
            color: var(--warning-text);
        }
        .warning .alert-icon {
            color: var(--warning-text);
        }
        .warning .alert-body ::ng-deep b,
        .warning .alert-body ::ng-deep strong {
            color: var(--warning-text);
        }
        .warning .alert-action {
            color: var(--warning-text);
            border-color: var(--warning-text);
        }
        .warning .alert-action:hover {
            background: var(--warning-text);
            color: var(--text-primary-light);
        }

        .success {
            background-color: var(--success-bg);
            color: var(--success-text);
        }
        .success .alert-icon {
            color: var(--success-text);
        }
        .success .alert-body ::ng-deep b,
        .success .alert-body ::ng-deep strong {
            color: var(--success-text);
        }
        .success .alert-action {
            color: var(--success-text);
            border-color: var(--success-text);
        }
        .success .alert-action:hover {
            background: var(--success-text);
            color: var(--text-primary-light);
        }

        .error {
            background-color: var(--error-bg);
            color: var(--error-text);
        }
        .error .alert-icon {
            color: var(--error-text);
        }
        .error .alert-body ::ng-deep b,
        .error .alert-body ::ng-deep strong {
            color: var(--error-text);
        }
        .error .alert-action {
            color: var(--error-text);
            border-color: var(--error-text);
        }
        .error .alert-action:hover {
            background: var(--error-text);
            color: var(--text-primary-light);
        }

        .info {
            background-color: var(--info-bg);
            color: var(--info-text);
        }

        .info .alert-icon {
            color: var(--info-text);
        }
        .info .alert-body ::ng-deep b,
        .info .alert-body ::ng-deep strong {
            color: var(--info-text);
        }
        .info .alert-action {
            color: var(--info-text);
            border-color: var(--info-text);
        }
        .info .alert-action:hover {
            background: var(--info-text);
            color: var(--text-primary-light);
        }

        .neutral {
            color: var(--neutral-text);
        }
        .neutral .alert-icon {
            color: var(--neutral-text);
        }
        .neutral .alert-body ::ng-deep b,
        .neutral .alert-body ::ng-deep strong {
            color: var(--neutral-text);
        }
        .neutral .alert-action {
            color: var(--neutral-text);
            border-color: var(--border-color);
        }
        .neutral .alert-action:hover {
            background: var(--neutral-text);
            color: var(--text-primary-light);
        }

        .transparent {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
    `]
})
export class UiAlertComponent {
    @Input() icon: string | undefined;
    @Input() variant: 'warning' | 'success' | 'error' | 'info' | 'neutral' = 'warning';
    @Input() fullwidth = false;
    @Input({ transform: booleanAttribute }) transparent = false;
    @Input() action: string | undefined;
    @Input() actionUrl: string | undefined;
    @Input() hasActionsSlot = false;
    @Input() textAlign: 'left' | 'center' | 'right' = 'left';

    get defaultIcon(): string {
        switch (this.variant) {
            case 'warning': return 'warning';
            case 'success': return 'check_circle';
            case 'error': return 'error';
            case 'info': return 'info_outline';
            case 'neutral': return 'info_outline';
        }
    }
}
