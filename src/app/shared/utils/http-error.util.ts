import { HttpErrorResponse } from '@angular/common/http';

export interface NormalizedHttpError {
    status: number;
    message: string;
    raw: unknown;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null
        ? value as Record<string, unknown>
        : null;
}

function readString(record: Record<string, unknown> | null, key: string): string | null {
    if (!record) {
        return null;
    }

    const value = record[key];
    return typeof value === 'string' ? value : null;
}

function readNumber(record: Record<string, unknown> | null, key: string): number | null {
    if (!record) {
        return null;
    }

    const value = record[key];
    return typeof value === 'number' ? value : null;
}

export function normalizeHttpError(err: HttpErrorResponse | unknown): NormalizedHttpError {
    if (!(err instanceof HttpErrorResponse)) {
        const errRecord = asRecord(err);
        const status = readNumber(errRecord, 'status') || 0;
        const message = typeof err === 'string'
            ? err
            : (readString(errRecord, 'message') || 'Server Error');

        return {
            status,
            message,
            raw: err
        };
    }

    let errorMessage = 'Server Error';
    const errorDataRecord = asRecord(err.error);
    const mensaje = readString(errorDataRecord, 'mensaje');
    const message = readString(errorDataRecord, 'message');

    if (mensaje) {
        errorMessage = mensaje;
    } else if (message) {
        errorMessage = message;
    } else if (typeof err.error === 'string') {
        errorMessage = err.error;
    }

    return {
        status: err.status,
        message: errorMessage,
        raw: err.error
    };
}

export function getHttpErrorMessage(err: HttpErrorResponse | unknown, fallback = 'Server Error'): string {
    const normalizedError = normalizeHttpError(err);
    return normalizedError.message || fallback;
}
