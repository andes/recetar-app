import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { getHttpErrorMessage } from '@shared/utils/http-error.util';

const DEFAULT_DURATION = 5000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
    constructor(private snackBar: MatSnackBar) {}

    success(message: string): void {
        this.show(message, ['notification-success']);
    }

    error(message: string): void {
        this.show(message, ['notification-error'], { duration: 8000 });
    }

    warning(message: string): void {
        this.show(message, ['notification-warning'], { duration: 6000 });
    }

    info(message: string): void {
        this.show(message, ['notification-info']);
    }

    httpError(err: HttpErrorResponse | unknown): void {
        const message = getHttpErrorMessage(err);
        this.error(message);
    }

    private show(
        message: string,
        panelClass: string[],
        overrides: Partial<MatSnackBarConfig> = {},
    ): void {
        this.snackBar.open(message, '✕', {
            duration: DEFAULT_DURATION,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass,
            ...overrides,
        });
    }
}
