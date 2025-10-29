import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { Prescriptions, PrescriptionsResponse } from '../interfaces/prescriptions';
import { tap, mapTo, map } from 'rxjs/operators';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
import { AmbitoService } from '../auth/services/ambito.service';

@Injectable({
    providedIn: 'root'
})
export class PrescriptionsService {

    private myPrescriptions: BehaviorSubject<Prescriptions[]>;
    private prescriptionsArray: Prescriptions[] = [];
    private searchTimeout: any = null;
    private searchSubscription: any = null;

    constructor(private http: HttpClient, private ambitoService: AmbitoService) {
        this.myPrescriptions = new BehaviorSubject<Prescriptions[]>(this.prescriptionsArray);
    }

    getPrescriptions(params): Observable<boolean> {
        return this.http.get(`${environment.API_END_POINT}/prescriptions`, { params }).pipe(
            tap((prescriptions: Prescriptions[]) => this.setPrescriptions(prescriptions)),
            map((prescriptions: Prescriptions[]) => prescriptions.length > 0)
        );
    }

    getById(id: string): Observable<Prescriptions> {
        return this.http.get<Prescriptions>(`${environment.API_END_POINT}/prescriptions/${id}`);
    }

    dispense(prescriptionId: string, pharmacistId: string): Observable<boolean> {
        const params = { 'prescriptionId': prescriptionId, 'pharmacistId': pharmacistId };
        return this.http.patch<Prescriptions>(`${environment.API_END_POINT}/prescriptions/${params.prescriptionId}/dispense`, params).pipe(
            tap((updatedPrescription: Prescriptions) => this.updatePrescription(updatedPrescription)),
            mapTo(true)
        );
    }

    cancelDispense(prescriptionId: string, pharmacistId: string): Observable<boolean> {
        const params = { 'prescriptionId': prescriptionId, 'pharmacistId': pharmacistId };
        return this.http.patch<Prescriptions>(`${environment.API_END_POINT}/prescriptions/${params.prescriptionId}/cancel-dispense`, params).pipe(
            tap((updatedPrescription: Prescriptions) => this.updatePrescription(updatedPrescription)),
            mapTo(true)
        );
    }

    getFromDniAndDate(params: { patient_dni: string; dateFilter: string }): Observable<boolean> {
        return this.http.get<Prescriptions[]>(`${environment.API_END_POINT}/prescriptions/find/${params.patient_dni}?${params.dateFilter}`).pipe(
            tap((prescriptions: Prescriptions[]) => this.setPrescriptions(prescriptions)),
            map((prescriptions: Prescriptions[]) => prescriptions.length > 0)
        );
    }

    // Nuevo método para obtener prescripciones con filtros
    getPrescriptionsWithFilters(patient_dni: string, filters?: { status?: string; dateFrom?: string; dateTo?: string }): Observable<boolean> {
        let url = `${environment.API_END_POINT}/prescriptions/find/${patient_dni}`;
        const queryParams: string[] = [];

        if (filters) {
            if (filters.status) {
                queryParams.push(`status=${filters.status}`);
            }
            if (filters.dateFrom) {
                queryParams.push(`dateFrom=${filters.dateFrom}`);
            }
            if (filters.dateTo) {
                queryParams.push(`dateTo=${filters.dateTo}`);
            }
        }

        if (queryParams.length > 0) {
            url += `?${queryParams.join('&')}`;
        }

        return this.http.get<Prescriptions[]>(url).pipe(
            tap((prescriptions: Prescriptions[]) => this.setPrescriptions(prescriptions)),
            map((prescriptions: Prescriptions[]) => prescriptions.length > 0)
        );
    }

    getByUserId(userId: string, params?: { offset?: number; limit?: number }): Observable<PrescriptionsResponse> {
        const queryParams = {
            ...(params || {}),
            ambito: this.ambitoService.getAmbito() || 'privado'
        };
        return this.http.get<PrescriptionsResponse>(`${environment.API_END_POINT}/prescriptions/user/${userId}`, { params: queryParams }).pipe(
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

        // Cancelar timeout anterior si existe
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Cancelar suscripción HTTP anterior si existe
        if (this.searchSubscription) {
            this.searchSubscription.unsubscribe();
            this.searchSubscription = null;
        }

        // Crear un nuevo Observable que espere 500ms antes de hacer la llamada
        return new Observable(observer => {
            this.searchTimeout = setTimeout(() => {
                this.searchSubscription = this.http.get<PrescriptionsResponse>(
                    `${environment.API_END_POINT}/prescriptions/user/${userId}/search`,
                    { params: queryParams }
                ).pipe(
                    tap((response) => this.setPrescriptions(response.prescriptions as Prescriptions[]))
                ).subscribe({
                    next: (response) => {
                        observer.next(response);
                        this.searchSubscription = null;
                    },
                    error: (error) => {
                        observer.error(error);
                        this.searchSubscription = null;
                    },
                    complete: () => {
                        observer.complete();
                        this.searchSubscription = null;
                    }
                });
            }, 500);
        });
    }

    newPrescription(prescription: Prescriptions): Observable<Boolean> {
        return this.http.post<Prescriptions[]>(`${environment.API_END_POINT}/prescriptions`, prescription).pipe(
            tap((newPrescriptions: Prescriptions[]) => this.addPrescription(newPrescriptions)),
            mapTo(true)
        );
    }

    editPrescription(prescription: Prescriptions): Observable<Boolean> {
        return this.http.patch<Prescriptions>(`${environment.API_END_POINT}/prescriptions/${prescription._id}`, prescription).pipe(
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

    getCsv(dateFilter: Object): Observable<Blob> {
        return this.http.post(`${environment.API_END_POINT}/prescriptions/get-csv`, dateFilter, { responseType: 'blob' } as any).pipe(
            tap((csv: any) => {
                const header = { type: 'text/csv' };
                const blob = new Blob([csv], header);
                const fileName = `reporte-${moment().format('DD-MM-YYYY-HH:mm')}.csv`;
                saveAs(blob, fileName);
            })
        );
    }

    get prescriptions(): Observable<Prescriptions[]> {
        return this.myPrescriptions.asObservable();
    }
}
