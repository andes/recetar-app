import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { PatientsService } from '@services/patients.service';
import { UiToggleComponent, ToggleOption } from '@shared/ui/toggle.component';
import { UiSelectComponent } from '@shared/ui/select.component';
import { UiEmptyStateComponent } from '@shared/ui/empty-state.component';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { OsItemComponent } from './os-item.component';

interface ObraSocialOption {
    nombre: string;
    codigoPuco: string;
}

@Component({
    selector: 'app-os-search',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule, MatButtonModule, MatTooltipModule, UiToggleComponent, UiSelectComponent, UiEmptyStateComponent, FormFieldComponent, OsItemComponent],
    templateUrl: './os-search.component.html',
    styleUrls: ['./os-search.component.sass'],
})
export class OsSearchComponent implements OnInit, OnDestroy, OnChanges {
    @Input() patientDni: string | null = null;
    @Input() patientSex: string | null = null;
    @Input() patientObraSocial: { nombre?: string; codigoPuco?: string; numeroAfiliado?: string } | null = null;
    @Input() patientObrasSociales: ObraSocialOption[] = [];
    @Input() initialObraSocial: { nombre?: string; codigoPuco?: string; numeroAfiliado?: string } | null = null;
    @Input() initialNumeroAfiliado = '';

    @Output() obraSocialChange = new EventEmitter<{ nombre: string; codigoPuco: string; numeroAfiliado: string } | null>();

    osSearchMode: 'own' | 'other' = 'own';
    osSearchCtrl = new FormControl('');
    numAfiliadoCtrl = new FormControl('');
    selectedOs: ObraSocialOption | null = null;
    osSearchResults: ObraSocialOption[] = [];
    isSearchingOS = false;
    osNotFound = false;

    osDisplayFn = (os: ObraSocialOption): string => os.nombre;
    osSubtitleFn = (os: ObraSocialOption): string => os.codigoPuco ? 'PUCO ' + os.codigoPuco : '';
    osTrackByFn = (_i: number, os: ObraSocialOption): string => os.codigoPuco || os.nombre;

    toggleOptions: ToggleOption[] = [
        { value: 'own' as const, label: 'Propias', icon: 'person' },
        { value: 'other' as const, label: 'Otras', icon: 'search' },
    ];

    private destroy$ = new Subject<void>();

    constructor(
        private patientsService: PatientsService,
    ) { }

