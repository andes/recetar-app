import { Patient } from '@interfaces/patients';
import { SubOrganization } from '@interfaces/organizations';
import { MedicationItem } from '@shared/models/medication.types';

// Re-export shared medication types
export { PrescriptionItemResult, FrequentMedication } from '@shared/models/medication.types';
export { MedicationItem };

export type DocumentType = 'prescription' | 'certificate' | 'practice';

export interface CertificateFormData {
    certificate: string;
    startDate: Date;
    cantDias: number;
}

export interface PracticeFormData {
    practice: string;
    diagnostic: string;
    indications: string;
}

export interface DocumentDraft {
    type: DocumentType;
    patient: Patient | null;
    medications: MedicationItem[];
    certificateData: CertificateFormData | null;
    practiceData: PracticeFormData | null;
    organizacion?: SubOrganization;
}

export interface FrequentPatient {
    id: string;
    firstName: string;
    lastName: string;
    initials: string;
    insurance: string;
    dni: string;
    sex: string;
    fechaNac: string;
    nombreAutopercibido: string;
    status: string;
}

export interface RecentDocuments {
    prescriptions: import('@interfaces/prescriptions').Prescriptions[];
    certificates: import('@interfaces/certificate').Certificate[];
    practices: import('@interfaces/practices').Practice[];
}
