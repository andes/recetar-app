import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MixedPrescription } from '../../services/dispense.service';
import { Prescriptions } from '@interfaces/prescriptions';
import AndesPrescriptions from '@interfaces/andesPrescriptions';

@Component({
    selector: 'app-dispense-drawer',
    templateUrl: './dispense-drawer.component.html',
    styleUrls: ['./dispense-drawer.component.sass'],
    standalone: false
})
export class DispenseDrawerComponent {

    @Input() prescription: MixedPrescription | null = null;
    @Input() open = false;

    @Output() closed = new EventEmitter<void>();
    @Output() print = new EventEmitter<MixedPrescription>();
    @Output() dispense = new EventEmitter<MixedPrescription>();
    @Output() cancelDispense = new EventEmitter<MixedPrescription>();

    isAndes(item: MixedPrescription): item is AndesPrescriptions {
        return 'estadoActual' in item;
    }

    getCode(): string {
        if (!this.prescription) { return ''; }
        if (this.isAndes(this.prescription)) {
            return this.prescription.idAndes || this.prescription._id || '';
        }
        return (this.prescription as Prescriptions).prescriptionId || this.prescription._id || '';
    }

    getSourceLabel(): string {
        if (!this.prescription) { return ''; }
        return this.isAndes(this.prescription) ? 'Andes' : 'RecetAR';
    }

    getPatientName(): string {
        if (!this.prescription) { return ''; }
        if (this.isAndes(this.prescription)) {
            return `${this.prescription.paciente?.apellido || ''}, ${this.prescription.paciente?.nombre || ''}`.replace(/^,\s*/, '');
        }
        return `${this.prescription.patient?.lastName || ''}, ${this.prescription.patient?.firstName || ''}`.replace(/^,\s*/, '');
    }

    getPatientDni(): string {
        if (!this.prescription) { return ''; }
        return this.isAndes(this.prescription)
            ? (this.prescription.paciente?.documento || '')
            : (this.prescription.patient?.dni || '');
    }

    getProfessionalName(): string {
        if (!this.prescription) { return ''; }
        if (this.isAndes(this.prescription)) {
            return (this.prescription.profesional as unknown as { nombre?: string })?.nombre || '';
        }
        return this.prescription.professional?.businessName || '';
    }

    getProfessionalEnrollment(): string {
        if (!this.prescription) { return ''; }
        if (this.isAndes(this.prescription)) {
            return String((this.prescription.profesional as unknown as { matricula?: string | number })?.matricula || '');
        }
        return this.prescription.professional?.enrollment || '';
    }

    getPrescriptionDate(): string {
        if (!this.prescription) { return ''; }
        if (this.isAndes(this.prescription)) {
            return String(this.prescription.fechaPrestacion || this.prescription.fechaRegistro || '');
        }
        return String(this.prescription.date || '');
    }

    getMedicationName(): string {
        if (!this.prescription) { return ''; }
        return this.isAndes(this.prescription)
            ? (this.prescription.medicamento?.concepto?.term || '')
            : (this.prescription.supplies?.[0]?.supply?.name || '');
    }

    getQuantity(): number {
        if (!this.prescription) { return 0; }
        if (this.isAndes(this.prescription)) {
            return this.prescription.medicamento?.cantidad || 1;
        }
        return this.prescription.supplies?.reduce((sum, s) => sum + (s.quantity || 1), 0) || 1;
    }

    getDiagnosis(): string {
        if (!this.prescription) { return ''; }
        if (this.isAndes(this.prescription)) {
            return this.prescription.diagnostico?.descripcion || this.prescription.diagnostico?.term || '';
        }
        return this.prescription.diagnostic || this.prescription.supplies?.[0]?.diagnostic || '';
    }

    getIndications(): string {
        if (!this.prescription) { return ''; }
        if (this.isAndes(this.prescription)) {
            return this.prescription.medicamento?.dosisDiaria?.notaMedica || '';
        }
        return this.prescription.supplies?.[0]?.indication || '';
    }

    getStatus(): string {
        if (!this.prescription) { return ''; }
        return this.isAndes(this.prescription)
            ? (this.prescription.estadoActual?.tipo || '')
            : (this.prescription.status || '');
    }

    isPending(): boolean {
        const s = this.getStatus().toLowerCase();
        return s === 'pendiente' || s === 'vigente';
    }

    isDispensed(): boolean {
        const s = this.getStatus().toLowerCase();
        return s === 'dispensada' || s === 'dispensado' || s === 'finalizada';
    }

    close(): void {
        this.closed.emit();
    }

    onOverlayClick(): void {
        this.close();
    }

    onPrint(): void {
        if (this.prescription) { this.print.emit(this.prescription); }
    }

    onDispense(): void {
        if (this.prescription) { this.dispense.emit(this.prescription); }
    }

    onCancelDispense(): void {
        if (this.prescription) { this.cancelDispense.emit(this.prescription); }
    }
}
