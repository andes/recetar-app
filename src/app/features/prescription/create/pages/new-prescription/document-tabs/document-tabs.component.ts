import { Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Patient } from '@interfaces/patients';
import { Prescriptions } from '@interfaces/prescriptions';
import { Certificate } from '@interfaces/certificate';
import { Practice } from '@interfaces/practices';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DocumentHistoryService, RecentDocumentsResponse } from '@services/document-history.service';
import { PrescriptionDraftService } from '../../../services/prescription-draft.service';
import { DocumentType, MedicationItem, CertificateFormData, PracticeFormData } from '../../../models/prescription-draft';
import { AuthService } from '@auth/services/auth.service';
import { getStatusVariant as sharedGetStatusVariant, getStatusLabel as sharedGetStatusLabel } from '@shared/utils/status.utils';
import type { StatusVariant } from '@shared/utils/status.utils';

@Component({
    selector: 'app-document-tabs',
    templateUrl: './document-tabs.component.html',
    styleUrls: ['./document-tabs.component.sass'],
    standalone: false
})
export class DocumentTabsComponent implements OnChanges, OnInit, OnDestroy {
    @Input() disabled = false;
    @Input() patient: Patient | null = null;
    @Input() draftMedications: MedicationItem[] = [];
    @Input() draftCertificate: CertificateFormData | null = null;
    @Input() draftPractice: PracticeFormData | null = null;
    @Output() createDocument = new EventEmitter<DocumentType>();
    @Output() editMedication = new EventEmitter<number>();
    @Output() removeMedication = new EventEmitter<number>();
    @Output() editCertificate = new EventEmitter<void>();
    @Output() duplicateDocument = new EventEmitter<{ type: DocumentType; document: Prescriptions | Certificate | Practice }>();
    @Output() removeCertificate = new EventEmitter<void>();
    @Output() editPractice = new EventEmitter<void>();
    @Output() removePractice = new EventEmitter<void>();
    @Output() finalizeDraft = new EventEmitter<void>();
    @Output() viewFullHistory = new EventEmitter<void>();

    activeType: DocumentType = 'prescription';

    prescriptions: Prescriptions[] = [];
    certificates: Certificate[] = [];
    practices: Practice[] = [];

    isLoading = false;

