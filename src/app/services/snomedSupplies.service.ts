import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { SnomedConcept } from '@interfaces/andesPrescriptions';

@Injectable({
  providedIn: 'root'
})
export class SuppliesService {

  private mySupplies: BehaviorSubject<SnomedConcept[]>;
  private suppliesArray: SnomedConcept[] = [];

  constructor(private http: HttpClient) {
    this.mySupplies = new BehaviorSubject<any[]>(this.suppliesArray);
  }

  get(term: string): Observable<SnomedConcept[]>{
    const params = new HttpParams().set('supplyName', term);
    return this.http.get<SnomedConcept[]>(`${environment.API_END_POINT}/supplies`, {params});
  }

  get supply(): Observable<SnomedConcept[]> {
    return this.mySupplies.asObservable();
  }

}
