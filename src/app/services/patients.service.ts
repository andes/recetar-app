import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { Patient, PatientAdapter } from '../interfaces/patients';
import { PatientPayload } from '@models/dto/patients.dto';

@Injectable({
    providedIn: 'root'
})
export class PatientsService {

    constructor(
        private http: HttpClient,
        private patientAdapter: PatientAdapter
    ) { }

    getPatients(): Observable<Patient[]> {
        return this.http.get<Patient[]>(`${environment.API_END_POINT}/patients`).pipe(
            map((patients: Patient[]) => patients.map((patient) => this.patientAdapter.adapt(patient)))
        );
    }
    getPatientOSByDni(dni: string, sexo: string) {
        const params = { sexo };
        return this.http.get(`${environment.API_END_POINT}/patients/coverages/${dni}`, { params });
    }
    getOS() {
        return this.http.get(`${environment.API_END_POINT}/patients/coverages`);
    }
    getPatientByDni(dni: string): Observable<Patient[]> {
        return this.http.get<Patient[]>(`${environment.API_END_POINT}/patients/dni/${dni}`).pipe(
            map((patients: Patient[]) => patients.map((patient) => this.patientAdapter.adapt(patient)))
        );
    }

    searchPatients(term: string): Observable<Patient[]> {
        return this.http.get<Patient[]>(`${environment.API_END_POINT}/patients/search`, {
            params: { q: term }
        }).pipe(
            map((patients: Patient[]) => patients.map((patient) => this.patientAdapter.adapt(patient)))
        );
    }

    getPatientById(id: string): Observable<Patient> {
        return this.http.get<Patient>(`${environment.API_END_POINT}/patients/${id}`).pipe(
            map((patient: Patient) => this.patientAdapter.adapt(patient)),
            tap(() => undefined),
            catchError(this.handleError<Patient>(`getPatientById id=${id}`))
        );
    }

    newPatient(patient: Patient): Observable<Patient> {
        return this.http.post<Patient>(`${environment.API_END_POINT}/patients`, patient).pipe(
            map((newPatient: Patient) => this.patientAdapter.adapt(newPatient)),
            tap(() => undefined),
            catchError(this.handleError<Patient>('newPatient'))
        );
    }

    createPatient(patient: PatientPayload): Observable<Patient> {
        return this.http.post<Patient>(`${environment.API_END_POINT}/patients`, patient).pipe(
            map((newPatient: Patient) => this.patientAdapter.adapt(newPatient))
        );
    }

    updatePatient(id: string, patient: Partial<PatientPayload>): Observable<Patient> {
        return this.http.patch<Patient>(`${environment.API_END_POINT}/patients/${id}`, patient).pipe(
            map((updatedPatient: Patient) => this.patientAdapter.adapt(updatedPatient))
        );
    }

    getPatientInsurance(dni: string) {
        return this.http.get<unknown>(`https://app.andes.gob.ar/api/modules/obraSocial/puco/?dni=${dni}`);
    }

    validatePatient(dni: string, sexo: string): Observable<Patient> {
        return this.http.post<Patient>(`${environment.API_END_POINT}/patients/validate`, {
            dni,
            sexo
        }).pipe(
            map((patient: Patient) => this.patientAdapter.adapt(patient))
        );
    }

    private handleError<T>(operation = 'operation', result?: T) {
        return (_error: unknown): Observable<T> => {
            // Let the app keep running by returning an empty result.
            return of(result as T);
        };
    }

}
