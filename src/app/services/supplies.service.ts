import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import Supplies, { SupplyAdapter } from '../interfaces/supplies';
import { tap, mapTo, map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class SuppliesService {

    private mySupplies: BehaviorSubject<Supplies[]>;
    private suppliesArray: Supplies[] = [];

    constructor(private http: HttpClient, private supplyAdapter: SupplyAdapter) {
        this.mySupplies = new BehaviorSubject<Supplies[]>(this.suppliesArray);
    }

    get(term: string): Observable<Supplies[]> {
        const params = new HttpParams().set('name', term);
        return this.http.get<Supplies[]>(`${environment.API_END_POINT}/supplies`, { params }).pipe(
            map((supplies) => supplies.map((supply) => this.supplyAdapter.adapt(supply)))
        );
    }

    newSupply(supply: Supplies): Observable<Boolean> {
        return this.http.post<Supplies>(`${environment.API_END_POINT}/supplies`, supply).pipe(
            map((newSupplyItem: Supplies) => this.supplyAdapter.adapt(newSupplyItem)),
            tap((newSupplyItem: Supplies) => this.addSupply(newSupplyItem)),
            mapTo(true)
        );
    }

    editSupply(supply: Supplies): Observable<Boolean> {
        return this.http.patch<Supplies>(`${environment.API_END_POINT}/supplies/${supply._id}`, supply).pipe(
            map((updatedSupply: Supplies) => this.supplyAdapter.adapt(updatedSupply)),
            tap((updatedSupply: Supplies) => this.updateSupply(updatedSupply)),
            mapTo(true)
        );
    }

    private addSupply(supply: Supplies) {
        this.suppliesArray.unshift(supply);
        this.mySupplies.next(this.suppliesArray);
    }

    private removeSupply(removedSupplyId: string) {
        const removeIndex = this.suppliesArray.findIndex((supply: Supplies) => supply._id === removedSupplyId);

        this.suppliesArray.splice(removeIndex, 1);
        this.mySupplies.next(this.suppliesArray);
    }

    private updateSupply(updatedSupply: Supplies) {
        const updateIndex = this.suppliesArray.findIndex((supply: Supplies) => supply._id === updatedSupply._id);
        this.suppliesArray.splice(updateIndex, 1, updatedSupply);
        this.mySupplies.next(this.suppliesArray);
    }

}
