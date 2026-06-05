import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { VademecumService, VademecumPaginatedResponse } from '@services/vademecum.service';
import { VademecumEntry } from '@interfaces/vademecum';
import { SnomedSuppliesService, SnomedPaginatedResponse } from '@services/snomedSupplies.service';
import { NotificationService } from '@shared/services/notification.service';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, catchError, takeUntil } from 'rxjs/operators';
import { FrequencyTrackerService } from '@shared/services/frequency-tracker.service';
import { FrequentMedication, MedicationItem, PrescriptionItemResult } from '../../../models/prescription-draft';
import { toFrequentMedication, fromFrequentMedication } from '../../../models/medication-adapter';

function noWhitespaceValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        if (!control.value) { return null; }
        const isWhitespace = (control.value || '').trim().length === 0;
        return isWhitespace ? { 'whitespace': { value: control.value } } : null;
    };
}

@Component({
    selector: 'app-medication-search',
    templateUrl: './medication-search.component.html',
    styleUrls: ['./medication-search.component.sass'],
    standalone: false
})
export class MedicationSearchComponent implements OnInit, OnDestroy, OnChanges {
    @Input() disabled = false;
    @Input() editMedicationIndex: number | null = null;
    @Input() editMedication: MedicationItem | null = null;
    @Output() medicationAdded = new EventEmitter<MedicationItem>();
    @Output() medicationUpdated = new EventEmitter<{ item: MedicationItem; index: number }>();
    @Output() editCancelled = new EventEmitter<void>();

    medSearchForm: FormGroup;

    filteredMedications: PrescriptionItemResult[] = [];
    frequentMedications: FrequentMedication[] = [];
    showMedResults = false;
    isSearchingMed = false;
    medNotFound = false;

    pendingMedication: PrescriptionItemResult | null = null;
    showMedDetail = false;

    detailForm: FormGroup;
    medDuplicate = false;
    medTriplicate = false;

    searchMode: 'commercial' | 'generic' = 'commercial';
    currentPage = 0;
    pageSize = 10;
    totalResults = 0;

    toggleOptions = [
        { value: 'commercial' as const, label: 'Comercial', icon: 'medication' },
        { value: 'generic' as const, label: 'Genérico', icon: 'science' },
    ];

    @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

    get showFrequentMedications(): boolean {
        return !this.showMedResults && !this.isSearchingMed && !this.medNotFound;
    }

