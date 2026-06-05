import { Component, Input } from '@angular/core';
import { MixedPrescription } from '../../services/dispense.service';
import { Prescriptions } from '@interfaces/prescriptions';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { getStatusLabel, getStatusVariant } from '@shared/utils/status.utils';

@Component({
    selector: 'app-dispense-preview-panel',
    templateUrl: './dispense-preview-panel.component.html',
    styleUrls: ['./dispense-preview-panel.component.sass'],
    standalone: false
})
export class DispensePreviewPanelComponent {

    @Input() prescription: MixedPrescription | null = null;

    isAndes(item: MixedPrescription | null): item is AndesPrescriptions {
        return !!item && 'estadoActual' in item;
    }

    get local(): Prescriptions | null {
        if (!this.prescription || this.isAndes(this.prescription)) { return null; }
        return this.prescription as Prescriptions;
    }

    get andes(): AndesPrescriptions | null {
        if (!this.prescription || !this.isAndes(this.prescription)) { return null; }
        return this.prescription as AndesPrescriptions;
    }

    getCode(): string {
        if (!this.prescription) { return ''; }
        if (this.andes) { return this.andes.idAndes || this.andes._id || ''; }
        return (this.local as Prescriptions).prescriptionId || this.prescription._id || '';
    }

    getStatusVariant = getStatusVariant;

    getStatusLabel = getStatusLabel;

    getPatientName(): string {
        const andes = this.andes;
        if (andes) {
            return `${andes.paciente?.apellido || ''}, ${andes.paciente?.nombre || ''}`.replace(/^,\s*/, '');
        }
        const local = this.local;
        return `${local?.patient?.lastName || ''}, ${local?.patient?.firstName || ''}`.replace(/^,\s*/, '');
    }

    getPatientDni(): string {
        const andes = this.andes;
        if (andes) { return andes.paciente?.documento || ''; }
        return this.local?.patient?.dni || '';
    }

    getPatientSex(): string {
        const andes = this.andes;
        if (andes) { return andes.paciente?.sexo || ''; }
        return this.local?.patient?.sex || '';
    }

    getPatientObraSocial(): string {
        const andes = this.andes;
        if (andes) { return andes.paciente?.obraSocial?.nombre || ''; }
        return this.local?.patient?.obraSocial?.nombre || '';
    }

    getPatientAfiliado(): string {
        const andes = this.andes;
        if (andes) { return andes.paciente?.obraSocial?.numeroAfiliado || ''; }
        return this.local?.patient?.obraSocial?.numeroAfiliado || '';
    }

    getProfessionalName(): string {
        const andes = this.andes;
        if (andes) { return (andes.profesional as unknown as { nombre?: string })?.nombre || ''; }
        return this.local?.professional?.businessName || '';
    }

    getProfessionalEnrollment(): string {
        const andes = this.andes;
        if (andes) { return String((andes.profesional as unknown as { matricula?: string | number })?.matricula || ''); }
        return this.local?.professional?.enrollment || '';
    }

    getOrganization(): string {
        const andes = this.andes;
        if (andes) { return andes.organizacion?.nombre || ''; }
        return this.local?.organizacion?.nombre || '';
    }

    getPrescriptionDate(): string {
        const andes = this.andes;
        if (andes) { return String(andes.fechaPrestacion || andes.fechaRegistro || ''); }
        return String(this.local?.date || '');
    }

    getMedicationName(): string {
        const andes = this.andes;
        if (andes) { return andes.medicamento?.concepto?.term || ''; }
        return this.local?.supplies?.[0]?.supply?.name || '';
    }

    getMedicationDetail(): string {
        const andes = this.andes;
        if (andes) { return andes.medicamento?.concepto?.fsn || ''; }
        const first = this.local?.supplies?.[0];
        const supply = first?.supply as any;
        if (!supply) { return ''; }
        const activePrinciple = supply.activePrinciple || supply.droga_descrip || '';
        const power = supply.power || '';
        const unity = supply.unity || '';
        const firstPres = supply.firstPresentation || first?.quantityPresentation || '';
        return [activePrinciple, firstPres ? `· ${firstPres}` : '', power ? `· ${power}${unity || ''}` : ''].filter(Boolean).join(' ');
    }

    getQuantity(): number {
        const andes = this.andes;
        if (andes) { return andes.medicamento?.cantidad || 1; }
        return this.local?.supplies?.reduce((sum, s) => sum + (s.quantity || 1), 0) || 1;
    }

    getMedicineType(): 'duplicado' | 'triplicado' | null {
        const supplies = this.local?.supplies;
        if (!supplies) { return null; }
        if (supplies.some((s) => s.triplicate)) { return 'triplicado'; }
        if (supplies.some((s) => s.duplicate)) { return 'duplicado'; }
        return null;
    }

    getUnits(): string {
        const andes = this.andes;
        if (andes) { return String(andes.medicamento?.unidades || ''); }
        const first = this.local?.supplies?.[0];
        if (!first) { return ''; }
        if (first.quantityPresentation) {
            const perPackage = Number(first.quantityPresentation);
            if (!isNaN(perPackage)) {
                return String((first.quantity || 1) * perPackage);
            }
        }
        return String(first.quantity || 1);
    }

    getDiagnosis(): string {
        const andes = this.andes;
        if (andes) { return andes.diagnostico?.descripcion || andes.diagnostico?.term || ''; }
        return this.local?.diagnostic || this.local?.supplies?.[0]?.diagnostic || '';
    }

    getIndications(): string {
        const andes = this.andes;
        if (andes) { return andes.medicamento?.dosisDiaria?.notaMedica || ''; }
        return this.local?.supplies?.[0]?.indication || '';
    }

    getStatus(): string {
        const andes = this.andes;
        if (andes) { return andes.estadoActual?.tipo || ''; }
        return this.local?.status || '';
    }

    isDispensed(): boolean {
        const s = this.getStatus().toLowerCase();
        return s === 'dispensada' || s === 'dispensado' || s === 'finalizada';
    }

    isExpired(): boolean {
        return this.getStatus().toLowerCase() === 'vencida';
    }

    getExpirationDate(): Date | null {
        const andes = this.andes;
        const raw = andes
            ? (andes.fechaRegistro || andes.fechaPrestacion)
            : (this.local?.date || null);
        if (!raw) { return null; }
        const base = new Date(raw);
        if (isNaN(base.getTime())) { return null; }
        return new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    getDispensedAt(): string {
        const andes = this.andes;
        if (andes) { return String(andes.estadoDispensaActual?.fecha || ''); }
        return String(this.local?.dispensedAt || '');
    }

    getDispensedByName(): string {
        const andes = this.andes;
        if (andes) { return andes.dispensa?.[0]?.organizacion?.nombre || ''; }
        return this.local?.dispensedBy?.businessName || '';
    }

    getReplacedMedicationName(): string {
        const andes = this.andes;
        if (andes) { return ''; }
        return this.local?.replacedMedication?.name || '';
    }

    getReplacedMedicationQuantity(): number | null {
        const andes = this.andes;
        if (andes) { return null; }
        const quantity = this.local?.replacedMedication?.quantity;
        return typeof quantity === 'number' ? quantity : null;
    }
}
