import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap, map, first } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { Pharmacists, PharmacistsAdapter } from "../interfaces/pharmacists";

@Injectable({
  providedIn: 'root'
})
export class PharmacistsService {

  constructor(private http: HttpClient, private adapter: PharmacistsAdapter) { }

  getPharmacistByCuit(params): Observable<any> {
    const url = `${environment.ANDES_API}/core/tm/farmacias`;
    return this.http.get(url, { params });
  }

}
