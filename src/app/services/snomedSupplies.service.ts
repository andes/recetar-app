import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import SnomedConcept from '@interfaces/snomedConcept';
import { map, tap } from 'rxjs/operators';

interface RawSnomedConcept {
    conceptId?: string;
    id?: string;
    term?: string;
    nombre?: string;
    fsn?: string;
    semanticTag?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SnomedSuppliesService {

    private mySupplies: BehaviorSubject<SnomedConcept[]>;
    private suppliesArray: SnomedConcept[] = [];

    constructor(private http: HttpClient) {
        this.mySupplies = new BehaviorSubject<SnomedConcept[]>(this.suppliesArray);
    }

    private normalizeConcept(item: RawSnomedConcept): SnomedConcept {
        return {
            conceptId: item?.conceptId || item?.id || '',
            term: item?.term || item?.nombre || '',
            fsn: item?.fsn || item?.term || item?.nombre || '',
            semanticTag: item?.semanticTag || ''
        };
    }

    get(searchTerm: string): Observable<SnomedConcept[]> {
        return this.http.get<RawSnomedConcept[]>(`${environment.API_END_POINT}/supplies/snomed?search=${searchTerm}`).pipe(
            map((concepts: RawSnomedConcept[]) => concepts.map((concept) => this.normalizeConcept(concept))),
            tap((concepts: SnomedConcept[]) => {
                this.suppliesArray = concepts;
                this.mySupplies.next(concepts);
            })
        );
    }

}