    get medicationCtrl(): FormControl {
        return this.medSearchForm?.get('medication') as FormControl;
    }

    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private vademecumService: VademecumService,
        private snomedSuppliesService: SnomedSuppliesService,
        private frequencyTracker: FrequencyTrackerService,
        private notification: NotificationService,
    ) { }

    ngOnInit(): void {
        this.medSearchForm = this.fb.group({ medication: [''] });
        this.detailForm = this.fb.group({
            quantity: [1, [Validators.required, Validators.min(1)]],
            diagnostic: ['', [Validators.required, noWhitespaceValidator()]],
            indication: [''],
            serie: [{ value: '', disabled: true }],
            numero: [{ value: '', disabled: true }]
        });
        this.frequentMedications = this.loadFrequentMedications();

        if (this.editMedication) {
            this.enterEditMode(this.editMedication);
        }

        this.medSearchForm.get('medication')!.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe((term: string) => {
            if (typeof term === 'string' && term.length > 2) {
                this.isSearchingMed = true;
                this.showMedResults = true;
                this.medNotFound = false;
                this.currentPage = 0;
                this.doSearch(term);
            } else {
                this.filteredMedications = [];
                this.showMedResults = false;
                this.medNotFound = false;
                this.isSearchingMed = false;
                this.totalResults = 0;
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['editMedication']?.currentValue && !changes['editMedication'].firstChange) {
            this.enterEditMode(this.editMedication!);
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onModeChange(): void {
        this.currentPage = 0;
        this.pageSize = 10;
        const term = this.medSearchForm.get('medication')!.value;
        if (typeof term === 'string' && term.length > 2) {
            this.isSearchingMed = true;
            this.doSearch(term);
        }
    }

    onPageChange(event: PageEvent): void {
        this.currentPage = event.pageIndex;
        this.pageSize = event.pageSize;
        this.isSearchingMed = true;
        const term = this.medSearchForm.get('medication')!.value;
        if (typeof term === 'string') {
            this.doSearch(term);
        }
    }

    private doSearch(term: string): void {
        const offset = this.currentPage * this.pageSize;

        if (this.searchMode === 'commercial') {
            this.vademecumService.searchMedications(term, offset, this.pageSize).pipe(
                takeUntil(this.destroy$),
                catchError(() => of({ results: [], total: 0 } as VademecumPaginatedResponse))
            ).subscribe((data: VademecumPaginatedResponse) => {
                this.isSearchingMed = false;
                this.filteredMedications = data.results.map(entry => ({ kind: 'commercial' as const, entry }));
                this.totalResults = data.total;
                this.showMedResults = data.results.length > 0;
                this.medNotFound = data.results.length === 0;
            });
        } else {
            this.snomedSuppliesService.get(term, offset, this.pageSize).pipe(
                takeUntil(this.destroy$),
                catchError(() => of({ results: [], total: 0 } as SnomedPaginatedResponse))
            ).subscribe((data: SnomedPaginatedResponse) => {
                this.isSearchingMed = false;
                this.filteredMedications = data.results.map(concept => ({ kind: 'generic' as const, concept }));
                this.totalResults = data.total;
                this.showMedResults = data.results.length > 0;
                this.medNotFound = data.results.length === 0;
            });
        }
    }

    private enterEditMode(medication: MedicationItem): void {
        if (medication.supply) {
            this.pendingMedication = { kind: 'commercial', entry: medication.supply };
        } else if (medication.snomedConcept) {
            this.pendingMedication = { kind: 'generic', concept: medication.snomedConcept };
        }
        this.showMedDetail = true;
        this.medDuplicate = medication.duplicate;
        this.medTriplicate = medication.triplicate;
        if (medication.triplicate) {
            this.setTriplicateFieldsEnabled(true);
        }
        this.detailForm.patchValue({
            quantity: medication.quantity,
            diagnostic: medication.diagnostic,
            indication: medication.indication,
            serie: medication.serie || '',
            numero: medication.numero || ''
        });
    }

    selectMedication(result: PrescriptionItemResult): void {
        this.showMedResults = false;
        this.medNotFound = false;
        this.pendingMedication = result;
        this.showMedDetail = true;
        this.medDuplicate = false;
        this.medTriplicate = false;
        this.setTriplicateFieldsEnabled(false);
        this.detailForm.reset({
            quantity: 1,
            diagnostic: '',
            indication: '',
            serie: '',
            numero: ''
        });
    }

    onTriplicateChange(checked: boolean): void {
        this.medTriplicate = checked;
        if (checked) {
            this.medDuplicate = false;
            this.setTriplicateFieldsEnabled(true);
        } else {
            this.setTriplicateFieldsEnabled(false);
        }
    }

    onDuplicateChange(checked: boolean): void {
        this.medDuplicate = checked;
        if (checked) {
            this.medTriplicate = false;
            this.setTriplicateFieldsEnabled(false);
        }
    }

    private setTriplicateFieldsEnabled(enabled: boolean): void {
        const serie = this.detailForm.get('serie')!;
        const numero = this.detailForm.get('numero')!;
        if (enabled) {
            serie.enable();
            serie.setValidators([Validators.required, Validators.maxLength(1), Validators.pattern('^[a-zA-Z]$')]);
            serie.markAsUntouched();
            numero.enable();
            numero.setValidators([Validators.required]);
            numero.markAsUntouched();
        } else {
            serie.disable();
            serie.clearValidators();
            serie.reset();
            numero.disable();
            numero.clearValidators();
            numero.reset();
        }
        serie.updateValueAndValidity();
        numero.updateValueAndValidity();
    }

    selectFrequentMedication(med: FrequentMedication): void {
        this.selectMedication(fromFrequentMedication(med));
    }

    confirmMedication(): void {
        if (!this.pendingMedication) { return; }

        if (this.detailForm.invalid) {
            this.detailForm.markAllAsTouched();
            return;
        }

        const fv = this.detailForm.value;
        const detail = {
            quantity: fv.quantity || 1,
            packageQuantity: 1,
            diagnostic: fv.diagnostic || '',
            indication: fv.indication || '',
            duplicate: this.medDuplicate,
            triplicate: this.medTriplicate,
            serie: fv.serie || '',
            numero: fv.numero || '',
        };

        if (this.pendingMedication.kind === 'commercial') {
            const entry = this.pendingMedication.entry;

            if (entry.snomed && entry.snomed.trim()) {
                this.snomedSuppliesService.getByConceptId(entry.snomed).pipe(
                    takeUntil(this.destroy$)
                ).subscribe((snomedConcept) => {
                    const item: MedicationItem = {
                        supply: entry,
                        snomedConcept: snomedConcept || {
                            conceptId: entry.snomed,
                            term: entry.droga_descrip || entry.nombre,
                            fsn: entry.droga_descrip || entry.nombre,
                            semanticTag: 'producto'
                        },
                        ...detail
                    };
                    this.emitAndNotify(item, entry);
                });
                return;
            }

            const item: MedicationItem = { supply: entry, ...detail };
            this.emitAndNotify(item, entry);
        } else {
            const concept = this.pendingMedication.concept;
            const item: MedicationItem = { snomedConcept: concept, ...detail };
            const frequent = toFrequentMedication(this.pendingMedication);
            this.recordFrequencyAndNotify(frequent, item, concept.term);
        }
    }

    private recordFrequencyAndNotify(
        frequent: FrequentMedication,
        item: MedicationItem,
        displayName: string,
    ): void {
        this.frequencyTracker.recordUsage(
            'prescriptions',
            frequent.id,
            frequent as unknown as Record<string, unknown>,
        );
        this.frequentMedications = this.loadFrequentMedications();
        if (this.editMedicationIndex != null && this.editMedication) {
            this.notification.success('Medicamento actualizado');
            this.medicationUpdated.emit({ item, index: this.editMedicationIndex });
        } else {
            this.notification.success(this.addedMedicationMsg(displayName));
            this.medicationAdded.emit(item);
        }
        this.cancelMedicationDetail();
    }

    private emitAndNotify(item: MedicationItem, entry: VademecumEntry): void {
        const frequent = toFrequentMedication({
            kind: 'commercial',
            entry,
        });
        this.recordFrequencyAndNotify(frequent, item, entry.nombre);
    }

    cancelMedicationDetail(): void {
        if (this.editMedicationIndex != null) {
            this.editCancelled.emit();
        }
        this.pendingMedication = null;
        this.showMedDetail = false;
    }

    private loadFrequentMedications(): FrequentMedication[] {
        return this.frequencyTracker.getTopFrequent('prescriptions')
            .map(r => r.data as unknown as FrequentMedication)
            .filter(m => m.kind && m.name);
    }

    private addedMedicationMsg(name: string): string {
        const max = 45;
        const truncated = name.length > max ? name.slice(0, max) + '...' : name;
        return `${truncated}\nAgregado a la receta`;
    }

    trackByMed(index: number, item: PrescriptionItemResult): string {
        if (item.kind === 'commercial') { return 'vad' + item.entry.id; }
        return 'sno' + item.concept.conceptId;
    }

    trackByFreqMed(index: number, item: FrequentMedication): string {
        return item.id;
    }
}
