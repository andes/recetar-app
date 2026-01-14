import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, mapTo, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import AndesPrescriptions from '../interfaces/andesPrescriptions';

@Injectable({
    providedIn: 'root'
})
export class AndesPrescriptionsService {

    private myAndesPrescriptions: BehaviorSubject<AndesPrescriptions[]>;
    private andesPrescriptionsArray: AndesPrescriptions[] = [];

    constructor(private http: HttpClient) {
        this.myAndesPrescriptions = new BehaviorSubject<AndesPrescriptions[]>(this.andesPrescriptionsArray);
    }


    getPrescriptionsFromAndes(params: { patient_dni: string; patient_sex: string }): Observable<boolean> {
        return this.http.get(`${environment.API_END_POINT}/andes-prescriptions/from-andes/?dni=${params.patient_dni}&sexo=${params.patient_sex}`).pipe(
            tap((prescriptions: AndesPrescriptions[]) => this.setPrescriptions(prescriptions)),
            map((prescriptions: AndesPrescriptions[]) => prescriptions.length > 0)
        );
    }

    getPrescriptions(params): Observable<boolean> {
        return this.http.get(`${environment.API_END_POINT}/andes-prescriptions/`, { params }).pipe(
            tap((prescriptions: AndesPrescriptions[]) => this.setPrescriptions(prescriptions)),
            map((prescriptions: AndesPrescriptions[]) => prescriptions.length > 0)
        );
    }

    getById(id: string): Observable<AndesPrescriptions> {
        return this.http.get<AndesPrescriptions>(`${environment.API_END_POINT}/prescriptions/${id}`);
    }

    dispense(prescription: AndesPrescriptions, pharmacistId: string): Observable<boolean> {
        const params = { 'prescription': prescription, 'pharmacistId': pharmacistId };
        return this.http.patch<AndesPrescriptions>(`${environment.API_END_POINT}/andes-prescriptions/dispense`, params).pipe(
            tap((updatedPrescription: AndesPrescriptions) => this.updatePrescription(updatedPrescription)),
            mapTo(true)
        );
    }

    cancelDispense(prescriptionId: string, pharmacistId: string): Observable<boolean> {
        const params = { 'prescriptionId': prescriptionId, 'pharmacistId': pharmacistId };
        return this.http.patch<AndesPrescriptions>(`${environment.API_END_POINT}/andes-prescriptions/cancel-dispense`, params).pipe(
            tap((updatedPrescription: AndesPrescriptions) => this.updatePrescription(updatedPrescription)),
            mapTo(true)
        );
    }

    suspendPrescription(recetaId: string, profesionalId: string): Observable<boolean> {
        const params = { 'recetaId': recetaId, 'profesionalId': profesionalId };
        return this.http.patch<AndesPrescriptions>(`${environment.API_END_POINT}/andes-prescriptions/suspend`, params).pipe(
            tap((updatedPrescription: AndesPrescriptions) => this.updatePrescription(updatedPrescription)),
            mapTo(true)
        );
    }

    getFromDniAndDate(params: { patient_dni: string; dateFilter: string }): Observable<boolean> {
        return this.http.get<AndesPrescriptions[]>(`${environment.API_END_POINT}/prescriptions/find/${params.patient_dni}&${params.dateFilter}`).pipe(
            tap((prescriptions: AndesPrescriptions[]) => this.setPrescriptions(prescriptions)),
            map((prescriptions: AndesPrescriptions[]) => prescriptions.length > 0)
        );
    }

    getByUserId(userId: string): Observable<Boolean> {
        return this.http.get<AndesPrescriptions[]>(`${environment.API_END_POINT}/prescriptions/get-by-user-id/${userId}`).pipe(
            tap((prescriptions: AndesPrescriptions[]) => this.setPrescriptions(prescriptions)),
            mapTo(true)
        );
    }

    newPrescription(prescription: AndesPrescriptions): Observable<Boolean> {
        return this.http.post<AndesPrescriptions[]>(`${environment.API_END_POINT}/prescriptions`, prescription).pipe(
            tap((newPrescriptions: AndesPrescriptions[]) => this.addPrescription(newPrescriptions)),
            mapTo(true)
        );
    }

    editPrescription(prescription: AndesPrescriptions): Observable<Boolean> {
        return this.http.patch<AndesPrescriptions>(`${environment.API_END_POINT}/prescriptions/${prescription.idAndes}`, prescription).pipe(
            tap((updatedPrescription: AndesPrescriptions) => this.updatePrescription(updatedPrescription)),
            mapTo(true)
        );
    }

    deletePrescription(prescriptionId: string): Observable<Boolean> {
        return this.http.delete<AndesPrescriptions>(`${environment.API_END_POINT}/prescriptions/${prescriptionId}`).pipe(
            tap(() => this.removePrescription(prescriptionId)),
            mapTo(true)
        );
    }

    // Nuevo método para obtener prescripciones con filtros
    getPrescriptionsWithFilters(patient_dni: string, filters?: { status?: string; dateFrom?: string; dateTo?: string; patient_sex?: string }): Observable<boolean> {
        let url = `${environment.API_END_POINT}/andes-prescriptions/from-andes/`;
        const queryParams: string[] = [];

        // Agregar el DNI del paciente (requerido)
        queryParams.push(`dni=${patient_dni}`);

        // Agregar el sexo del paciente (requerido para el endpoint from-andes)
        if (filters?.patient_sex) {
            queryParams.push(`sexo=${filters.patient_sex}`);
        }

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

        return this.http.get<AndesPrescriptions[]>(url).pipe(
            tap((prescriptions: AndesPrescriptions[]) => this.setPrescriptions(prescriptions)),
            map((prescriptions: AndesPrescriptions[]) => prescriptions.length > 0)
        );
    }

    cleanPrescriptions(): void {
        this.andesPrescriptionsArray = [];
        this.myAndesPrescriptions.next(this.andesPrescriptionsArray);
    }

    private setPrescriptions(prescriptions: AndesPrescriptions[]) {
        this.andesPrescriptionsArray = prescriptions;
        this.myAndesPrescriptions.next(prescriptions);
    }


    private addPrescription(prescriptions: AndesPrescriptions[]) {
        this.andesPrescriptionsArray.unshift(...prescriptions);
        this.myAndesPrescriptions.next(this.andesPrescriptionsArray);
    }

    private removePrescription(removedPrescription: string) {
        const removeIndex = this.andesPrescriptionsArray.findIndex((prescription: AndesPrescriptions) => prescription._id === removedPrescription);

        this.andesPrescriptionsArray.splice(removeIndex, 1);
        this.myAndesPrescriptions.next(this.andesPrescriptionsArray);
    }

    private updatePrescription(updatedPrescription: AndesPrescriptions) {
        const updateIndex = this.andesPrescriptionsArray.findIndex((prescription: AndesPrescriptions) => prescription._id === updatedPrescription._id);
        this.andesPrescriptionsArray.splice(updateIndex, 1, updatedPrescription);
        this.myAndesPrescriptions.next(this.andesPrescriptionsArray);
    }

    get prescriptions(): Observable<AndesPrescriptions[]> {
        return this.myAndesPrescriptions.asObservable();
    }
}
