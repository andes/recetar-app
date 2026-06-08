import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, mapTo, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import AndesPrescriptions, { AndesPrescriptionsAdapter } from '../interfaces/andesPrescriptions';
import { HttpClient, HttpParams } from '@angular/common/http';

interface AndesVerificationResult {
    _id?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AndesPrescriptionsService {

    private myAndesPrescriptions: BehaviorSubject<AndesPrescriptions[]>;
    private andesPrescriptionsArray: AndesPrescriptions[] = [];

    constructor(private http: HttpClient, private andesPrescriptionsAdapter: AndesPrescriptionsAdapter) {
        this.myAndesPrescriptions = new BehaviorSubject<AndesPrescriptions[]>(this.andesPrescriptionsArray);
    }

    private adaptAndesPrescription(item: AndesPrescriptions): AndesPrescriptions {
        return this.andesPrescriptionsAdapter.adapt(item);
    }

    private adaptAndesPrescriptionList(items: AndesPrescriptions[]): AndesPrescriptions[] {
        return items.map((item) => this.adaptAndesPrescription(item));
    }

    getPrescriptions(params: { dispensedBy?: string }): Observable<boolean> {
        const cuil = params?.dispensedBy || '';
        return this.http.get<{ prescriptions: AndesPrescriptions[]; total: number }>(`${environment.API_END_POINT}/prescriptions/dispensed-by/${cuil}`).pipe(
            map((response) => this.adaptAndesPrescriptionList(response.prescriptions)),
            tap((prescriptions: AndesPrescriptions[]) => this.setPrescriptions(prescriptions)),
            map((prescriptions: AndesPrescriptions[]) => prescriptions.length > 0)
        );
    }

    getById(id: string): Observable<AndesPrescriptions> {
        return this.http.get<AndesPrescriptions>(`${environment.API_END_POINT}/prescriptions/${id}`).pipe(
            map((prescription: AndesPrescriptions) => this.adaptAndesPrescription(prescription))
        );
    }

    dispense(prescription: AndesPrescriptions, pharmacistId: string): Observable<boolean> {
        const params = { 'prescription': prescription, 'pharmacistId': pharmacistId };
        return this.http.patch<AndesPrescriptions>(`${environment.API_END_POINT}/prescriptions/andes/dispense`, params).pipe(
            map((updatedPrescription: AndesPrescriptions) => this.adaptAndesPrescription(updatedPrescription)),
            tap((updatedPrescription: AndesPrescriptions) => this.updatePrescription(updatedPrescription)),
            mapTo(true)
        );
    }

    cancelDispense(prescriptionId: string, pharmacistId: string): Observable<boolean> {
        const params = { 'prescriptionId': prescriptionId, 'pharmacistId': pharmacistId };
        return this.http.patch<AndesPrescriptions>(`${environment.API_END_POINT}/prescriptions/andes/cancel-dispense`, params).pipe(
            map((updatedPrescription: AndesPrescriptions) => this.adaptAndesPrescription(updatedPrescription)),
            tap((updatedPrescription: AndesPrescriptions) => this.updatePrescription(updatedPrescription)),
            mapTo(true)
        );
    }

    suspendPrescription(recetaId: string, profesionalId: string): Observable<boolean> {
        const params = { 'recetaId': recetaId, 'profesionalId': profesionalId };
        return this.http.patch<AndesPrescriptions>(`${environment.API_END_POINT}/prescriptions/andes/suspend`, params).pipe(
            map((updatedPrescription: AndesPrescriptions) => this.adaptAndesPrescription(updatedPrescription)),
            tap((updatedPrescription: AndesPrescriptions) => this.updatePrescription(updatedPrescription)),
            mapTo(true)
        );
    }

    getByUserId(userId: string): Observable<Boolean> {
        return this.http.get<AndesPrescriptions[]>(`${environment.API_END_POINT}/prescriptions/user/${userId}`).pipe(
            map((prescriptions: AndesPrescriptions[]) => this.adaptAndesPrescriptionList(prescriptions)),
            tap((prescriptions: AndesPrescriptions[]) => this.setPrescriptions(prescriptions)),
            mapTo(true)
        );
    }

    newPrescription(prescription: AndesPrescriptions): Observable<Boolean> {
        return this.http.post<AndesPrescriptions>(`${environment.API_END_POINT}/prescriptions`, prescription).pipe(
            map((newPrescriptionItem: AndesPrescriptions) => this.adaptAndesPrescription(newPrescriptionItem)),
            tap((newPrescriptionItem: AndesPrescriptions) => this.addPrescription([newPrescriptionItem])),
            mapTo(true)
        );
    }

    editPrescription(prescription: AndesPrescriptions): Observable<Boolean> {
        return this.http.patch<AndesPrescriptions>(`${environment.API_END_POINT}/prescriptions/${prescription.idAndes}`, prescription).pipe(
            map((updatedPrescription: AndesPrescriptions) => this.adaptAndesPrescription(updatedPrescription)),
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

    /**
     * Verifica si existe una receta activa (vigente/pendiente, sin dispensa completa)
     * para el paciente y el concepto SNOMED dados, usando el nuevo endpoint dedicado.
     * @param dni DNI del paciente
     * @param conceptId conceptId SNOMED del medicamento
     * @returns Observable<boolean> true si existe una receta activa
     */
    verificarRecetaExistente(dni: string, conceptId: string, sexo: string): Observable<boolean> {
        const params = new HttpParams()
            .set('dni', dni)
            .set('conceptId', conceptId)
            .set('sexo', sexo);
        return this.http.get<AndesVerificationResult[]>(`${environment.API_END_POINT}/prescriptions/andes/verify`, { params }).pipe(
            map((recetas: AndesVerificationResult[]) => Array.isArray(recetas) && recetas.length > 0)
        );
    }

    get prescriptions(): Observable<AndesPrescriptions[]> {
        return this.myAndesPrescriptions.asObservable();
    }
}