    expandedPrescription: Prescriptions | null = null;
    expandedCertificate: Certificate | null = null;
    expandedPractice: Practice | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        private documentHistoryService: DocumentHistoryService,
        private draftService: PrescriptionDraftService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.activeType = this.draftService.snapshot.type;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['patient'] && this.patient?.dni) {
            this.resetData();
            this.loadRecentDocuments();
        }
        if (changes['patient'] && !this.patient) {
            this.resetData();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    selectType(type: DocumentType): void {
        this.activeType = type;
        this.draftService.setType(type);
    }

    changeQuantity(index: number, delta: number): void {
        const item = this.draftMedications[index];
        if (!item) { return; }
        const newQty = item.quantity + delta;
        if (newQty >= 1) {
            this.draftService.updateMedication(index, { quantity: newQty });
        }
    }

    getTotalQuantity(): number {
        return this.draftMedications.reduce((sum, m) => sum + m.quantity, 0);
    }

    getTotalPrice(): number {
        return this.draftMedications.reduce((sum, m) => sum + (m.supply?.precio || 0) * m.quantity, 0);
    }

    isGenericMedication(item: MedicationItem): boolean {
        return !item.supply && !!item.snomedConcept;
    }

    isPrescriptionGeneric(p: Prescriptions): boolean {
        return !!p.supplies?.[0]?.supply?.snomedConcept;
    }

    private cap(s: string): string {
        s = s.trim();
        return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    }

    getPrescriptionMedName(p: Prescriptions): string {
        const s = p.supplies?.[0]?.supply;
        if (!s) { return 'Sin medicamento'; }
        if (s.snomedConcept?.term) { return this.cap(s.snomedConcept.term); }
        return this.cap(s.name);
    }

    getPrescriptionSubtitle(p: Prescriptions): string {
        const s = p.supplies?.[0]?.supply as any;
        if (!s) { return ''; }
        if (s.code?.source === 'ALFABETA') {
            return this.cap(s.firstPresentation || s.presentacion || '');
        }
        if (s.snomedConcept?.semanticTag) {
            return this.cap(s.snomedConcept.semanticTag);
        }
        return '';
    }

    isRxDuplicate(p: Prescriptions): boolean {
        return !!p.supplies?.[0]?.duplicate;
    }

    isRxTriplicate(p: Prescriptions): boolean {
        return !!(p.supplies?.[0]?.triplicate || (p as any).triple || (p as any).triplicado);
    }

    getRxTipoReceta(p: Prescriptions): string {
        const supply = p.supplies?.[0];
        if (supply?.triplicate || (p as any).triple || (p as any).triplicado) {
            const td = supply?.triplicateData;
            if (td?.serie || td?.numero) {
                return `Triplicado · Serie ${td.serie || '—'} · N.º ${td.numero || '—'}`;
            }
            return 'Triplicado';
        }
        if (supply?.duplicate) {
            return 'Duplicado';
        }
        return '';
    }

    getRxDetailName(p: Prescriptions): string {
        const s = p.supplies?.[0]?.supply;
        if (!s) { return 'Sin medicamento'; }
        if (s.snomedConcept?.fsn) {
            return this.cap(s.snomedConcept.fsn);
        }
        const parts = [s.name];
        if ((s as any).presentacion) { parts.push((s as any).presentacion); }
        if ((s as any).precio != null) { parts.push('$' + (s as any).precio.toFixed(2)); }
        return parts.map(p => this.cap(p)).join(' · ');
    }

    getRxPresentation(p: Prescriptions): string {
        const s = p.supplies?.[0]?.supply as any;
        if (!s) { return ''; }
        return this.cap(s.firstPresentation || s.power || s.presentacion || '');
    }

    getRxCode(p: Prescriptions): string {
        const s = p.supplies?.[0]?.supply as any;
        if (!s?.code) { return ''; }
        const code = typeof s.code === 'string' ? { source: '', value: s.code } : s.code;
        return code.source ? `${code.source}: ${code.value}` : code.value;
    }

    getRxQuantity(p: Prescriptions): number {
        return p.supplies?.[0]?.quantity || 0;
    }

    getRxDiagnostic(p: Prescriptions): string {
        const d = p.diagnostic || p.supplies?.[0]?.diagnostic || '';
        return this.cap(d);
    }

    getRxIndications(p: Prescriptions): string {
        const item = p.supplies?.[0];
        if (!item) { return ''; }
        const parts: string[] = [];
        if (item.indication) { parts.push(this.cap(item.indication)); }
        if (item.description) { parts.push(this.cap(item.description)); }
        return parts.join(' · ');
    }

    private resetData(): void {
        this.prescriptions = [];
        this.certificates = [];
        this.practices = [];
        this.isLoading = false;
    }

    private loadRecentDocuments(): void {
        const dni = this.patient?.dni;
        if (!dni) { return; }

        const userId = this.authService.getLoggedUserId();
        if (!userId) {
            this.isLoading = false;
            this.cdr.detectChanges();
            return;
        }

        this.isLoading = true;
        this.cdr.detectChanges();

        this.destroy$.next();

        this.documentHistoryService.getRecentDocuments(userId, dni).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: (data: RecentDocumentsResponse) => {
                this.prescriptions = data.prescriptions;
                this.certificates = data.certificates;
                this.practices = data.practices;
                this.draftService.setRecentDocuments(data);
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.prescriptions = [];
                this.certificates = [];
                this.practices = [];
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    getStatusVariant(status?: string): StatusVariant {
        return sharedGetStatusVariant(status);
    }

    getStatusLabel(status?: string): string {
        return sharedGetStatusLabel(status);
    }

    getDraftCertEndDate(data: CertificateFormData): Date {
        if (!data?.startDate || !data?.cantDias) { return data?.startDate || new Date(); }
        const end = new Date(data.startDate);
        end.setDate(end.getDate() + data.cantDias - 1);
        return end;
    }

    isCertificateAnulated(c: Certificate): boolean {
        return c.status === 'anulado' || !!c.anulateDate;
    }

    getCertAnulateLabel(c: Certificate): string {
        const parts: string[] = [];
        if (c.anulateDate) {
            parts.push('Anulado el ' + (c.anulateDate instanceof Date ? c.anulateDate.toLocaleDateString('es-AR') : ''));
        }
        if (c.anulateReason) {
            parts.push(c.anulateReason);
        }
        return parts.join(' · ') || 'Anulado';
    }
}
