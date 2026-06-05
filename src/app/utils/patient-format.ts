export function getInitials(patient: { firstName?: string; lastName?: string; initials?: string }): string {
    if (patient.initials) {
        return patient.initials;
    }
    const first = (patient.firstName || '')[0] || '';
    const last = (patient.lastName || '')[0] || '';
    return (first + last).toUpperCase() || '??';
}

export function formatDni(dni: string | undefined | null): string {
    if (!dni) { return ''; }
    const d = dni.replace(/\D/g, '');
    if (d.length === 8) { return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`; }
    return dni;
}

export function toPascalCase(value: string): string {
    if (!value) { return ''; }
    return value
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function formatName(patient: { firstName?: string; lastName?: string; nombreAutopercibido?: string } | null | undefined, useAutopercibido = false): string {
    if (!patient) { return ''; }
    const first = toPascalCase(useAutopercibido ? (patient.nombreAutopercibido || patient.firstName || '') : (patient.firstName || ''));
    const last = toPascalCase(patient.lastName || '');
    return `${first} ${last}`.trim();
}

export function getAge(birthDate: Date | string | null | undefined): number | null {
    if (!birthDate) { return null; }
    const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
    if (isNaN(birth.getTime())) { return null; }
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age >= 0 ? age : null;
}
