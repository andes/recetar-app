import { ValidationDetail } from '@shared/utils/http-error.util';

const FIELD_MESSAGES: Record<string, string> = {
    email: 'El email es incorrecto',
    username: 'El nombre de usuario no es válido',
    businessName: 'El nombre no es válido',
    cuil: 'El CUIL no es válido',
    enrollment: 'La matrícula no es válida',
    password: 'La contraseña no es válida',
    roles: 'Los roles seleccionados no son válidos',
    isActive: 'El estado no es válido',
};

const FIELD_ALIASES: Record<string, string> = {
    authorizationDisposition: 'disposicionHabilitacion',
    authorizationExpiration: 'vencimientoHabilitacion',
    responsibleDTEnrollment: 'enrollment',
};

export function normalizeFieldName(field: string): string {
    const base = (field.split('.')[0] || '').trim();
    return FIELD_ALIASES[base] || base;
}

function isFriendlyMessage(message: string): boolean {
    return !!message && !message.startsWith('errors.') && /\s/.test(message);
}

export function resolveFieldMessage(field: string, serverMessage?: string): string {
    if (serverMessage && isFriendlyMessage(serverMessage)) {
        return serverMessage;
    }
    const base = normalizeFieldName(field);
    return FIELD_MESSAGES[base] || serverMessage || 'Valor inválido';
}

export function buildFieldErrors(details: ValidationDetail[]): Record<string, string> {
    const fieldErrors: Record<string, string> = {};
    for (const detail of details) {
        const field = normalizeFieldName(detail.field);
        if (!field || fieldErrors[field]) {
            continue;
        }
        fieldErrors[field] = resolveFieldMessage(detail.field, detail.message);
    }
    return fieldErrors;
}
