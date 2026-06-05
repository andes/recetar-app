import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Prescriptions } from '@interfaces/prescriptions';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { Certificate } from '@interfaces/certificate';
import { Practice } from '@interfaces/practices';
import type { Insumo } from '@services/stock.service';
import { getStatusVariant, getStatusLabel } from '@shared/utils/status.utils';

export type DocumentItemType = 'receta' | 'certificados' | 'practicas' | 'insumos';
export type DocumentItemData = Prescriptions | AndesPrescriptions | Certificate | Practice | Insumo;

@Component({
    selector: 'app-document-item',
    templateUrl: './document-item.component.html',
    styleUrls: ['./document-item.component.sass'],
    standalone: false
})
export class DocumentItemComponent {
    @Input() type: DocumentItemType = 'receta';
    @Input() document!: DocumentItemData;
    @Input() selected = false;

    @Output() select = new EventEmitter<DocumentItemData>();
    @Output() print = new EventEmitter<DocumentItemData>();
    @Output() remove = new EventEmitter<DocumentItemData>();
    @Output() anulate = new EventEmitter<DocumentItemData>();

    getStatusVariant = getStatusVariant;
    getStatusLabel = getStatusLabel;

    private get isAndesPrescription(): boolean {
        return this.type === 'receta' && 'paciente' in (this.document as object) && !('patient' in (this.document as object));
    }

    private get andes(): AndesPrescriptions | null {
        return this.isAndesPrescription ? (this.document as AndesPrescriptions) : null;
    }

    private get local(): Prescriptions | null {
        return (!this.isAndesPrescription && this.type === 'receta') ? (this.document as Prescriptions) : null;
    }

    private get certificate(): Certificate | null {
        return this.type === 'certificados' ? (this.document as Certificate) : null;
    }

    private get practice(): Practice | null {
        return this.type === 'practicas' ? (this.document as Practice) : null;
    }

    private get insumo(): Insumo | null {
        return this.type === 'insumos' ? (this.document as Insumo) : null;
    }

    get icon(): string {
        switch (this.type) {
            case 'certificados': return 'verified';
            case 'practicas': return 'stethoscope';
            case 'insumos': return 'healing';
            default: return 'pill';
        }
    }

    get title(): string {
        const andes = this.andes;
        if (andes) { return andes.medicamento?.concepto?.term || ''; }
        if (this.local) { return this.local.supplies?.map((s) => s.supply?.name || '').join(', ') || ''; }
        if (this.certificate) { return this.certificate.certificate || ''; }
        if (this.practice) { return this.practice.practice || ''; }
        if (this.insumo) { return this.insumo.name || this.insumo.insumo || this.insumo.supply || ''; }
        return '';
    }

    get subtitle(): string {
        if (this.certificate) {
            const days = this.certificate.cantDias;
            return days ? `${days} día(s)` : '';
        }
        if (this.practice) { return this.practice.diagnostic || ''; }
        if (this.insumo) { return this.insumo.tipo || this.insumo.type || ''; }
        return '';
    }

    get medicationDetail(): string {
        const andes = this.andes;
        if (andes) { return andes.medicamento?.concepto?.fsn || ''; }
        const first = this.local?.supplies?.[0];
        const supply = first?.supply as unknown as Record<string, unknown> | undefined;
        if (!supply) { return ''; }
        const parts: string[] = [];
        const activePrinciple = (supply['activePrinciple'] as string) || (supply['droga_descrip'] as string) || '';
        const firstPres = (supply['firstPresentation'] as string) || first?.quantityPresentation || '';
        const power = (supply['power'] as string) || '';
        const unity = (supply['unity'] as string) || '';
        if (activePrinciple) { parts.push(String(activePrinciple)); }
        if (firstPres) { parts.push(String(firstPres)); }
        if (power) { parts.push(`${power}${unity || ''}`); }
        return parts.join(' · ');
    }

    get medicineType(): 'duplicado' | 'triplicado' | null {
        const supplies = this.local?.supplies;
        if (!supplies) { return null; }
        if (supplies.some((s) => s.triplicate)) { return 'triplicado'; }
        if (supplies.some((s) => s.duplicate)) { return 'duplicado'; }
        return null;
    }

