import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, tap, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { Patient, PatientAdapter } from '../interfaces/patients';
import { PatientPayload } from '@models/dto/patients.dto';

export interface PatientSearchParams {
    q?: string;
    estado?: string;
    sexo?: string;
    email?: string;
    celular?: string;
    fijo?: string;
    offset?: number;
    limit?: number;
}

export interface PatientSearchPage {
    items: Patient[];
    hasMore: boolean;
    offset: number;
    limit: number;
}

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
    searchObrasSociales(term: string) {
        const params = { q: term };
        return this.http.get(`${environment.API_END_POINT}/patients/coverages`, { params });
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

    searchPatientsPage(params: PatientSearchParams): Observable<PatientSearchPage> {
        let httpParams = new HttpParams()
            .set('offset', params.offset ?? 0)
            .set('limit', params.limit ?? 20);
        if (params.q) { httpParams = httpParams.set('q', params.q); }
        if (params.estado) { httpParams = httpParams.set('estado', params.estado); }
        if (params.sexo) { httpParams = httpParams.set('sexo', params.sexo); }
        if (params.email) { httpParams = httpParams.set('email', params.email); }
        if (params.celular) { httpParams = httpParams.set('celular', params.celular); }
        if (params.fijo) { httpParams = httpParams.set('fijo', params.fijo); }

        return this.http.get<PatientSearchPage>(`${environment.API_END_POINT}/patients/search-page`, { params: httpParams }).pipe(
            map((response) => ({
                ...response,
                items: response.items.map((patient) => this.patientAdapter.adapt(patient)),
            }))
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

    validatePatientById(idMPI: string): Observable<Patient> {
        return this.http.post<Patient>(`${environment.API_END_POINT}/patients/${idMPI}/validate`, {}).pipe(
            map((patient: Patient) => this.patientAdapter.adapt(patient))
        );
    }

    deletePatient(idMPI: string): Observable<void> {
        return this.http.delete<void>(`${environment.API_END_POINT}/patients/${idMPI}`);
    }

    private handleError<T>(operation = 'operation', result?: T) {
        return (_error: unknown): Observable<T> => {
            // Let the app keep running by returning an empty result.
            return of(result as T);
        };
    }

}
