import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { SnomedConcept } from '@interfaces/andesPrescriptions';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SnomedSuppliesService {

  private mySupplies: BehaviorSubject<SnomedConcept[]>;
  private suppliesArray: SnomedConcept[] = [];
  private dataLoaded = false;

  constructor(private http: HttpClient) {
    this.mySupplies = new BehaviorSubject<any[]>(this.suppliesArray);
  }

  get(): Observable<any[]> {
    if (this.dataLoaded) {
      return this.mySupplies.asObservable();
    } else {
      return this.http.get<any[]>(`${environment.API_END_POINT}/snomed/supplies`).pipe(
        tap((supplies: any[]) => {
          this.mySupplies.next(supplies);
          this.dataLoaded = true;
        })
      );
    }
  }

  // get(term: string): Observable<SnomedConcept[]>{
  //   const params = new HttpParams().set('supplyName', term);
  //   return this.http.get<SnomedConcept[]>(`${environment.API_END_POINT}/supplies`, {params});
  // }

  // get supply(): Observable<SnomedConcept[]> {
  //   return this.mySupplies.asObservable();
  // }

}
