import { Component, Input } from '@angular/core';
import { Prescriptions } from '@interfaces/prescriptions';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { Certificate } from '@interfaces/certificate';
import { Practice } from '@interfaces/practices';
import { getStatusVariant, getStatusLabel } from '@shared/utils/status.utils';
import type { DocumentItemType, DocumentItemData } from '../document-item/document-item.component';

@Component({
    selector: 'app-document-detail-panel',
    templateUrl: './document-detail-panel.component.html',
    styleUrls: ['./document-detail-panel.component.sass'],
    standalone: false
})
export class DocumentDetailPanelComponent {
    @Input() type: DocumentItemType = 'receta';
    @Input() document: DocumentItemData | null = null;

    getStatusVariant = getStatusVariant;
    getStatusLabel = getStatusLabel;

    private get isAndesPrescription(): boolean {
        return this.type === 'receta' && !!this.document
            && 'paciente' in (this.document as object)
            && !('patient' in (this.document as object));
    }

    get andes(): AndesPrescriptions | null {
        return this.isAndesPrescription ? (this.document as AndesPrescriptions) : null;
    }

    get local(): Prescriptions | null {
        return (!this.isAndesPrescription && this.type === 'receta') ? (this.document as Prescriptions) : null;
    }

    get certificate(): Certificate | null {
        return this.type === 'certificados' ? (this.document as Certificate) : null;
    }

    get practice(): Practice | null {
        return this.type === 'practicas' ? (this.document as Practice) : null;
    }

    get headerTitle(): string {
        switch (this.type) {
            case 'certificados': return 'Detalle de certificado';
            case 'practicas': return 'Detalle de práctica';
            case 'insumos': return 'Detalle de insumo';
            default: return 'Detalle de receta';
        }
    }

    get code(): string {
        const andes = this.andes;
        if (andes) { return andes.idAndes || andes._id || ''; }
        if (this.local) { return this.local.prescriptionId || this.local._id || ''; }
        if (this.certificate) { return this.certificate._id || ''; }
        if (this.practice) { return this.practice._id || ''; }
        return '';
    }