    ngOnInit(): void {
        this.numAfiliadoCtrl.setValue(this.initialNumeroAfiliado);

        if (this.initialObraSocial?.nombre) {
            this.selectedOs = {
                nombre: this.initialObraSocial.nombre,
                codigoPuco: this.initialObraSocial.codigoPuco || '',
            };
        } else if (this.patientObraSocial?.nombre) {
            this.selectedOs = {
                nombre: this.patientObraSocial.nombre,
                codigoPuco: this.patientObraSocial.codigoPuco || '',
            };
        }

        if (this.selectedOs) {
            this.numAfiliadoCtrl.enable();
        } else {
            this.numAfiliadoCtrl.disable();
        }

        this.loadPatientObrasSociales();

        this.osSearchCtrl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$),
        ).subscribe((term: string | null) => {
            if (this.osSearchMode !== 'other') { return; }
            const t = term || '';
            if (t.length > 1) {
                this.isSearchingOS = true;
                this.osNotFound = false;
                this.doOsSearch(t);
            } else {
                this.osSearchResults = [];
                this.osNotFound = false;
                this.isSearchingOS = false;
            }
        });

        this.numAfiliadoCtrl.valueChanges.pipe(
            takeUntil(this.destroy$),
        ).subscribe(() => this.emitOsChange());
    }

    ngOnChanges(changes: SimpleChanges): void {
        const patientChanged = !!changes['patientDni'] && !changes['patientDni'].firstChange;
        if (patientChanged) {
            this.resetOsState();
            this.loadPatientObrasSociales();
        }
        if (changes['patientSex'] && !changes['patientSex'].firstChange) {
            this.loadPatientObrasSociales();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private resetOsState(): void {
        this.selectedOs = null;
        this.osSearchCtrl.reset('');
        this.osSearchResults = [];
        this.osNotFound = false;
        this.osSearchMode = 'own';

        if (this.patientObraSocial?.nombre) {
            this.selectedOs = {
                nombre: this.patientObraSocial.nombre,
                codigoPuco: this.patientObraSocial.codigoPuco || '',
            };
            this.numAfiliadoCtrl.setValue(this.patientObraSocial.numeroAfiliado || '');
        } else {
            this.numAfiliadoCtrl.reset('');
        }

        if (this.selectedOs) {
            this.numAfiliadoCtrl.enable();
        } else {
            this.numAfiliadoCtrl.disable();
        }
        this.emitOsChange();
    }

    onModeChange(mode: string): void {
        this.osSearchMode = mode as 'own' | 'other';
        this.osSearchResults = [];
        this.osNotFound = false;
        this.osSearchCtrl.reset('');
    }

    selectOsItem(os: ObraSocialOption): void {
        this.selectedOs = os;
        this.osSearchCtrl.reset('');
        this.osSearchResults = [];
        this.numAfiliadoCtrl.enable();

        const isPatientOs = this.patientObraSocial?.nombre === os.nombre
            || this.patientObraSocial?.codigoPuco === os.codigoPuco;
        const isInitialOs = this.initialObraSocial?.nombre === os.nombre
            || this.initialObraSocial?.codigoPuco === os.codigoPuco;

        if ((isPatientOs || isInitialOs) && !this.numAfiliadoCtrl.value) {
            const numero = isInitialOs
                ? this.initialObraSocial?.numeroAfiliado
                : this.patientObraSocial?.numeroAfiliado;
            if (numero) {
                this.numAfiliadoCtrl.setValue(numero);
            }
        }

        this.emitOsChange();
    }

    clearSelectedOs(): void {
        this.selectedOs = null;
        this.numAfiliadoCtrl.disable();
        this.emitOsChange();
    }

    get selectedOsItemData(): { nombre: string; codigoPuco?: string; numeroAfiliado?: string } | null {
        if (!this.selectedOs) { return null; }
        return {
            nombre: this.selectedOs.nombre,
            codigoPuco: this.selectedOs.codigoPuco,
            numeroAfiliado: this.numAfiliadoCtrl.value || undefined,
        };
    }

    private doOsSearch(term: string): void {
        this.patientsService.searchObrasSociales(term).pipe(
            takeUntil(this.destroy$),
        ).subscribe((res: unknown) => {
            this.isSearchingOS = false;
            const data = res as { nombre?: string; codigoPuco?: string }[];
            if (Array.isArray(data)) {
                this.osSearchResults = data
                    .filter(os => os?.nombre && os?.codigoPuco)
                    .map(os => ({
                        nombre: os.nombre!,
                        codigoPuco: os.codigoPuco!,
                    }));
                this.osNotFound = this.osSearchResults.length === 0;
            }
        });
    }

    private loadPatientObrasSociales(): void {
        if (this.patientObrasSociales.length > 0) {
            return;
        }
        if (!this.patientDni || !this.patientSex) { return; }
        this.patientsService.getPatientOSByDni(this.patientDni, this.patientSex).pipe(
            takeUntil(this.destroy$),
        ).subscribe((res: unknown) => {
            const data = Array.isArray(res) ? res : (res ? [res] : []);
            this.patientObrasSociales = (data as { nombre?: string; codigoPuco?: number }[])
                .filter(os => os?.nombre)
                .map(os => ({
                    nombre: os.nombre!,
                    codigoPuco: String(os.codigoPuco || ''),
                }));
        });
    }

    private emitOsChange(): void {
        if (!this.selectedOs?.nombre) {
            this.obraSocialChange.emit(null);
        } else {
            this.obraSocialChange.emit({
                nombre: this.selectedOs.nombre,
                codigoPuco: this.selectedOs.codigoPuco,
                numeroAfiliado: this.numAfiliadoCtrl.value || '',
            });
        }
    }
}
