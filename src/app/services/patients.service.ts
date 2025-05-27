import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap, map } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { Patient, PatientAdapter } from "../interfaces/patients";

@Injectable({
  providedIn: 'root'
})
export class PatientsService {

  constructor(
    private http: HttpClient,
    private adapter: PatientAdapter,

  ) { }

  getPatients(): Observable<any> {
    return this.http.get(`${environment.API_END_POINT}/patients`);
  }
  getPatientOSByDni(dni: string, sexo: string) {
    const params = { 'documento': dni, 'sexo': sexo }
    return this.http.get(`${environment.API_END_POINT}/patients/get-os-by-dni`, { params });
  }
  getOS() {
    return this.http.get(`${environment.API_END_POINT}/patients/get-os`);
  }
  getPatientByDni(dni: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${environment.API_END_POINT}/patients/get-by-dni/${dni}`);
  }

  getPatientById(id: string): Observable<Patient> {
    return this.http.get<Patient>(`${environment.API_END_POINT}/patients/${id}`).pipe(
      tap(_ => console.log(`fetched patient id=${id}`)),
      catchError(this.handleError<Patient>(`getPatientById id=${id}`))
    );
  }

  newPatient(patient: Patient): Observable<Patient> {
    return this.http.post<Patient>(`${environment.API_END_POINT}/patients`, patient).pipe(
      tap((p: Patient) => console.log(`added patient w/ id=${p._id}`)),
      catchError(this.handleError<Patient>('newPatient'))
    );
  }

  getPatientInsurance(dni: string) {
    return this.http.get(`https://app.andes.gob.ar/api/modules/obraSocial/puco/?dni=${dni}`);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

}
