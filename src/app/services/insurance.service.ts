import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { Insurances } from '../interfaces/insurances';

@Injectable({
    providedIn: 'root'
})
export class InsurancesService {

    constructor(private http: HttpClient) { }

    getInsuranceByPatientDni(dni: string): Observable<Insurances> {
        const url = `https://app.andes.gob.ar/api/modules/obraSocial/puco/?dni=${dni}`;
        return this.http.get<Insurances>(url).pipe(
            tap(() => undefined),
            catchError(this.handleError<Insurances>('getInsuranceByName'))
        );
    }

    private handleError<T>(operation = 'operation', result?: T) {
        return (_error: unknown): Observable<T> => {
            // Let the app keep running by returning an empty result.
            return of(result as T);
        };
    }

}
