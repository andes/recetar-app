import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Patient } from '@interfaces/patients';
import { SubOrganization } from '@interfaces/organizations';
import {
    MedicationItem,
    DocumentDraft,
    DocumentType,
    CertificateFormData,
    PracticeFormData,
    RecentDocuments,
} from '../models/prescription-draft';

@Injectable({
    providedIn: 'root'
})
export class PrescriptionDraftService {
    private draft: DocumentDraft = {
        type: 'prescription',
        patient: null,
        medications: [],
        certificateData: null,
        practiceData: null,
        organizacion: undefined,
    };
    private draftSubject = new BehaviorSubject<DocumentDraft>(this.draft);

    private recentDocs: RecentDocuments = { prescriptions: [], certificates: [], practices: [] };
    private recentDocsSubject = new BehaviorSubject<RecentDocuments>(this.recentDocs);

    get draft$(): Observable<DocumentDraft> {
        return this.draftSubject.asObservable();
    }

    get recentDocuments$(): Observable<RecentDocuments> {
        return this.recentDocsSubject.asObservable();
    }

    get recentDocumentsSnapshot(): RecentDocuments {
        return this.recentDocs;
    }

    get snapshot(): DocumentDraft {
        return {
            ...this.draft,
            medications: [...this.draft.medications],
        };
    }

    setRecentDocuments(docs: RecentDocuments): void {
        this.recentDocs = docs;
        this.recentDocsSubject.next(this.recentDocs);
    }

    setType(type: DocumentType): void {
        this.draft = { ...this.draft, type };
        this.draftSubject.next(this.draft);
    }

    setPatient(patient: Patient): void {
        this.draft = { ...this.draft, patient };
        this.draftSubject.next(this.draft);
    }

    clearPatient(): void {
        this.draft = { type: 'prescription', patient: null, medications: [], certificateData: null, practiceData: null, organizacion: undefined };
        this.draftSubject.next(this.draft);
        this.recentDocs = { prescriptions: [], certificates: [], practices: [] };
        this.recentDocsSubject.next(this.recentDocs);
    }

    addMedication(item: MedicationItem): void {
        this.draft = { ...this.draft, medications: [...this.draft.medications, item] };
        this.draftSubject.next(this.draft);
    }

    updateMedication(index: number, changes: Partial<MedicationItem>): void {
        const meds = [...this.draft.medications];
        if (meds[index]) {
            meds[index] = { ...meds[index], ...changes };
            this.draft = { ...this.draft, medications: meds };
            this.draftSubject.next(this.draft);
        }
    }

    removeMedication(index: number): void {
        const meds = [...this.draft.medications];
        meds.splice(index, 1);
        this.draft = { ...this.draft, medications: meds };
        this.draftSubject.next(this.draft);
    }

    replaceMedication(index: number, item: MedicationItem): void {
        const meds = [...this.draft.medications];
        if (meds[index]) {
            meds[index] = item;
            this.draft = { ...this.draft, medications: meds };
            this.draftSubject.next(this.draft);
        }
    }

    setMedications(items: MedicationItem[]): void {
        this.draft = { ...this.draft, medications: [...items] };
        this.draftSubject.next(this.draft);
    }

    setCertificateData(data: CertificateFormData | null): void {
        this.draft = { ...this.draft, certificateData: data };
        this.draftSubject.next(this.draft);
    }

    setPracticeData(data: PracticeFormData | null): void {
        this.draft = { ...this.draft, practiceData: data };
        this.draftSubject.next(this.draft);
    }

    setOrganizacion(org: SubOrganization | undefined): void {
        this.draft = { ...this.draft, organizacion: org };
        this.draftSubject.next(this.draft);
    }

    reset(): void {
        this.draft = { type: 'prescription', patient: null, medications: [], certificateData: null, practiceData: null, organizacion: undefined };
        this.draftSubject.next(this.draft);
        this.recentDocs = { prescriptions: [], certificates: [], practices: [] };
        this.recentDocsSubject.next(this.recentDocs);
    }
}
