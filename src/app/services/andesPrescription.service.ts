import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import AndesPrescriptions from "../interfaces/andesPrescriptions";
import { tap, mapTo, map } from 'rxjs/operators';
import { saveAs } from 'file-saver';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class AndesPrescriptionsService {

  private myAndesPrescriptions: BehaviorSubject<AndesPrescriptions[]>;
  private andesPrescriptionsArray: AndesPrescriptions[] = [];

  constructor(private http: HttpClient) {
    this.myAndesPrescriptions = new BehaviorSubject<AndesPrescriptions[]>(this.andesPrescriptionsArray);
  }

  getPrescriptionsFromAndes(params: { patient_dni: string, patient_sex: string }): Observable<boolean> {
    return this.http.get(`${environment.API_END_POINT}/andes-prescriptions/from-andes/?dni=${params.patient_dni}&sexo=${params.patient_sex}`).pipe(
      tap((prescriptions: AndesPrescriptions[]) => this.setPrescriptions(prescriptions)),
      map((prescriptions: AndesPrescriptions[]) => prescriptions.length > 0)
    );
  }

  getPrescriptions(params): Observable<boolean> {
    return this.http.get(`${environment.API_END_POINT}/andes-prescriptions/`, {params}).pipe(
      tap((prescriptions: AndesPrescriptions[]) => this.setPrescriptions(prescriptions)),
      map((prescriptions: AndesPrescriptions[]) => prescriptions.length > 0)
    );
  }

  getById(id: string): Observable<AndesPrescriptions> {
    return this.http.get<AndesPrescriptions>(`${environment.API_END_POINT}/prescriptions/${id}`);
  }

  dispense(prescription: string, pharmacistId: string): Observable<boolean> {
    const params = { 'prescription': prescription, 'pharmacistId': pharmacistId };
    return this.http.patch<AndesPrescriptions>(`${environment.API_END_POINT}/andes-prescriptions/dispense`, params).pipe(
      tap((updatedPrescription: AndesPrescriptions) => this.updatePrescription(updatedPrescription)),
      mapTo(true)
    );
  }

  cancelDispense(prescriptionId: string, pharmacistId: string): Observable<boolean> {
    var params = { 'prescriptionId': prescriptionId, 'pharmacistId': pharmacistId };
    return this.http.patch<AndesPrescriptions>(`${environment.API_END_POINT}/prescriptions/${params.prescriptionId}/cancel-dispense`, params).pipe(
      tap((updatedPrescription: AndesPrescriptions) => this.updatePrescription(updatedPrescription)),
      mapTo(true)
    );
  }

  getFromDniAndDate(params: { patient_dni: string, dateFilter: string }): Observable<boolean> {
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
    const removeIndex = this.andesPrescriptionsArray.findIndex((prescription: AndesPrescriptions) => prescription.idAndes === removedPrescription);

    this.andesPrescriptionsArray.splice(removeIndex, 1);
    this.myAndesPrescriptions.next(this.andesPrescriptionsArray);
  }

  private updatePrescription(updatedPrescription: AndesPrescriptions) {
    const updateIndex = this.andesPrescriptionsArray.findIndex((prescription: AndesPrescriptions) => prescription.idAndes === updatedPrescription.idAndes);
    this.andesPrescriptionsArray.splice(updateIndex, 1, updatedPrescription);
    this.myAndesPrescriptions.next(this.andesPrescriptionsArray);
  }

  get prescriptions(): Observable<AndesPrescriptions[]> {
    console.log('andesprecription')
    return this.myAndesPrescriptions.asObservable();
  }
}
