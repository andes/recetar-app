import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { getHttpErrorMessage, getValidationDetails } from '@shared/utils/http-error.util';
import { buildFieldErrors } from '@shared/utils/validation-messages.util';
import { NotificationSnackbarComponent } from '@shared/ui/notification-snackbar.component';

const DEFAULT_DURATION = 5000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
    constructor(private snackBar: MatSnackBar) {}

    success(message: string, description?: string): void {
        this.show(message, 'notification-success', description);
    }

    error(message: string, description?: string): void {
        this.show(message, 'notification-error', description, { duration: 8000 });
    }

    warning(message: string, description?: string): void {
        this.show(message, 'notification-warning', description, { duration: 6000 });
    }

    info(message: string, description?: string): void {
        this.show(message, 'notification-info', description);
    }

    httpError(err: HttpErrorResponse | unknown): void {
        const message = getHttpErrorMessage(err);
        const details = getValidationDetails(err);
        const fieldErrors = buildFieldErrors(details);
        const description = Object.values(fieldErrors).join(' · ');
        this.error(message, description || undefined);
    }

    private show(
        message: string,
        panelClass: string,
        description?: string,
        overrides: Partial<MatSnackBarConfig> = {},
    ): void {
        this.snackBar.openFromComponent(NotificationSnackbarComponent, {
            duration: DEFAULT_DURATION,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass,
            data: { message, description: description || '', panelClass },
            ...overrides,
        });
    }
}
