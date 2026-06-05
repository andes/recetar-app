import { Patient } from '@interfaces/patients';
import { VademecumEntry } from '@interfaces/vademecum';
import SnomedConcept from '@interfaces/snomedConcept';

export type DocumentType = 'prescription' | 'certificate' | 'practice';

export interface MedicationItem {
    supply?: VademecumEntry;
    snomedConcept?: SnomedConcept;
    quantity: number;
    packageQuantity: number;
    diagnostic: string;
    indication: string;
    duplicate: boolean;
    triplicate: boolean;
    serie: string;
    numero: string;
}

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
}

export type PrescriptionItemResult =
    | { kind: 'commercial'; entry: VademecumEntry }
    | { kind: 'generic'; concept: SnomedConcept };

export interface FrequentMedication {
    id: string;
    kind: 'commercial' | 'generic';
    name: string;
    presentation: string;
    price: number;
    actionDesc: string;
    supplyId?: number;
    code?: string;
    snomedConcept?: SnomedConcept;
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
