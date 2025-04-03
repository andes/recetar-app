import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap, map, first } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { Professionals, ProfessionalsAdapter } from "../interfaces/professionals";

@Injectable({
  providedIn: 'root'
})
export class ProfessionalsService {

  constructor(private http: HttpClient, private adapter: ProfessionalsAdapter) { }

  // getProfessionals(): Observable<any>{
  //   return this.http.get(`${environment.API_END_POINT}/professionals`);
  // }

  //   getProfessionalByDni(dni: string, email: string): Observable<any> {
  //     console.log(dni, email);
  //     const url = `${environment.ANDES_API}/core/tm/profesionales/guia?documento=${dni}&email=${email}`
  //     return this.http.get(url);
  //   }

  getProfessionalByDni(params): Observable<any> {
    const url = `${environment.ANDES_API}/core/tm/profesionales/guia`
    return this.http.get(url, { params });
  }

  // getProfessionalByEnrollment(enrollment: string): Observable<Professionals> {
  //   const url = `${environment.ANDES_API}/core/tm/profesionales/guia?formacionGrado=%5Bobject%20Object%5D&numeroMatricula=${enrollment}&codigoProfesion=1`
  //   return this.http.get<Professionals>(url).pipe(
  //     tap(_ => console.log(`fetched professional enrollment=${enrollment}`)),
  //     map((data: any) => data.map(item => this.adapter.adapt(item))),
  //     catchError(this.handleError<Professionals>(`getProfessionalByDni enrollment=${enrollment}`))
  //   );
  // }

  // getProfessionalByLastName(lastName: string): Observable<Professionals> {
  //   const url = `${environment.ANDES_API}/core/tm/profesionales/guia?apellido=${lastName}&formacionGrado=%5Bobject%20Object%5D&codigoProfesion=1`
  //   return this.http.get<Professionals>(url).pipe(
  //     tap(_ => console.log(`fetched professional lastName=${lastName}`)),
  //     map((data: any) => data.map(item => this.adapter.adapt(item))),
  //     catchError(this.handleError<Professionals>(`getProfessionalByFirstNameAndLastName lastName=${lastName}`))
  //   );
  // }

  // getProfessionalByFirstName(firstName: string): Observable<Professionals> {
  //   const url = `${environment.ANDES_API}/core/tm/profesionales/guia?nombre=${firstName}&formacionGrado=%5Bobject%20Object%5D&codigoProfesion=1`
  //   return this.http.get<Professionals>(url).pipe(
  //     tap(_ => console.log(`fetched professional firstName=${firstName}`)),
  //     map((data: any) => data.map(item => this.adapter.adapt(item))),
  //     catchError(this.handleError<Professionals>(`getProfessionalByFirstNameAndLastName firstName=${firstName}`))
  //   );
  // }

  // newProfessional(professional: Professionals): Observable<Professionals> {
  //   return this.http.post<Professionals>(`${environment.API_END_POINT}/professionals`, professional).pipe(
  //     tap((p: Professionals) => console.log(`added professional w/ id=${p._id}`)),
  //     catchError(this.handleError<Professionals>('newProfessional'))
  //   );
  // }

  // updateProfessional(id: string, professional: Professionals): Observable<Professionals> {
  //   return this.http.put<Professionals>(`${environment.API_END_POINT}/professionals/${id}`, professional).pipe(
  //     tap(_ => console.log(`updated professional id=${id}`)),
  //     catchError(this.handleError<Professionals>('updateProfessional'))
  //   );
  // }

  // deleteProfessional(id: string): Observable<Professionals> {
  //   return this.http.delete<Professionals>(`${environment.API_END_POINT}/professionals/${id}`).pipe(
  //     tap(_ => console.log(`deleted professional id=${id}`)),
  //     catchError(this.handleError<Professionals>('deleteProfessional'))
  //   );
  // }

  // private handleError<T> (operation = 'operation', result?: T) {
  //   return (error: any): Observable<T> => {

  //     // TODO: send the error to remote logging infrastructure
  //     console.error(error); // log to console instead

  //     // Let the app keep running by returning an empty result.
  //     return of(result as T);
  //   };
  // }

}
