import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Prescriptions } from "../interfaces/prescriptions";
import { tap, mapTo, map } from 'rxjs/operators';
import { saveAs } from 'file-saver';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionsService {

  private myAndesPrescriptions: BehaviorSubject<Prescriptions[]>;
  private andesPrescriptionsArray: Prescriptions[] = [];

  constructor(private http: HttpClient) {
    this.myAndesPrescriptions = new BehaviorSubject<Prescriptions[]>(this.andesPrescriptionsArray);
  }

  getPrescriptionsFromAndes(params: { patient_dni: string, patient_sex: string }): Observable<boolean> {
    return this.http.get(`${environment.API_END_POINT}/andes-prescriptions/from-andes/${params.patient_dni}&${params.patient_sex}`, {params}).pipe(
      tap((prescriptions: Prescriptions[]) => this.setPrescriptions(prescriptions)),
      map((prescriptions: Prescriptions[]) => prescriptions.length > 0)
    );
  }

  getPrescriptions(params): Observable<boolean> {
    return this.http.get(`${environment.API_END_POINT}/andes-prescriptions/`, {params}).pipe(
      tap((prescriptions: Prescriptions[]) => this.setPrescriptions(prescriptions)),
      map((prescriptions: Prescriptions[]) => prescriptions.length > 0)
    );
  }

  getById(id: string): Observable<Prescriptions> {
    return this.http.get<Prescriptions>(`${environment.API_END_POINT}/prescriptions/${id}`);
  }

  dispense(prescription: string, pharmacistId: string): Observable<boolean> {
    const params = { 'prescription': prescription, 'pharmacistId': pharmacistId };
    return this.http.patch<Prescriptions>(`${environment.API_END_POINT}/andes-prescriptions/dispense`, params).pipe(
      tap((updatedPrescription: Prescriptions) => this.updatePrescription(updatedPrescription)),
      mapTo(true)
    );
  }

  cancelDispense(prescriptionId: string, pharmacistId: string): Observable<boolean> {
    var params = { 'prescriptionId': prescriptionId, 'pharmacistId': pharmacistId };
    return this.http.patch<Prescriptions>(`${environment.API_END_POINT}/prescriptions/${params.prescriptionId}/cancel-dispense`, params).pipe(
      tap((updatedPrescription: Prescriptions) => this.updatePrescription(updatedPrescription)),
      mapTo(true)
    );
  }

  getFromDniAndDate(params: { patient_dni: string, dateFilter: string }): Observable<boolean> {
    return this.http.get<Prescriptions[]>(`${environment.API_END_POINT}/prescriptions/find/${params.patient_dni}&${params.dateFilter}`).pipe(
      tap((prescriptions: Prescriptions[]) => this.setPrescriptions(prescriptions)),
      map((prescriptions: Prescriptions[]) => prescriptions.length > 0)
    );
  }

  getByUserId(userId: string): Observable<Boolean> {
    return this.http.get<Prescriptions[]>(`${environment.API_END_POINT}/prescriptions/get-by-user-id/${userId}`).pipe(
      tap((prescriptions: Prescriptions[]) => this.setPrescriptions(prescriptions)),
      mapTo(true)
    );
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
    this.andesPrescriptionsArray = [];
    this.myAndesPrescriptions.next(this.andesPrescriptionsArray);
  }

  private setPrescriptions(prescriptions: Prescriptions[]) {
    this.andesPrescriptionsArray = prescriptions;
    this.myAndesPrescriptions.next(prescriptions);
  }


  private addPrescription(prescriptions: Prescriptions[]) {
    this.andesPrescriptionsArray.unshift(...prescriptions);
    this.myAndesPrescriptions.next(this.andesPrescriptionsArray);
  }

  private removePrescription(removedPrescription: string) {
    const removeIndex = this.andesPrescriptionsArray.findIndex((prescription: Prescriptions) => prescription._id === removedPrescription);

    this.andesPrescriptionsArray.splice(removeIndex, 1);
    this.myAndesPrescriptions.next(this.andesPrescriptionsArray);
  }

  private updatePrescription(updatedPrescription: Prescriptions) {
    const updateIndex = this.andesPrescriptionsArray.findIndex((prescription: Prescriptions) => prescription._id === updatedPrescription._id);
    this.andesPrescriptionsArray.splice(updateIndex, 1, updatedPrescription);
    this.myAndesPrescriptions.next(this.andesPrescriptionsArray);
  }

  get prescriptions(): Observable<Prescriptions[]> {
    return this.myAndesPrescriptions.asObservable();
  }
}
