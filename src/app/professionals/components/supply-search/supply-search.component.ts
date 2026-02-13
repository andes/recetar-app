import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { SnomedSuppliesService } from '@services/snomedSupplies.service';
import { Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { ThemePalette } from '@angular/material/core';

@Component({
    selector: 'app-supply-search',
    templateUrl: './supply-search.component.html',
    styleUrls: ['./supply-search.component.sass']
})
export class SupplySearchComponent implements OnInit, OnDestroy {
    @Input() parentForm: FormGroup;

    filteredSupplies: any[] = [];
    loading = false;
    readonly spinnerColor: ThemePalette = 'primary';
    private sub: Subscription;

    constructor(private snomedSuppliesService: SnomedSuppliesService) { }

    ngOnInit() {
        if (this.parentForm && this.parentForm.get('name')) {
            this.sub = this.parentForm.get('name').valueChanges.pipe(
                debounceTime(300),
                distinctUntilChanged(),
                filter((term: string) => typeof term === 'string' && term.length > 3),
                switchMap((term: string) => {
                    this.loading = true;
                    return this.snomedSuppliesService.get(term).pipe(
                        catchError(() => {
                            this.loading = false;
                            return of([]);
                        })
                    );
                })
            ).subscribe((res) => {
                this.loading = false;
                this.filteredSupplies = res.map(supply => {
                    const display = this.parseSupplyTerm(supply);
                    return { ...supply, display };
                });
            });
        }
    }


    private parseSupplyTerm(supply: any): { name: string, brand?: string } {
        if (supply.semanticTag === 'fármaco de uso clínico comercial') {
            const match = supply.term.match(/^(.*?) \[(.*?)\] (.*)$/);

            if (match) {
                const brand = match[1];
                const generic = match[2];
                const form = match[3];
                return {
                    name: `${generic} (${form})`,
                    brand: brand
                };
            }
        }
        return { name: supply.term };
    }


    ngOnDestroy() {
        if (this.sub) {
            this.sub.unsubscribe();
        }
    }

    onSupplySelected(event: any) {
        const supply = event.option.value;
        const term = this.toTitleCase(supply.term);
        // Update name with just the term
        this.parentForm.get('name').setValue(term, { emitEvent: false });

        let snomedConcept = {
            term: supply.term,
            fsn: supply.fsn,
            conceptId: supply.conceptId,
            semanticTag: supply.semanticTag
        };

        if (supply.relationships && supply.relationships.length > 0) {
            const rel = supply.relationships[0];
            snomedConcept = {
                term: rel.term,
                fsn: rel.fsn,
                conceptId: rel.conceptId,
                semanticTag: rel.semanticTag
            };
            if (!snomedConcept.semanticTag) {
                const match = rel.fsn.match(/\(([^)]+)\)$/);
                if (match) {
                    snomedConcept.semanticTag = match[1];
                }
            }
        }

        const formValue: any = {
            name: term,
            snomedConcept: snomedConcept,
            brand: null
        };

        if (supply.semanticTag === 'fármaco de uso clínico comercial') {
            const parsed = this.parseSupplyTerm(supply);
            if (parsed.brand) {
                formValue.brand = parsed.brand;
            }
        }

        // Update the whole form group with known structure
        this.parentForm.setValue(formValue, { emitEvent: false });
    }

    private toTitleCase(str: string): string {
        if (!str) { return ''; }
        return str.toLowerCase().split(' ').map(word => {
            return (word.charAt(0).toUpperCase() + word.slice(1));
        }).join(' ');
    }
}
