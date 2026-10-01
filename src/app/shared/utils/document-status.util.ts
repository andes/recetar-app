import { Certificate } from '@interfaces/certificate';
import { StatusVariant } from './status.utils';

export function getCertificateStatus(cert: Certificate): string {
    if (cert?.anulateDate) { return 'anulada'; }
    const now = new Date();
    if (cert?.endDate && cert.endDate < now) { return 'vencida'; }
    if (cert?.startDate && cert.startDate > now) { return 'pendiente'; }
    return 'vigente';
}

export function getCertificateStatusLabel(cert: Certificate): string {
    switch (getCertificateStatus(cert)) {
        case 'anulada': return 'Anulado';
        case 'vencida': return 'Vencido';
        case 'pendiente': return 'Pendiente';
        default: return 'Vigente';
    }
}

export function getCertificateStatusVariant(cert: Certificate): StatusVariant {
    switch (getCertificateStatus(cert)) {
        case 'anulada':
        case 'vencida': return 'error';
        case 'pendiente': return 'warning';
        default: return 'success';
    }
}

export function getSupplyStatus(supply?: { estado?: string; status?: string }): string {
    return supply?.estado || supply?.status || '';
}

export function getSupplyStatusVariant(status?: string): StatusVariant {
    const s = (status || '').toLowerCase();
    if (s === 'activo' || s === 'active') { return 'success'; }
    if (s === 'inactivo' || s === 'inactive') { return 'error'; }
    return 'info';
}

export function getSupplyStatusLabel(status?: string): string {
    return status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : '—';
}
