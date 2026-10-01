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
            background: var(--snackbar-bg);
            color: var(--text-primary-light);
            box-shadow: var(--elevation-3);
            min-width: 320px;
            max-width: 600px;
        }
        .snackbar-icon {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            width: 22px;
            height: 20px;
            line-height: 1;
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
            color: var(--text-primary-light);
            white-space: pre-wrap;
        }
        .snackbar-description {
            font-size: 12px;
            font-weight: 400;
            line-height: 1.4;
            color: var(--text-primary-light);
            opacity: 0.85;
            white-space: pre-wrap;
        }
        .snackbar-close {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 18px;
            width: 18px;
            height: 20px;
            padding: 0;
            line-height: 1;
            color: var(--text-primary-light);
            transition: opacity 0.15s;
            opacity: 0.6;
        }
        .snackbar-close:hover {
            opacity: 1;
        }

        .notification-success .snackbar-icon { color: var(--snackbar-icon-success); }
        .notification-error .snackbar-icon { color: var(--snackbar-icon-error); }
        .notification-warning .snackbar-icon { color: var(--snackbar-icon-warning); }
        .notification-info .snackbar-icon { color: var(--snackbar-icon-info); }
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
