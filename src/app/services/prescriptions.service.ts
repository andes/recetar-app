import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, of, timer } from 'rxjs';
import { Prescriptions, PrescriptionsAdapter, PrescriptionsResponse } from '../interfaces/prescriptions';
import { tap, mapTo, map, switchMap, takeUntil } from 'rxjs/operators';

import { AmbitoService } from '../auth/services/ambito.service';
import AndesPrescriptions from '@interfaces/andesPrescriptions';

@Injectable({
    providedIn: 'root'
})
export class PrescriptionsService {

    private myPrescriptions: BehaviorSubject<Prescriptions[]>;
    private prescriptionsArray: Prescriptions[] = [];
    private cancelSearch$ = new Subject<void>();

    constructor(
        private http: HttpClient,
        private ambitoService: AmbitoService,
        private prescriptionsAdapter: PrescriptionsAdapter
    ) {
        this.myPrescriptions = new BehaviorSubject<Prescriptions[]>(this.prescriptionsArray);
    }

    private isAndesPrescription(item: Prescriptions | AndesPrescriptions): item is AndesPrescriptions {
        return 'paciente' in item && !('patient' in item);
    }

    private adaptPrescription(item: Prescriptions | AndesPrescriptions): Prescriptions | AndesPrescriptions {
        if (this.isAndesPrescription(item)) {
            return item;
        }

        return this.prescriptionsAdapter.adapt(item);
    }

    private adaptPrescriptionList(list: Array<Prescriptions | AndesPrescriptions>): Array<Prescriptions | AndesPrescriptions> {
        return list.map((prescription) => this.adaptPrescription(prescription));
    }

    getPrescriptions(params): Observable<boolean> {
        if (params?.dispensedBy) {
            const cuil = params.dispensedBy;
            return this.http.get<{ prescriptions: Prescriptions[]; total: number }>(
                `${environment.API_END_POINT}/prescriptions/dispensed-by/${cuil}`
            ).pipe(
                map((response) => response.prescriptions.map((prescription) => this.prescriptionsAdapter.adapt(prescription))),
                tap((prescriptions: Prescriptions[]) => this.setPrescriptions(prescriptions)),
                map((prescriptions: Prescriptions[]) => prescriptions.length > 0)
            );
        }
        return this.http.get<{ prescriptions: Prescriptions[]; total: number }>(`${environment.API_END_POINT}/prescriptions`, { params }).pipe(
            map((response) => response.prescriptions.map((prescription) => this.prescriptionsAdapter.adapt(prescription))),
            tap((prescriptions: Prescriptions[]) => this.setPrescriptions(prescriptions)),
            map((prescriptions: Prescriptions[]) => prescriptions.length > 0)
        );
    }

    getById(id: string): Observable<Prescriptions> {
        return this.http.get<Prescriptions>(`${environment.API_END_POINT}/prescriptions/${id}`).pipe(
            map((prescription) => this.prescriptionsAdapter.adapt(prescription))
        );
    }

    dispense(prescriptionId: string, pharmacistId: string): Observable<boolean> {
        const params = { 'prescriptionId': prescriptionId, 'pharmacistId': pharmacistId };
        return this.http.patch<Prescriptions>(`${environment.API_END_POINT}/prescriptions/${params.prescriptionId}/dispense`, params).pipe(
            map((updatedPrescription: Prescriptions) => this.prescriptionsAdapter.adapt(updatedPrescription)),
            tap((updatedPrescription: Prescriptions) => this.updatePrescription(updatedPrescription)),
            mapTo(true)
        );
    }

    cancelDispense(prescriptionId: string, pharmacistId: string): Observable<boolean> {
        const params = { 'prescriptionId': prescriptionId, 'pharmacistId': pharmacistId };
        return this.http.patch<Prescriptions>(`${environment.API_END_POINT}/prescriptions/${params.prescriptionId}/cancel-dispense`, params).pipe(
            map((updatedPrescription: Prescriptions) => this.prescriptionsAdapter.adapt(updatedPrescription)),
            tap((updatedPrescription: Prescriptions) => this.updatePrescription(updatedPrescription)),
            mapTo(true)
        );
    }

    // Método para obtener prescripciones con filtros (retorna recetas combinadas de Andes y locales)
    getPrescriptionsWithFiltersDirect(patient_dni: string, filters?: { status?: string; dateFrom?: string; dateTo?: string; sexo?: string }): Observable<Prescriptions[]> {
        let url = `${environment.API_END_POINT}/prescriptions/find/${patient_dni}`;
        const queryParams: string[] = [];

        if (filters) {
            if (filters.status) {
                queryParams.push(`status=${filters.status}`);
            }
            if (filters.dateFrom) {
                queryParams.push(`startDate=${filters.dateFrom}`);
            }
            if (filters.dateTo) {
                queryParams.push(`endDate=${filters.dateTo}`);
            }
            if (filters.sexo) {
                queryParams.push(`sexo=${filters.sexo}`);
            }
        }

        if (queryParams.length > 0) {
            url += `?${queryParams.join('&')}`;
        }

        return this.http.get<{ prescriptions: Prescriptions[]; total: number }>(url).pipe(
            map((response) => this.adaptPrescriptionList(response.prescriptions as Array<Prescriptions | AndesPrescriptions>) as Prescriptions[]),
            tap((prescriptions: Prescriptions[]) => this.setPrescriptions(prescriptions))
        );
    }

