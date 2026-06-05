import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VademecumService, VademecumPaginatedResponse } from '@services/vademecum.service';
import { VademecumEntry } from '@interfaces/vademecum';
import { NotificationService } from '@shared/services/notification.service';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, catchError, takeUntil } from 'rxjs/operators';
import { FrequencyTrackerService } from '@shared/services/frequency-tracker.service';
import { FrequentMedication, MedicationItem, toFrequentMedication, fromFrequentMedication } from '@shared/models/medication.types';
import { UiEmptyStateComponent } from '@shared/ui/empty-state.component';
import { UiSearchBarComponent } from '@shared/ui/search-bar.component';
import { UiSectionDividerComponent } from '@shared/ui/section-divider.component';
import { UiCardComponent } from '@shared/ui/card.component';
import { MedicationItemComponent } from '@shared/ui/medication-item.component';
import { OsSearchComponent } from '@shared/components/os-search/os-search.component';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';

function noWhitespaceValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        if (!control.value) { return null; }
        const isWhitespace = (control.value || '').trim().length === 0;
        return isWhitespace ? { 'whitespace': { value: control.value } } : null;
    };
}

@Component({
    standalone: true,
    selector: 'app-medication-search',
    templateUrl: './medication-search.component.html',
    styleUrls: ['./medication-search.component.sass'],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatPaginatorModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        UiEmptyStateComponent,
        UiSearchBarComponent,
        UiSectionDividerComponent,
        UiCardComponent,
        MedicationItemComponent,
        OsSearchComponent,
        FormFieldComponent,
    ],
})
export class MedicationSearchComponent implements OnInit, OnDestroy, OnChanges {
    @Input() disabled = false;
    @Input() simplified = false;
    @Input() editMedicationIndex: number | null = null;
    @Input() editMedication: MedicationItem | null = null;
    @Input() patientObraSocial: { nombre?: string; codigoPuco?: string; numeroAfiliado?: string } | null = null;
    @Input() patientDni: string | null = null;
    @Input() patientSex: string | null = null;
    @Input() patientObrasSociales: { nombre: string; codigoPuco: string }[] = [];
    @Output() medicationAdded = new EventEmitter<MedicationItem>();
    @Output() medicationUpdated = new EventEmitter<{ item: MedicationItem; index: number }>();
    @Output() editCancelled = new EventEmitter<void>();

    medSearchForm: FormGroup;

    filteredMedications: VademecumEntry[] = [];
    frequentMedications: FrequentMedication[] = [];
    showMedResults = false;
    isSearchingMed = false;
    medNotFound = false;

    pendingMedication: VademecumEntry | null = null;
    showMedDetail = false;

    detailForm: FormGroup;
    medDuplicate = false;
    medTriplicate = false;

    obraSocialInfo: { nombre: string; codigoPuco: string; numeroAfiliado: string } | null = null;

    currentPage = 0;
    pageSize = 10;
    totalResults = 0;

    @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

    get showFrequentMedications(): boolean {
        return !this.simplified && !this.showMedResults && !this.isSearchingMed && !this.medNotFound;
    }

