import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import moment from 'moment';

export interface DispenseFilterValues {
    searchTerm: string;
    dateFrom: string;
    dateTo: string;
    status: string;
}

@Component({
    selector: 'app-dispense-filters-bar',
    templateUrl: './dispense-filters-bar.component.html',
    styleUrls: ['./dispense-filters-bar.component.sass'],
    standalone: false
})
export class DispenseFiltersBarComponent implements OnInit {

    @Output() applyFilters = new EventEmitter<DispenseFilterValues>();
    @Output() refresh = new EventEmitter<void>();

    searchControl = new FormControl('');
    dateFromControl = new FormControl('');
    dateToControl = new FormControl('');
    statusControl = new FormControl('');

    showFilters = false;

    statusOptions = [
        { value: '', label: 'Todos los estados' },
        { value: 'pendiente', label: 'Pendiente / Vigente' },
        { value: 'dispensada', label: 'Dispensada' },
        { value: 'vencida', label: 'Vencida' },
        { value: 'finalizada', label: 'Finalizada' },
        { value: 'suspendida', label: 'Suspendida' },
        { value: 'rechazada', label: 'Rechazada' },
    ];

    get hasActiveFilters(): boolean {
        return !!(this.dateFromControl.value || this.dateToControl.value || this.statusControl.value);
    }

    get activeFilterCount(): number {
        return (this.dateFromControl.value ? 1 : 0)
            + (this.dateToControl.value ? 1 : 0)
            + (this.statusControl.value ? 1 : 0);
    }

    constructor() { }

    ngOnInit(): void {
    }

    onSearch(): void {
        this.emitFilters();
    }

    onClear(): void {
        this.searchControl.setValue('', { emitEvent: false });
        this.dateFromControl.setValue('', { emitEvent: false });
        this.dateToControl.setValue('', { emitEvent: false });
        this.statusControl.setValue('', { emitEvent: false });
        this.emitFilters();
    }

    onRefresh(): void {
        this.refresh.emit();
    }

    private emitFilters(): void {
        const dateFrom = this.dateFromControl.value;
        const dateTo = this.dateToControl.value;
        this.applyFilters.emit({
            searchTerm: (this.searchControl.value || '').trim(),
            dateFrom: dateFrom ? moment(dateFrom).format('YYYY-MM-DD') : '',
            dateTo: dateTo ? moment(dateTo).format('YYYY-MM-DD') : '',
            status: this.statusControl.value || '',
        });
    }
}
