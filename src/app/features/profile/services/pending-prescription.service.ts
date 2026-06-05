import { Injectable } from '@angular/core';
import { PendingPrescription } from '../models/security-pin.model';

@Injectable({
    providedIn: 'root'
})
export class PendingPrescriptionService {
    private readonly STORAGE_KEY = 'pending_prescription';
    private readonly EXPIRATION_HOURS = 24;

    saveDraft(payload: unknown): void {
        const pending: PendingPrescription = {
            payload,
            savedAt: new Date().toISOString(),
            attemptCount: 0
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pending));
    }

    getDraft(): PendingPrescription | null {
        const draft = localStorage.getItem(this.STORAGE_KEY);
        if (!draft) {
            return null;
        }

        const pending: PendingPrescription = JSON.parse(draft);

        const hoursSinceSaved = (Date.now() - new Date(pending.savedAt).getTime()) / 3600000;
        if (hoursSinceSaved > this.EXPIRATION_HOURS) {
            this.clearDraft();
            return null;
        }

        return pending;
    }

    incrementAttempts(): void {
        const pending = this.getDraft();
        if (pending) {
            pending.attemptCount++;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pending));
        }
    }

    clearDraft(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    hasDraft(): boolean {
        return this.getDraft() !== null;
    }
}
