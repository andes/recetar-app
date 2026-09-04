/**
 * Normalización de estados de recetas según su origen.
 *
 * Los estados difieren según el sistema de origen:
 * - ANDES (receta con `estadoActual.tipo`): `pendiente`, `vigente`, `finalizada`, `vencida`,
 *   `suspendida`, `rechazada`, `dispensada`.
 * - RecetAr local (receta con `status`): `Pendiente` (receta activa pendiente de dispensa),
 *   `Dispensada`, `Vencida`, `Rechazada`, `Suspendida`, `Finalizada`.
 *
 * La diferencia clave: en ANDES `pendiente` significa que la receta (p.ej. tratamiento prolongado)
 * aún no está en vigencia, mientras que en local `Pendiente` es la receta vigente/activa.
 */

export type PrescriptionOrigin = 'andes' | 'recetar';

export function isAndesPrescription(item: any): boolean {
    return !!item && ('idAndes' in item || 'paciente' in item || 'estadoActual' in item);
}

export function normalizeAndesStatus(status: string | undefined): string {
    if (!status) {
        return '';
    }
    const statusLower = status.toLowerCase();
    const statusMap: { [key: string]: string } = {
        'pendiente': 'PENDIENTE',
        'vigente': 'VIGENTE',
        'finalizada': 'DISPENSADA',
        'vencida': 'VENCIDA',
        'suspendida': 'SUSPENDIDA',
        'rechazada': 'RECHAZADA',
        'dispensada': 'DISPENSADA'
    };
    return statusMap[statusLower] || status.toUpperCase();
}

export function normalizeRecetarStatus(status: string | undefined): string {
    if (!status) {
        return '';
    }
    const statusLower = status.toLowerCase();
    const statusMap: { [key: string]: string } = {
        'pendiente': 'VIGENTE',
        'dispensada': 'DISPENSADA',
        'finalizada': 'DISPENSADA',
        'vencida': 'VENCIDA',
        'suspendida': 'SUSPENDIDA',
        'rechazada': 'RECHAZADA'
    };
    return statusMap[statusLower] || status.toUpperCase();
}

/**
 * Devuelve el estado normalizado de una receta según su origen.
 */
export function getPrescriptionStatus(prescription: any): string {
    if (!prescription) {
        return '';
    }
    if (isAndesPrescription(prescription)) {
        const currentStatus = prescription.estadoActual?.tipo || prescription.status;
        return normalizeAndesStatus(currentStatus);
    }
    return normalizeRecetarStatus(prescription.status);
}