    get medicationName(): string {
        const andes = this.andes;
        if (andes) { return andes.medicamento?.concepto?.term || ''; }
        if (this.local) { return this.local.supplies?.[0]?.supply?.name || ''; }
        if (this.certificate) { return this.certificate.certificate || ''; }
        if (this.practice) { return this.practice.practice || ''; }
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

    get patientName(): string {
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

    get patientSex(): string {
        const andes = this.andes;
        if (andes) { return andes.paciente?.sexo || ''; }
        if (this.local) { return this.local.patient?.sex || ''; }
        const doc = (this.certificate || this.practice) as Certificate | Practice | null;
        return (doc?.patient as { sex?: string } | undefined)?.sex || '';
    }

    get patientObraSocial(): string {
        const andes = this.andes;
        if (andes) { return andes.paciente?.obraSocial?.nombre || ''; }
        if (this.local) { return this.local.patient?.obraSocial?.nombre || ''; }
        const doc = (this.certificate || this.practice) as Certificate | Practice | null;
        return doc?.patient?.obraSocial?.nombre || '';
    }

    get patientAfiliado(): string {
        const andes = this.andes;
        if (andes) { return andes.paciente?.obraSocial?.numeroAfiliado || ''; }
        if (this.local) { return this.local.patient?.obraSocial?.numeroAfiliado || ''; }
        const doc = (this.certificate || this.practice) as Certificate | Practice | null;
        return doc?.patient?.obraSocial?.numeroAfiliado || '';
    }

    get professionalName(): string {
        const andes = this.andes;
        if (andes) {
            const prof = andes.profesional as unknown as { nombre?: string } | undefined;
            return prof?.nombre || '';
        }
        if (this.local) { return this.local.professional?.businessName || ''; }
        const doc = (this.certificate || this.practice) as Certificate | Practice | null;
        return doc?.professional?.businessName || '';
    }

    get professionalEnrollment(): string {
        const andes = this.andes;
        if (andes) {
            const prof = andes.profesional as unknown as { matricula?: string | number } | undefined;
            const matricula = prof?.matricula;
            return matricula != null && matricula !== '' ? String(matricula) : '';
        }
        const localProf = this.local?.professional
            ?? (this.certificate || this.practice)?.professional;
        if (!localProf) { return ''; }
        if (localProf.enrollment) { return localProf.enrollment; }
        const grado = localProf.profesionGrado;
        return grado?.length ? String(grado[0].numeroMatricula || '') : '';
    }

    get organization(): string {
        const andes = this.andes;
        if (andes) { return andes.organizacion?.nombre || ''; }
        if (this.local) { return this.local.organizacion?.nombre || ''; }
        return '';
    }

    get diagnosis(): string {
        const andes = this.andes;
        if (andes) { return andes.diagnostico?.descripcion || andes.diagnostico?.term || ''; }
        if (this.local) { return this.local.diagnostic || this.local.supplies?.[0]?.diagnostic || ''; }
        if (this.practice) { return this.practice.diagnostic || ''; }
        return '';
    }

    get indications(): string {
        const andes = this.andes;
        if (andes) { return andes.medicamento?.dosisDiaria?.notaMedica || ''; }
        if (this.local) { return this.local.supplies?.[0]?.indication || ''; }
        if (this.practice) { return this.practice.indications || ''; }
        return '';
    }

    get quantity(): number {
        const andes = this.andes;
        if (andes) { return andes.medicamento?.cantidad || 1; }
        if (this.local) { return this.local.supplies?.reduce((sum, s) => sum + (s.quantity || 1), 0) || 1; }
        return 0;
    }

    get units(): string {
        const andes = this.andes;
        if (andes) { return String(andes.medicamento?.unidades || ''); }
        const first = this.local?.supplies?.[0];
        if (!first) { return ''; }
        if (first.quantityPresentation) {
            const perPackage = Number(first.quantityPresentation);
            if (!isNaN(perPackage)) { return String((first.quantity || 1) * perPackage); }
        }
        return String(first.quantity || 1);
    }

    get certificateStartDate(): Date | null {
        return this.certificate?.startDate ? new Date(this.certificate.startDate) : null;
    }

    get certificateEndDate(): Date | null {
        return this.certificate?.endDate ? new Date(this.certificate.endDate) : null;
    }

    get certificateEmissionDate(): Date | null {
        return this.certificate?.createdAt ? new Date(this.certificate.createdAt) : null;
    }

    get certificateAnulated(): boolean {
        return !!this.certificate?.anulateDate;
    }

    get certificateAnulateLabel(): string {
        const cert = this.certificate;
        if (!cert) { return ''; }
        const parts: string[] = [];
        if (cert.anulateDate) { parts.push('Anulado el ' + new Date(cert.anulateDate).toLocaleDateString('es-AR')); }
        if (cert.anulateReason) { parts.push(cert.anulateReason); }
        return parts.join(' · ') || 'Anulado';
    }

    get documentDate(): Date | null {
        const andes = this.andes;
        if (andes) {
            const raw = andes.fechaPrestacion || andes.fechaRegistro;
            return raw ? new Date(raw) : null;
        }
        if (this.local) { return this.local.date ? new Date(this.local.date) : null; }
        if (this.certificate) { return this.certificate.createdAt ? new Date(this.certificate.createdAt) : null; }
        if (this.practice) { return this.practice.date ? new Date(this.practice.date) : null; }
        return null;
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
        return getStatusLabel(this.status);
    }

    get statusVariant(): string {
        if (this.certificate) {
            if (this.certificate.anulateDate) { return 'error'; }
            const now = new Date();
            if (this.certificate.endDate && this.certificate.endDate < now) { return 'error'; }
            if (this.certificate.startDate && this.certificate.startDate > now) { return 'warning'; }
            return 'success';
        }
        return getStatusVariant(this.status);
    }
}
