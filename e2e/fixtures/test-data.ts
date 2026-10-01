import fs from 'node:fs';
import path from 'node:path';

function loadEnvFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
        return;
    }

    for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) {
            continue;
        }

        const separator = line.indexOf('=');
        if (separator <= 0) {
            continue;
        }

        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
        if (key && process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

loadEnvFile(path.resolve(process.cwd(), '.env.e2e'));

export type E2ERole =
    | 'professional'
    | 'pharmacist'
    | 'auditor'
    | 'admin'
    | 'pin';

export interface RoleCredentials {
    username: string;
    password: string;
}

const ROLE_ENV_SUFFIX: Record<E2ERole, string> = {
    professional: 'PROFESSIONAL',
    pharmacist: 'PHARMACIST',
    auditor: 'AUDITOR',
    admin: 'ADMIN',
    pin: 'PIN'
};

export const E2E_ROLES: E2ERole[] = [
    'professional',
    'pharmacist',
    'auditor',
    'admin',
    'pin'
];

export function credentialsFor(role: E2ERole): RoleCredentials | null {
    const suffix = ROLE_ENV_SUFFIX[role];
    const username = process.env[`E2E_USER_${suffix}`];
    const password = process.env[`E2E_PASS_${suffix}`];

    if (!username || !password) {
        return null;
    }

    return { username, password };
}

export function hasCredentials(role: E2ERole): boolean {
    return credentialsFor(role) !== null;
}

export function statePath(role: E2ERole): string {
    return path.resolve(process.cwd(), 'e2e', '.auth', `${role}.json`);
}

export const baseURL = process.env.E2E_BASE_URL || 'http://localhost:4200';
export const apiURL = (process.env.E2E_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
export const baseOrigin = new URL(baseURL).origin;
export const mutationsEnabled = process.env.E2E_SKIP_MUTATIONS !== '1';
export const defaultAmbito = process.env.E2E_DEFAULT_AMBITO === 'privado' ? 'privado' : 'publico';
export const renaperEnabled = process.env.E2E_RENAPER_ENABLED === '1';

export const testData = {
    patient: {
        dni: process.env.E2E_PATIENT_DNI || '39128595',
        sex: process.env.E2E_PATIENT_SEX || 'Masculino'
    },
    renaper: {
        positiveDni: process.env.E2E_RENAPER_POSITIVE_DNI || '32056974',
        positiveSex: process.env.E2E_RENAPER_POSITIVE_SEX || 'Masculino',
        negativeDni: process.env.E2E_RENAPER_NEGATIVE_DNI || '32056975',
        negativeSex: process.env.E2E_RENAPER_NEGATIVE_SEX || 'Masculino'
    },
    patientWithoutDni: {
        firstName: process.env.E2E_PATIENT_TEMP_FIRST_NAME || 'Paciente',
        lastName: process.env.E2E_PATIENT_TEMP_LAST_NAME || `Temporal ${uniqueSuffix()}`,
        sex: process.env.E2E_PATIENT_TEMP_SEX || 'Otro'
    },
    medicationQuery: process.env.E2E_MEDICATION_QUERY || 'ibuprofeno',
    medicationQueryAlternative: process.env.E2E_MEDICATION_QUERY_ALT || 'paracetamol',
    medicationQueryWithoutResults: process.env.E2E_MEDICATION_QUERY_EMPTY || 'zzzzsinresultados',
    pharmacyCuil: process.env.E2E_PHARMACY_CUIL || '27226637724',
    organizationPublicName: process.env.E2E_ORG_PUBLIC_NAME || '',
    organizationPrivateName: process.env.E2E_ORG_PRIVATE_NAME || '',
    pin: process.env.E2E_PIN_VALUE || '1234',
    wrongPin: process.env.E2E_WRONG_PIN_VALUE || '0000',
    certificateText: process.env.E2E_CERTIFICATE_TEXT || `Certificado E2E ${uniqueSuffix()}`,
    practiceName: process.env.E2E_PRACTICE_NAME || `Práctica E2E ${uniqueSuffix()}`,
    practiceDiagnostic: process.env.E2E_PRACTICE_DIAGNOSTIC || 'Diagnóstico de prueba E2E',
    indication: process.env.E2E_INDICATION || 'Indicación de prueba E2E',
    diagnostic: process.env.E2E_DIAGNOSTIC || 'Diagnóstico de prueba E2E'
};

export function uniqueSuffix(): string {
    // Evitar guiones: la búsqueda de ANDES no encuentra nombres que los contienen.
    return `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

export function uniqueLabel(prefix: string): string {
    return `${prefix} ${uniqueSuffix()}`;
}

export function getPatientId(patient: Record<string, unknown>): string {
    return String(patient.idMPI || patient._id || patient.id || '');
}

export function todayForDateField(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${now.getFullYear()}`;
}
