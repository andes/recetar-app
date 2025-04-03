import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Prescriptions } from "../interfaces/prescriptions";
import { tap, mapTo, map } from 'rxjs/operators';
import { saveAs } from 'file-saver';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionsService {

  private myPrescriptions: BehaviorSubject<Prescriptions[]>;
  private prescriptionsArray: Prescriptions[] = [];

  constructor(private http: HttpClient) {
    this.myPrescriptions = new BehaviorSubject<Prescriptions[]>(this.prescriptionsArray);
  }

  getById(id: string): Observable<Prescriptions> {
    return this.http.get<Prescriptions>(`${environment.API_END_POINT}/prescriptions/${id}`);
  }

  dispense(prescriptionId: string, pharmacistId: string): Observable<boolean> {
    var params = { 'prescriptionId': prescriptionId, 'pharmacistId': pharmacistId };
    return this.http.patch<Prescriptions>(`${environment.API_END_POINT}/prescriptions/${params.prescriptionId}/dispense`, params).pipe(
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
        const fileName = `reporte-${moment().format('DD-MM-YYYY-HH:mm')}.csv`
        saveAs(blob, fileName);
      })
    )
  }

  get prescriptions(): Observable<Prescriptions[]> {
    return this.myPrescriptions.asObservable();
  }
}
