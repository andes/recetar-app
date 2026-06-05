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
            <span class="snackbar-label">{{ message }}</span>
            <button class="snackbar-close material-symbols-outlined" (click)="dismiss()">close</button>
        </div>
    `,
    styles: [`
        .snackbar {
            display: flex;
            align-items: center;
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
        .snackbar-label {
            flex: 1;
            min-width: 0;
            font-size: 14px;
            font-weight: 500;
            line-height: 1.4;
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

        .notification-success .snackbar-icon { color: var(--success-text); }
        .notification-success .snackbar-label { color: var(--success-text); }
        .notification-success .snackbar-close { color: var(--success-text); }

        .notification-error .snackbar-icon { color: var(--error-fill); }
        .notification-error .snackbar-label { color: var(--error-fill); }
        .notification-error .snackbar-close { color: var(--error-fill); }

        .notification-warning .snackbar-icon { color: var(--warning-fill); }
        .notification-warning .snackbar-label { color: var(--warning-fill); }
        .notification-warning .snackbar-close { color: var(--warning-fill); }

        .notification-info .snackbar-icon { color: var(--info-text); }
        .notification-info .snackbar-label { color: var(--info-text); }
        .notification-info .snackbar-close { color: var(--info-text); }
    `]
})
export class NotificationSnackbarComponent {
    protected message: string;
    protected icon: string;
    protected panelClass: string;

    private ref = inject(MatSnackBarRef);

    constructor(@Inject(MAT_SNACK_BAR_DATA) data: { message: string; panelClass: string }) {
        this.message = data.message;
        this.panelClass = data.panelClass;
        this.icon = ICON_MAP[data.panelClass] || 'info_outline';
    }

    dismiss(): void {
        this.ref.dismissWithAction();
    }
}