    getByUserId(userId: string, params?: { offset?: number; limit?: number }): Observable<PrescriptionsResponse> {
        const queryParams = {
            ...(params || {}),
            ambito: this.ambitoService.getAmbito() || 'privado'
        };
        return this.http.get<PrescriptionsResponse>(`${environment.API_END_POINT}/prescriptions/user/${userId}`, { params: queryParams }).pipe(
            map((response) => ({
                ...response,
                prescriptions: this.adaptPrescriptionList(response.prescriptions)
            })),
            tap((response) => this.setPrescriptions(response.prescriptions as Prescriptions[]))
        );
    }

    searchByTerm(userId: string, params?: { searchTerm?: string; offset?: number; limit?: number }): Observable<PrescriptionsResponse> {
        const queryParams = {
            ...(params || {}),
            ambito: this.ambitoService.getAmbito() || 'privado'
        };
        const searchTerm = queryParams.searchTerm || '';

        // Verificar que haya al menos 3 caracteres para buscar
        if (searchTerm && searchTerm.length < 3) {
            return of({
                prescriptions: [],
                total: 0,
                offset: queryParams.offset || 0,
                limit: queryParams.limit || 10,
                sources: { local: 0, andes: 0 }
            });
        }

        this.cancelSearch$.next();

        return timer(500).pipe(
            takeUntil(this.cancelSearch$),
            switchMap(() => this.http.get<PrescriptionsResponse>(
                `${environment.API_END_POINT}/prescriptions/user/${userId}/search`,
                { params: queryParams }
            )),
            map((response) => ({
                ...response,
                prescriptions: this.adaptPrescriptionList(response.prescriptions)
            })),
            tap((response) => this.setPrescriptions(response.prescriptions as Prescriptions[]))
        );
    }

    newPrescription(prescription: Prescriptions): Observable<Boolean> {
        return this.http.post<Prescriptions>(`${environment.API_END_POINT}/prescriptions`, prescription).pipe(
            map((newPrescriptionItem: Prescriptions) => this.prescriptionsAdapter.adapt(newPrescriptionItem)),
            tap((newPrescriptionItem: Prescriptions) => this.addPrescription([newPrescriptionItem])),
            mapTo(true)
        );
    }

    editPrescription(prescription: Prescriptions): Observable<Boolean> {
        return this.http.patch<Prescriptions>(`${environment.API_END_POINT}/prescriptions/${prescription._id}`, prescription).pipe(
            map((updatedPrescription: Prescriptions) => this.prescriptionsAdapter.adapt(updatedPrescription)),
            tap((updatedPrescription: Prescriptions) => this.updatePrescription(updatedPrescription)),
            mapTo(true)
        );
    }

    deletePrescription(prescriptionId: string): Observable<Boolean> {
        return this.http.delete<Prescriptions>(`${environment.API_END_POINT}/prescriptions/${prescriptionId}`).pipe(
            tap(() => this.removePrescription(prescriptionId)),
            mapTo(true)
        );
    }

    cleanPrescriptions(): void {
        this.prescriptionsArray = [];
        this.myPrescriptions.next(this.prescriptionsArray);
    }

    private setPrescriptions(prescriptions: Prescriptions[]) {
        this.prescriptionsArray = prescriptions;
        this.myPrescriptions.next(prescriptions);
    }


    private addPrescription(prescriptions: Prescriptions[]) {
        this.prescriptionsArray.unshift(...prescriptions);
        this.myPrescriptions.next(this.prescriptionsArray);
    }

    private removePrescription(removedPrescription: string) {
        const removeIndex = this.prescriptionsArray.findIndex((prescription: Prescriptions) => prescription._id === removedPrescription);

        this.prescriptionsArray.splice(removeIndex, 1);
        this.myPrescriptions.next(this.prescriptionsArray);
    }

    private updatePrescription(updatedPrescription: Prescriptions) {
        const updateIndex = this.prescriptionsArray.findIndex((prescription: Prescriptions) => prescription._id === updatedPrescription._id);
        this.prescriptionsArray.splice(updateIndex, 1, updatedPrescription);
        this.myPrescriptions.next(this.prescriptionsArray);
    }

    get prescriptions(): Observable<Prescriptions[]> {
        return this.myPrescriptions.asObservable();
    }
}
