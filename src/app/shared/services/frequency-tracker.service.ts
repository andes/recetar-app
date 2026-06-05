import { Injectable } from '@angular/core';

export interface FrequentRecord {
    key: string;
    count: number;
    lastUsed: string;
    data: Record<string, unknown>;
}

const STORAGE_PREFIX = 'app_freq_';

@Injectable({
    providedIn: 'root'
})
export class FrequencyTrackerService {
    recordUsage(domain: string, key: string, data: Record<string, unknown>): void {
        const records = this.getRecords(domain);
        const existing = records.find(r => r.key === key);

        if (existing) {
            existing.count++;
            existing.lastUsed = new Date().toISOString();
            existing.data = data;
        } else {
            records.push({ key, count: 1, lastUsed: new Date().toISOString(), data });
        }

        this.saveRecords(domain, records);
    }

    getTopFrequent(domain: string, max: number = 6): FrequentRecord[] {
        const records = this.getRecords(domain);
        return records
            .sort((a, b) => b.count - a.count || new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
            .slice(0, max);
    }

    clearDomain(domain: string): void {
        localStorage.removeItem(STORAGE_PREFIX + domain);
    }

    private getRecords(domain: string): FrequentRecord[] {
        try {
            const stored = localStorage.getItem(STORAGE_PREFIX + domain);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    private saveRecords(domain: string, records: FrequentRecord[]): void {
        try {
            localStorage.setItem(STORAGE_PREFIX + domain, JSON.stringify(records));
        } catch {
            // localStorage might be full or unavailable
        }
    }
}
