import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Practice } from '@interfaces/practices';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, mapTo, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PracticesService {

    private myPractices: BehaviorSubject<Practice[]>;
    private practicesArray: Practice[] = [];

    constructor(private http: HttpClient) {
        this.myPractices = new BehaviorSubject<Practice[]>(this.practicesArray);
    }

    getPractices(params): Observable<boolean> {
        return this.http.get(`${environment.API_END_POINT}/practices`, { params }).pipe(
            tap((practices: Practice[]) => this.setPractices(practices)),
            map((practices: Practice[]) => practices.length > 0)
        );
    }

    getById(id: string): Observable<Practice> {
        return this.http.get<Practice>(`${environment.API_END_POINT}/practices/${id}`);
    }

    getFromDniAndDate(params: { patient_dni: string, dateFilter: string }): Observable<boolean> {
        return this.http.get<Practice[]>(`${environment.API_END_POINT}/practices/find/${params.patient_dni}&${params.dateFilter}`).pipe(
            tap((practices: Practice[]) => this.setPractices(practices)),
            map((practices: Practice[]) => practices.length > 0)
        );
    }

    getByUserId(userId: string): Observable<Boolean> {
        return this.http.get<Practice[]>(`${environment.API_END_POINT}/practices/get-by-user-id/${userId}`).pipe(
            tap((practices: Practice[]) => this.setPractices(practices)),
            mapTo(true)
        );
    }

    newPractice(practice: Practice): Observable<Boolean> {
        return this.http.post<Practice[]>(`${environment.API_END_POINT}/practices`, practice).pipe(
            tap((newPractices: Practice[]) => this.addPractice(newPractices)),
            mapTo(true)
        );
    }

    editPractice(practice: Practice): Observable<Boolean> {
        return this.http.patch<Practice>(`${environment.API_END_POINT}/practices/${practice._id}`, practice).pipe(
            tap((updatedPractice: Practice) => this.updatePractice(updatedPractice)),
            mapTo(true)
        );
    }

    deletePractice(practiceId: string): Observable<Boolean> {
        return this.http.delete<Practice>(`${environment.API_END_POINT}/practices/${practiceId}`).pipe(
            tap(() => this.removePractice(practiceId)),
            mapTo(true)
        );
    }

    completePractice(practiceId: string): Observable<boolean> {
        return this.http.patch<Practice>(`${environment.API_END_POINT}/practices/${practiceId}/complete`, {}).pipe(
            tap((updatedPractice: Practice) => this.updatePractice(updatedPractice)),
            mapTo(true)
        );
    }

    cancelPractice(practiceId: string): Observable<boolean> {
        return this.http.patch<Practice>(`${environment.API_END_POINT}/practices/${practiceId}/cancel`, {}).pipe(
            tap((updatedPractice: Practice) => this.updatePractice(updatedPractice)),
            mapTo(true)
        );
    }

    cleanPractices(): void {
        this.practicesArray = [];
        this.myPractices.next(this.practicesArray);
    }

    private setPractices(practices: Practice[]) {
        this.practicesArray = practices;
        this.myPractices.next(practices);
    }

    private addPractice(practices: Practice[]) {
        this.practicesArray.unshift(...practices);
        this.myPractices.next(this.practicesArray);
    }

    private removePractice(removedPractice: string) {
        const removeIndex = this.practicesArray.findIndex((practice: Practice) => practice._id === removedPractice);
        this.practicesArray.splice(removeIndex, 1);
        this.myPractices.next(this.practicesArray);
    }

    private updatePractice(updatedPractice: Practice) {
        const updateIndex = this.practicesArray.findIndex((practice: Practice) => practice._id === updatedPractice._id);
        this.practicesArray.splice(updateIndex, 1, updatedPractice);
        this.myPractices.next(this.practicesArray);
    }

    getCsv(dateFilter: Object): Observable<Blob> {
        return this.http.post(`${environment.API_END_POINT}/practices/get-csv`, dateFilter, { responseType: 'blob' } as any).pipe(
            tap((csv: any) => {
                const header = { type: 'text/csv' };
                const blob = new Blob([csv], header);
                const fileName = `reporte-practicas-${moment().format('DD-MM-YYYY-HH:mm')}.csv`
                saveAs(blob, fileName);
            })
        )
    }

    get practices(): Observable<Practice[]> {
        return this.myPractices.asObservable();
    }
}