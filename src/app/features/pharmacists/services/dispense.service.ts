import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, timer, of } from 'rxjs';
import {
    map, switchMap, takeUntil, catchError, tap, filter, distinctUntilChanged,
} from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Prescriptions } from '@interfaces/prescriptions';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { PrescriptionsService } from '@services/prescriptions.service';
import { AndesPrescriptionsService } from '@services/andesPrescription.service';
import { AuthService } from '@auth/services/auth.service';
import { PrescriptionsAdapter } from '@interfaces/prescriptions';
import { AndesPrescriptionsAdapter } from '@interfaces/andesPrescriptions';

export type MixedPrescription = Prescriptions | AndesPrescriptions;

export interface DispenseFilters {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
    offset?: number;
    limit?: number;
}

export interface DispenseListResponse {
    prescriptions: MixedPrescription[];
    total: number;
    offset: number;
    limit: number;
    sources: {
        local: number;
        andes: number;
    };
}

export interface DispenseResult {
    success: boolean;
    errorMessage?: string;
}

const DEFAULT_LIMIT = 20;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class DispenseService implements OnDestroy {

    private refreshTrigger$ = new Subject<void>();
    private destroy$ = new Subject<void>();
    private autoRefresh$ = timer(0, REFRESH_INTERVAL_MS).pipe(takeUntil(this.destroy$));

    private loadingSubject = new BehaviorSubject<boolean>(false);
    readonly loading$ = this.loadingSubject.asObservable();

    private prescriptionsSubject = new BehaviorSubject<MixedPrescription[]>([]);
    readonly prescriptions$ = this.prescriptionsSubject.asObservable();

    private totalSubject = new BehaviorSubject<number>(0);
    readonly total$ = this.totalSubject.asObservable();

    private sourcesSubject = new BehaviorSubject<{ local: number; andes: number }>({ local: 0, andes: 0 });
    readonly sources$ = this.sourcesSubject.asObservable();

    private filters: DispenseFilters = { limit: DEFAULT_LIMIT, offset: 0 };

    constructor(
        private http: HttpClient,
        private prescriptionsService: PrescriptionsService,
        private andesPrescriptionsService: AndesPrescriptionsService,
        private authService: AuthService,
        private prescriptionsAdapter: PrescriptionsAdapter,
        private andesPrescriptionsAdapter: AndesPrescriptionsAdapter,
    ) {
        this.autoRefresh$.subscribe(() => this.load(this.filters));
        this.refreshTrigger$.pipe(
            takeUntil(this.destroy$),
        ).subscribe(() => this.load(this.filters));
    }

    load(filters: DispenseFilters): void {
        this.filters = { ...this.filters, ...filters };
        this.loadingSubject.next(true);

        const { searchTerm, status, dateFrom, dateTo, offset = 0, limit = DEFAULT_LIMIT } = this.filters;

        let request$: Observable<DispenseListResponse>;

        if (searchTerm && /^\d{6,8}$/.test(searchTerm)) {
            request$ = this.loadByDni(searchTerm, { status, dateFrom, dateTo, offset, limit });
        } else {
            request$ = this.loadGeneric({ status, dateFrom, dateTo, offset, limit, searchTerm });
        }

        request$.pipe(
            takeUntil(this.refreshTrigger$.pipe(takeUntil(this.destroy$))),
            catchError(() => of({
                prescriptions: [] as MixedPrescription[],
                total: 0,
                offset: 0,
                limit: DEFAULT_LIMIT,
                sources: { local: 0, andes: 0 },
            })),
        ).subscribe({
            next: (response) => {
                this.prescriptionsSubject.next(response.prescriptions);
                this.totalSubject.next(response.total);
                this.sourcesSubject.next(response.sources);
                this.loadingSubject.next(false);
            },
            error: () => {
                this.loadingSubject.next(false);
            },
        });
    }

    refresh(): void {
        this.refreshTrigger$.next();
    }

    setFilters(filters: Partial<DispenseFilters>): void {
        this.load(filters);
    }

    dispense(prescription: MixedPrescription): Observable<DispenseResult> {
        const pharmacistId = this.authService.getLoggedUserId();

        if (this.isAndesPrescription(prescription)) {
            return this.andesPrescriptionsService.dispense(prescription, pharmacistId).pipe(
                map(() => ({ success: true })),
                catchError((error: unknown) => of({
                    success: false,
                    errorMessage: this.extractErrorMessage(error),
                })),
                tap((result) => { if (result.success) { this.upsertPrescription(prescription); } }),
            );
        }

        return this.prescriptionsService.dispense(prescription._id, pharmacistId).pipe(
            switchMap(() => this.prescriptionsService.getById(prescription._id)),
            map((updated) => {
                this.upsertPrescription(updated);
                return { success: true };
            }),
            catchError((error: unknown) => of({
                success: false,
                errorMessage: this.extractErrorMessage(error),
            })),
        );
    }

    cancelDispense(prescription: MixedPrescription): Observable<DispenseResult> {
        const pharmacistId = this.authService.getLoggedUserId();

        if (this.isAndesPrescription(prescription)) {
            return this.andesPrescriptionsService.cancelDispense(prescription._id, pharmacistId).pipe(
                map(() => ({ success: true })),
                catchError((error: unknown) => of({
                    success: false,
                    errorMessage: this.extractErrorMessage(error),
                })),
                tap((result) => { if (result.success) { this.upsertPrescription(prescription); } }),
            );
        }

        return this.prescriptionsService.cancelDispense(prescription._id, pharmacistId).pipe(
            switchMap(() => this.prescriptionsService.getById(prescription._id)),
            map((updated) => {
                this.upsertPrescription(updated);
                return { success: true };
            }),
            catchError((error: unknown) => of({
                success: false,
                errorMessage: this.extractErrorMessage(error),
            })),
        );
    }

    isAndesPrescription(p: MixedPrescription): p is AndesPrescriptions {
        return 'estadoActual' in p;
    }

    getPrescriptionDate(p: MixedPrescription): Date {
        return this.isAndesPrescription(p)
            ? new Date(p.fechaRegistro || p.fechaPrestacion || Date.now())
            : new Date(p.date);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadByDni(dni: string, filters: {
        status?: string;
        dateFrom?: string;
        dateTo?: string;
        offset?: number;
        limit?: number;
    }): Observable<DispenseListResponse> {
        let params = new HttpParams()
            .set('offset', filters.offset ?? 0)
            .set('limit', filters.limit ?? DEFAULT_LIMIT);

        if (filters.status && filters.status !== 'todas') {
            params = params.set('status', filters.status);
        }
        if (filters.dateFrom) {
            params = params.set('dateFrom', filters.dateFrom);
        }
        if (filters.dateTo) {
            params = params.set('dateTo', filters.dateTo);
        }

        return this.http.get<{
            prescriptions: (Prescriptions | AndesPrescriptions)[];
            total: number;
        }>(`${environment.API_END_POINT}/prescriptions/find/${dni}`, { params }).pipe(
            map((response) => ({
                prescriptions: this.adaptMixedList(response.prescriptions),
                total: response.total || response.prescriptions.length,
                offset: filters.offset ?? 0,
                limit: filters.limit ?? DEFAULT_LIMIT,
                sources: this.countSources(response.prescriptions),
            })),
        );
    }

    private loadGeneric(filters: {
        status?: string;
        dateFrom?: string;
        dateTo?: string;
        offset?: number;
        limit?: number;
        searchTerm?: string;
    }): Observable<DispenseListResponse> {
        let params = new HttpParams()
            .set('offset', filters.offset ?? 0)
            .set('limit', filters.limit ?? DEFAULT_LIMIT);

        if (filters.status && filters.status !== 'todas') {
            params = params.set('status', filters.status);
        }
        if (filters.dateFrom) {
            params = params.set('dateFrom', filters.dateFrom);
        }
        if (filters.dateTo) {
            params = params.set('dateTo', filters.dateTo);
        }
        if (filters.searchTerm && !/^\d{6,8}$/.test(filters.searchTerm)) {
            params = params.set('searchTerm', filters.searchTerm);
        }

        return this.http.get<{
            prescriptions: (Prescriptions | AndesPrescriptions)[];
            total: number;
        }>(`${environment.API_END_POINT}/prescriptions`, { params }).pipe(
            map((response) => ({
                prescriptions: this.adaptMixedList(response.prescriptions),
                total: response.total || response.prescriptions.length,
                offset: filters.offset ?? 0,
                limit: filters.limit ?? DEFAULT_LIMIT,
                sources: this.countSources(response.prescriptions),
            })),
        );
    }

    private adaptMixedList(items: (Prescriptions | AndesPrescriptions)[]): MixedPrescription[] {
        return items.map((item) => {
            if (this.isAndesPrescription(item)) {
                return this.andesPrescriptionsAdapter.adapt(item);
            }
            return this.prescriptionsAdapter.adapt(item);
        });
    }

    private countSources(items: (Prescriptions | AndesPrescriptions)[]): { local: number; andes: number } {
        let local = 0;
        let andes = 0;
        for (const item of items) {
            if (this.isAndesPrescription(item)) {
                andes++;
            } else {
                local++;
            }
        }
        return { local, andes };
    }

    private upsertPrescription(updated: MixedPrescription): void {
        const current = this.prescriptionsSubject.value;
        const idx = current.findIndex((p) => p._id === updated._id);
        if (idx >= 0) {
            const copy = [...current];
            copy[idx] = updated;
            this.prescriptionsSubject.next(copy);
        }
    }

    private extractErrorMessage(error: unknown): string {
        if (error && typeof error === 'object' && 'error' in error) {
            const err = error as Record<string, unknown>;
            const e = err.error;
            if (e && typeof e === 'object') {
                const inner = e as Record<string, unknown>;
                return String(inner.mensaje || inner.message || 'Error desconocido');
            }
        }
        if (error && typeof error === 'object' && 'message' in error) {
            return String((error as Record<string, unknown>).message);
        }
        return 'Error desconocido';
    }
}
