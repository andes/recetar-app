import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import Supplies from '../interfaces/supplies';
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

    get(term: string): Observable<Supplies[]> {
        const params = new HttpParams().set('supplyName', term);
        return this.http.get<Supplies[]>(`${environment.API_END_POINT}/supplies`, { params });
    }

    getSupplyByTerm(term: string): Observable<Supplies[]> {
        const params = new HttpParams().set('supplyName', term);
        return this.http.get<Supplies[]>(`${environment.API_END_POINT}/supplies/get-by-name`, { params });
    }

    newSupply(supply: any): Observable<Boolean> {
        return this.http.post<any>(`${environment.API_END_POINT}/supplies`, supply).pipe(
            tap((newPrescription: any) => this.addPrescription(newPrescription)),
            mapTo(true)
        );
    }

    editSupply(supply: any): Observable<Boolean> {
        return this.http.patch<any>(`${environment.API_END_POINT}/supplies/${supply._id}`, supply).pipe(
            tap((updatedPrescription: any) => this.updatePrescription(updatedPrescription)),
            mapTo(true)
        );
    }

    private addPrescription(supply: any) {
        this.suppliesArray.unshift(supply);
        this.mySupplies.next(this.suppliesArray);
    }

    private removePrescription(removedPrescription: string) {
        const removeIndex = this.suppliesArray.findIndex((supply: any) => supply._id === removedPrescription);

        this.suppliesArray.splice(removeIndex, 1);
        this.mySupplies.next(this.suppliesArray);
    }

    private updatePrescription(updatedPrescription: any) {
        const updateIndex = this.suppliesArray.findIndex((supply: any) => supply._id === updatedPrescription._id);
        this.suppliesArray.splice(updateIndex, 1, updatedPrescription);
        this.mySupplies.next(this.suppliesArray);
    }

}
