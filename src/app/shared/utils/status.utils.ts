export type StatusVariant = 'success' | 'info' | 'warning' | 'error' | 'primary';

const STATUS_VARIANT_MAP: Record<string, StatusVariant> = {
    vigente: 'success',
    pendiente: 'warning',
    dispensada: 'success',
    finalizada: 'success',
    vencida: 'error',
    rechazada: 'error',
    suspendida: 'error',
    active: 'success',
    activo: 'success',
    completed: 'success',
    cancelled: 'error',
    anulada: 'error',
};

const STATUS_LABEL_MAP: Record<string, string> = {
    vigente: 'Vigente',
    pendiente: 'Pendiente',
    dispensada: 'Dispensada',
    finalizada: 'Finalizada',
    vencida: 'Vencida',
    rechazada: 'Rechazada',
    suspendida: 'Suspendida',
    active: 'Activo',
    activo: 'Activo',
    completed: 'Completada',
    cancelled: 'Cancelada',
    anulada: 'Anulada',
};

export function getStatusVariant(status?: string): StatusVariant {
    if (!status) {return 'info';}
    return STATUS_VARIANT_MAP[status.toLowerCase()] || 'info';
}

export function getStatusLabel(status?: string): string {
    if (!status) {return '—';}
    return STATUS_LABEL_MAP[status.toLowerCase()] || status;
}

export function normalizePrescriptionStatus(status?: string): string {
    if (!status) {return '';}
    const statusLower = status.toLowerCase();
    const displayMap: Record<string, string> = {
        vigente: 'VIGENTE',
        finalizada: 'FINALIZADA',
        vencida: 'VENCIDA',
        suspendida: 'SUSPENDIDA',
        rechazada: 'RECHAZADA',
        pendiente: 'VIGENTE',
        dispensada: 'FINALIZADA',
    };
    return displayMap[statusLower] || status.toUpperCase();
}
