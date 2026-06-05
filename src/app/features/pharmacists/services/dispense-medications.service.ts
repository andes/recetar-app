import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, timer, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface MedicationPrescriptionRef {
    code: string;
    patient: string;
    date: string;
    quantity: number;
}

export interface MedicationSummary {
    name: string;
    count: number;
    sources: {
        recetar: number;
        andes: number;
    };
    status: string;
    lastPrescriptions: MedicationPrescriptionRef[];
}

export interface MedicationsSummaryResponse {
    medications: MedicationSummary[];
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class DispenseMedicationsService implements OnDestroy {

    private destroy$ = new Subject<void>();
    private autoRefresh$ = timer(REFRESH_INTERVAL_MS, REFRESH_INTERVAL_MS).pipe(takeUntil(this.destroy$));

    private loadingSubject = new BehaviorSubject<boolean>(false);
    readonly loading$ = this.loadingSubject.asObservable();

    private medicationsSubject = new BehaviorSubject<MedicationSummary[]>([]);
    readonly medications$ = this.medicationsSubject.asObservable();

    constructor(private http: HttpClient) {
        this.autoRefresh$.subscribe(() => this.load());
    }

    load(dateFrom?: string, dateTo?: string): void {
        this.loadingSubject.next(true);

        let params = new HttpParams();
        if (dateFrom) { params = params.set('dateFrom', dateFrom); }
        if (dateTo) { params = params.set('dateTo', dateTo); }

        // TODO: backend endpoint /prescriptions/medications-summary aún no existe
        this.http.get<MedicationsSummaryResponse>(
            `${environment.API_END_POINT}/prescriptions/medications-summary`,
            { params },
        ).pipe(
            takeUntil(this.destroy$),
            catchError(() => {
                this.loadingSubject.next(false);
                return of({ medications: [] as MedicationSummary[] });
            }),
        ).subscribe(response => {
            this.medicationsSubject.next(response.medications);
            this.loadingSubject.next(false);
        });
    }

    refresh(): void {
        this.load();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
