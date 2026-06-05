import { Component, Input, Output, EventEmitter, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MixedPrescription } from '../../services/dispense.service';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { getStatusVariant, getStatusLabel } from '@shared/utils/status.utils';
import { ColumnDef } from '@shared/ui/table.component';

@Component({
    selector: 'app-dispense-table',
    templateUrl: './dispense-table.component.html',
    styleUrls: ['./dispense-table.component.sass'],
    standalone: false
})
export class DispenseTableComponent implements OnInit {

    @Input() loading = false;
    @Input() total = 0;
    @Input() pageIndex = 0;
    @Input() pageSize = 10;

    @Input() set dataSource(value: MixedPrescription[]) {
        this.items = value || [];
    }

    @Output() rowSelect = new EventEmitter<MixedPrescription>();
    @Output() dispense = new EventEmitter<MixedPrescription>();
    @Output() print = new EventEmitter<MixedPrescription>();
    @Output() viewDetail = new EventEmitter<MixedPrescription>();
    @Output() cancelDispense = new EventEmitter<MixedPrescription>();
    @Output() pageChange = new EventEmitter<PageEvent>();

    @ViewChild('fechaCell', { static: true, read: TemplateRef }) fechaCell!: TemplateRef<any>;
    @ViewChild('medicamentoCell', { static: true, read: TemplateRef }) medicamentoCell!: TemplateRef<any>;
    @ViewChild('estadoCell', { static: true, read: TemplateRef }) estadoCell!: TemplateRef<any>;
    @ViewChild('accionesCell', { static: true, read: TemplateRef }) accionesCell!: TemplateRef<any>;

    items: MixedPrescription[] = [];
    columns: ColumnDef[] = [];

    getStatusVariant = getStatusVariant;
    getStatusLabel = getStatusLabel;

    ngOnInit(): void {
        this.columns = [
            { name: 'fecha', header: 'Fecha', cell: this.fechaCell },
            { name: 'medicamento', header: 'Prescripción', cell: this.medicamentoCell },
            { name: 'estado', header: 'Estado', cell: this.estadoCell },
            { name: 'acciones', header: '', cell: this.accionesCell, stopPropagation: true },
        ];
    }

    isAndes(item: MixedPrescription): item is AndesPrescriptions {
        return 'estadoActual' in item;
    }

    getDate(item: MixedPrescription): string {
        if (this.isAndes(item)) {
            return (item.fechaPrestacion || item.fechaRegistro || '') as string;
        }
        return (item.date || '') as string;
    }

    getMedicationName(item: MixedPrescription): string {
        return this.isAndes(item)
            ? (item.medicamento?.concepto?.term || '')
            : (item.supplies?.[0]?.supply?.name || '');
    }

    getMedicationType(item: MixedPrescription): 'duplicado' | 'triplicado' | null {
        if (this.isAndes(item)) { return null; }
        if (item.supplies?.some((s) => s.triplicate)) { return 'triplicado'; }
        if (item.supplies?.some((s) => s.duplicate)) { return 'duplicado'; }
        return null;
    }

    getPatientFullName(item: MixedPrescription): string {
        if (this.isAndes(item)) {
            return `${item.paciente?.apellido || ''}, ${item.paciente?.nombre || ''}`.replace(/^,\s*/, '');
        }
        return `${item.patient?.lastName || ''}, ${item.patient?.firstName || ''}`.replace(/^,\s*/, '');
    }

    getPatientDni(item: MixedPrescription): string {
        return this.isAndes(item)
            ? (item.paciente?.documento || '')
            : (item.patient?.dni || '');
    }

    getProfessionalName(item: MixedPrescription): string {
        if (this.isAndes(item)) {
            return (item.profesional as unknown as { nombre?: string })?.nombre || '';
        }
        return item.professional?.businessName || '';
    }

    getQuantity(item: MixedPrescription): number {
        if (this.isAndes(item)) {
            return item.medicamento?.cantidad || 1;
        }
        return item.supplies?.reduce((sum, s) => sum + (s.quantity || 1), 0) || 1;
    }

    getStatus(item: MixedPrescription): string {
        return this.isAndes(item)
            ? (item.estadoActual?.tipo || '')
            : (item.status || '');
    }

    isExpired(item: MixedPrescription): boolean {
        return this.getStatus(item).toLowerCase() === 'vencida';
    }

    isPending(item: MixedPrescription): boolean {
        const s = this.getStatus(item).toLowerCase();
        return s === 'pendiente' || s === 'vigente';
    }

    isDispensed(item: MixedPrescription): boolean {
        const s = this.getStatus(item).toLowerCase();
        return s === 'dispensada' || s === 'dispensado' || s === 'finalizada';
    }

    isNearExpiry(item: MixedPrescription): boolean {
        if (!this.isPending(item)) { return false; }
        const now = Date.now();
        const date = this.isAndes(item)
            ? new Date(item.fechaRegistro || item.fechaPrestacion || now).getTime()
            : new Date(item.date).getTime();
        const hoursLeft = (date + 30 * 24 * 60 * 60 * 1000 - now) / (1000 * 60 * 60);
        return hoursLeft <= 48 && hoursLeft > 0;
    }

    canCounterDispense(item: MixedPrescription): boolean {
        if (!this.isDispensed(item)) { return false; }
        const dispensedAt = this.isAndes(item)
            ? item.estadoDispensaActual?.fecha
            : item.dispensedAt;
        if (!dispensedAt) { return false; }
        const elapsed = (Date.now() - new Date(dispensedAt).getTime()) / (1000 * 60 * 60);
        return elapsed < 2;
    }

    onRowClick(item: MixedPrescription): void {
        this.rowSelect.emit(item);
    }

    onViewDetail(item: MixedPrescription): void {
        this.viewDetail.emit(item);
    }

    onPrint(item: MixedPrescription): void {
        this.print.emit(item);
    }

    onDispense(item: MixedPrescription): void {
        this.dispense.emit(item);
    }

    onCancelDispense(item: MixedPrescription): void {
        this.cancelDispense.emit(item);
    }

    onPage(event: PageEvent): void {
        this.pageChange.emit(event);
    }
}
