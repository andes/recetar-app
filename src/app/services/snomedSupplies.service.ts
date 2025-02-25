import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import Supplies from "../interfaces/supplies";
import { tap, mapTo } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SuppliesService {

  private mySupplies: BehaviorSubject<any[]>;
  private suppliesArray: any[] = [];

  constructor(private http: HttpClient) {
    this.mySupplies = new BehaviorSubject<any[]>(this.suppliesArray);
  }

  get(term: string): Observable<Supplies[]>{
    const params = new HttpParams().set('supplyName', term);
    return this.http.get<Supplies[]>(`${environment.API_END_POINT}/supplies`, {params});
  }

}
