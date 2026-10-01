import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

const ICON_MAP: Record<string, string> = {
    'notification-success': 'check_circle',
    'notification-error': 'error',
    'notification-warning': 'warning',
    'notification-info': 'info_outline',
};

@Component({
    standalone: true,
    selector: 'notification-snackbar',
    imports: [CommonModule, MatIconModule],
    template: `
            <div class="snackbar" [ngClass]="panelClass">
            <span class="material-symbols-outlined snackbar-icon">{{ icon }}</span>
            <div class="snackbar-content">
                <span class="snackbar-label">{{ message }}</span>
                <span class="snackbar-description" *ngIf="description">{{ description }}</span>
            </div>
            <button class="snackbar-close material-symbols-outlined" (click)="dismiss()">close</button>
        </div>
    `,
    styles: [`
        .snackbar {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 14px 16px;
            border-radius: var(--radius-lg);
            background: var(--bg-card);
            box-shadow: var(--elevation-3);
            min-width: 320px;
            max-width: 600px;
        }
        .snackbar-icon {
            flex-shrink: 0;
            font-size: 22px;
            width: 22px;
            height: 22px;
        }
        .snackbar-content {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
            min-width: 0;
        }
        .snackbar-label {
            font-size: 14px;
            font-weight: 500;
            line-height: 1.4;
            white-space: pre-wrap;
        }
        .snackbar-description {
            font-size: 12px;
            font-weight: 400;
            line-height: 1.4;
            opacity: 0.85;
            white-space: pre-wrap;
        }
        .snackbar-close {
            flex-shrink: 0;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 18px;
            width: 18px;
            height: 18px;
            padding: 0;
            line-height: 1;
            transition: opacity 0.15s;
            opacity: 0.6;
        }
        .snackbar-close:hover {
            opacity: 1;
        }

        .notification-success .snackbar-icon,
        .notification-success .snackbar-label,
        .notification-success .snackbar-description,
        .notification-success .snackbar-close { color: var(--success-text); }

        .notification-error .snackbar-icon,
        .notification-error .snackbar-label,
        .notification-error .snackbar-description,
        .notification-error .snackbar-close { color: var(--error-fill); }

        .notification-warning .snackbar-icon,
        .notification-warning .snackbar-label,
        .notification-warning .snackbar-description,
        .notification-warning .snackbar-close { color: var(--warning-fill); }

        .notification-info .snackbar-icon,
        .notification-info .snackbar-label,
        .notification-info .snackbar-description,
        .notification-info .snackbar-close { color: var(--info-text); }
    `]
})
export class NotificationSnackbarComponent {
    protected message: string;
    protected description: string;
    protected icon: string;
    protected panelClass: string;

    private ref = inject(MatSnackBarRef);

    constructor(@Inject(MAT_SNACK_BAR_DATA) data: { message: string; description?: string; panelClass: string }) {
        this.message = data.message;
        this.description = data.description || '';
        this.panelClass = data.panelClass;
        this.icon = ICON_MAP[data.panelClass] || 'info_outline';
    }

    dismiss(): void {
        this.ref.dismissWithAction();
    }
}