    get medicationCtrl(): FormControl {
        return this.medSearchForm?.get('medication') as FormControl;
    }

    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private vademecumService: VademecumService,
        private frequencyTracker: FrequencyTrackerService,
        private notification: NotificationService,
    ) { }

    ngOnInit(): void {
        this.medSearchForm = this.fb.group({ medication: [''] });
        this.detailForm = this.fb.group({
            quantity: [1, [Validators.required, Validators.min(1)]],
            diagnostic: this.simplified ? [''] : ['', [Validators.required, noWhitespaceValidator()]],
            indication: [''],
            serie: [{ value: '', disabled: true }],
            numero: [{ value: '', disabled: true }],
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

        this.vademecumService.searchMedications(term, offset, this.pageSize).pipe(
            takeUntil(this.destroy$),
            catchError(() => of({ results: [], total: 0 } as VademecumPaginatedResponse))
        ).subscribe((data: VademecumPaginatedResponse) => {
            this.isSearchingMed = false;
            this.filteredMedications = data.results;
            this.totalResults = data.total;
            this.showMedResults = data.results.length > 0;
            this.medNotFound = data.results.length === 0;
        });
    }

    private enterEditMode(medication: MedicationItem): void {
        if (!medication.supply) {
            this.pendingMedication = null;
            this.showMedDetail = false;
            this.medDuplicate = false;
            this.medTriplicate = false;
            this.setTriplicateFieldsEnabled(false);
            return;
        }
        this.pendingMedication = medication.supply;
        this.showMedDetail = true;
        this.medDuplicate = medication.duplicate;
        this.medTriplicate = medication.triplicate;
        if (medication.triplicate) {
            this.setTriplicateFieldsEnabled(true);
        }
        const medHasOs = !!medication.obraSocial?.nombre;
        this.obraSocialInfo = medHasOs
            ? { nombre: medication.obraSocial!.nombre!, codigoPuco: medication.obraSocial!.codigoPuco || '', numeroAfiliado: medication.obraSocial!.numeroAfiliado || '' }
            : this.patientObraSocial?.nombre
                ? { nombre: this.patientObraSocial.nombre, codigoPuco: this.patientObraSocial.codigoPuco || '', numeroAfiliado: this.patientObraSocial.numeroAfiliado || '' }
                : null;
        this.detailForm.patchValue({
            quantity: medication.quantity,
            diagnostic: medication.diagnostic,
            indication: medication.indication,
            serie: medication.serie || '',
            numero: medication.numero || '',
        });
    }

    selectMedication(result: VademecumEntry): void {
        this.showMedResults = false;
        this.medNotFound = false;
        this.pendingMedication = result;
        this.showMedDetail = true;
        this.medDuplicate = false;
        this.medTriplicate = false;
        this.obraSocialInfo = null;
        this.setTriplicateFieldsEnabled(false);
        this.detailForm.reset({
            quantity: 1,
            diagnostic: '',
            indication: '',
            serie: '',
            numero: '',
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
        const result = fromFrequentMedication(med);
        if ('entry' in result) {
            this.selectMedication(result.entry);
        }
    }

    confirmMedication(): void {
        if (!this.pendingMedication) { return; }

        if (this.simplified) {
            const quantity = this.detailForm.get('quantity')!.value || 1;
            const entry = this.pendingMedication;
            const item: MedicationItem = {
                supply: entry,
                quantity,
                packageQuantity: 1,
                diagnostic: '',
                indication: '',
                duplicate: false,
                triplicate: false,
                serie: '',
                numero: '',
            };
            this.recordFrequencyAndNotify(toFrequentMedication({ kind: 'commercial', entry }), item, entry.nombre);
            return;
        }

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
            obraSocial: !this.obraSocialInfo?.nombre
                ? undefined
                : {
                    nombre: this.obraSocialInfo.nombre,
                    codigoPuco: this.obraSocialInfo.codigoPuco,
                    numeroAfiliado: this.obraSocialInfo.numeroAfiliado,
                },
        };

        const entry = this.pendingMedication;
        const item: MedicationItem = { supply: entry, ...detail };
        this.emitAndNotify(item, entry);
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

    onOsChanged(data: { nombre: string; codigoPuco: string; numeroAfiliado: string } | null): void {
        this.obraSocialInfo = data;
    }

    private loadFrequentMedications(): FrequentMedication[] {
        return this.frequencyTracker.getTopFrequent('prescriptions')
            .map(r => r.data as unknown as FrequentMedication)
            .filter(m => m.kind === 'commercial' && m.name);
    }

    private addedMedicationMsg(_name: string): string {
        return 'Medicamento agregado a la receta';
    }

    trackByMed(index: number, item: VademecumEntry): string {
        return 'vad' + item.id;
    }

    trackByFreqMed(index: number, item: FrequentMedication): string {
        return item.id;
    }
}