    get patientFullName(): string {
        const andes = this.andes;
        if (andes) {
            return `${andes.paciente?.apellido || ''}, ${andes.paciente?.nombre || ''}`.replace(/^,\s*/, '');
        }
        if (this.local) {
            return `${this.local.patient?.lastName || ''}, ${this.local.patient?.firstName || ''}`.replace(/^,\s*/, '');
        }
        const doc = (this.certificate || this.practice) as Certificate | Practice | null;
        if (doc) {
            return `${doc.patient?.lastName || ''}, ${doc.patient?.firstName || ''}`.replace(/^,\s*/, '');
        }
        return '';
    }

    get patientDni(): string {
        const andes = this.andes;
        if (andes) { return andes.paciente?.documento || ''; }
        if (this.local) { return this.local.patient?.dni || ''; }
        const doc = (this.certificate || this.practice) as Certificate | Practice | null;
        return doc?.patient?.dni || '';
    }

    get hasPatient(): boolean {
        return this.type !== 'insumos';
    }

    get status(): string {
        const andes = this.andes;
        if (andes) { return andes.estadoActual?.tipo || ''; }
        if (this.local) { return this.local.status || ''; }
        if (this.certificate) {
            if (this.certificate.anulateDate) { return 'anulada'; }
            const now = new Date();
            if (this.certificate.endDate && this.certificate.endDate < now) { return 'vencida'; }
            if (this.certificate.startDate && this.certificate.startDate > now) { return 'pendiente'; }
            return 'vigente';
        }
        if (this.practice) { return this.practice.status || ''; }
        if (this.insumo) { return this.insumo.estado || this.insumo.status || ''; }
        return '';
    }

    get statusLabel(): string {
        if (this.certificate) {
            if (this.certificate.anulateDate) { return 'Anulado'; }
            const now = new Date();
            if (this.certificate.endDate && this.certificate.endDate < now) { return 'Vencido'; }
            if (this.certificate.startDate && this.certificate.startDate > now) { return 'Pendiente'; }
            return 'Vigente';
        }
        if (this.insumo) {
            const s = this.status;
            return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '—';
        }
        return getStatusLabel(this.status);
    }

    get statusVariant(): string {
        if (this.insumo) {
            const s = this.status.toLowerCase();
            if (s === 'activo' || s === 'active') { return 'success'; }
            if (s === 'inactivo') { return 'error'; }
            return 'info';
        }
        if (this.certificate) {
            if (this.certificate.anulateDate) { return 'error'; }
            const now = new Date();
            if (this.certificate.endDate && this.certificate.endDate < now) { return 'error'; }
            if (this.certificate.startDate && this.certificate.startDate > now) { return 'warning'; }
            return 'success';
        }
        return getStatusVariant(this.status);
    }

    get date(): Date | null {
        const andes = this.andes;
        if (andes) {
            const raw = andes.fechaPrestacion || andes.fechaRegistro;
            return raw ? new Date(raw) : null;
        }
        if (this.local) { return this.local.date ? new Date(this.local.date) : null; }
        if (this.certificate) { return this.certificate.createdAt ? new Date(this.certificate.createdAt) : null; }
        if (this.practice) { return this.practice.date ? new Date(this.practice.date) : null; }
        if (this.insumo) { return this.insumo.createdAt ? new Date(this.insumo.createdAt) : null; }
        return null;
    }

    get canPrint(): boolean {
        return this.type === 'receta' || this.type === 'certificados' || this.type === 'practicas';
    }

    get canRemove(): boolean {
        return this.type === 'receta' || this.type === 'practicas';
    }

    get canAnulate(): boolean {
        return this.type === 'certificados' && !this.certificate?.anulateDate;
    }

    onSelect(): void {
        this.select.emit(this.document);
    }

    onPrint(): void {
        this.print.emit(this.document);
    }

    onRemove(): void {
        this.remove.emit(this.document);
    }

    onAnulate(): void {
        this.anulate.emit(this.document);
    }
}
