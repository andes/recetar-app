import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Patient } from '@interfaces/patients';
import { MedicationItem, PrescriptionDraft } from '../models/prescription-draft';

@Injectable({
    providedIn: 'root'
})
export class PrescriptionDraftService {
    private draft: PrescriptionDraft = { patient: null, medications: [] };
    private draftSubject = new BehaviorSubject<PrescriptionDraft>(this.draft);

    get draft$(): Observable<PrescriptionDraft> {
        return this.draftSubject.asObservable();
    }

    get snapshot(): PrescriptionDraft {
        return { ...this.draft, medications: [...this.draft.medications] };
    }

    setPatient(patient: Patient): void {
        this.draft = { ...this.draft, patient };
        this.draftSubject.next(this.draft);
    }

    clearPatient(): void {
        this.draft = { patient: null, medications: [] };
        this.draftSubject.next(this.draft);
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

    reset(): void {
        this.draft = { patient: null, medications: [] };
        this.draftSubject.next(this.draft);
    }
}
