export interface PatientGenderOption {
    value: string;
    label: string;
}

export const PATIENT_GENDER_OPTIONS: PatientGenderOption[] = [
    { value: 'mujer', label: 'Mujer' },
    { value: 'mujer trans', label: 'Mujer trans' },
    { value: 'varon', label: 'Varón' },
    { value: 'varon trans', label: 'Varón trans' },
    { value: 'no binario', label: 'No binario' },
    { value: 'travesti', label: 'Travesti' },
    { value: 'masculinidad trans', label: 'Masculinidad trans' },
];

export function normalizeGenderValue(value?: string | null): string {
    const normalized = (value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    if (normalized === 'femenino') { return 'mujer'; }
    if (normalized === 'masculino') { return 'varon'; }
    if (normalized === 'ninguno' || normalized === 'ninguna' || normalized === 'none') { return ''; }
    return normalized;
}

export function patientGenderLabel(value?: string | null): string {
    const normalized = normalizeGenderValue(value);
    if (!normalized) { return '—'; }

    const option = PATIENT_GENDER_OPTIONS.find((item) => item.value === normalized);
    if (option) { return option.label; }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function genderOptionsWithCurrent(current?: string | null): PatientGenderOption[] {
    const normalized = normalizeGenderValue(current);
    const options = [...PATIENT_GENDER_OPTIONS];
    if (!normalized || PATIENT_GENDER_OPTIONS.some((option) => option.value === normalized)) {
        return options;
    }

    return [
        ...options,
        { value: normalized, label: patientGenderLabel(normalized) },
    ];
}
