import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef, OnDestroy, AfterViewInit, ViewChild, TemplateRef } from '@angular/core';
import { ColumnDef } from '@shared/ui/table.component';
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

@Component({
    selector: 'app-document-tabs',
    templateUrl: './document-tabs.component.html',
    styleUrls: ['./document-tabs.component.sass'],
    standalone: false
})
export class DocumentTabsComponent implements OnChanges, OnDestroy, AfterViewInit {
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

    activeType: DocumentType = 'prescription';

    prescriptionColumns: ColumnDef[] = [];

    @ViewChild('fechaCell', { read: TemplateRef, static: true }) fechaCell?: TemplateRef<any>;
    @ViewChild('medCell', { read: TemplateRef, static: true }) medCell?: TemplateRef<any>;
    @ViewChild('estadoCell', { read: TemplateRef, static: true }) estadoCell?: TemplateRef<any>;
    @ViewChild('accionesCell', { read: TemplateRef, static: true }) accionesCell?: TemplateRef<any>;

    prescriptions: Prescriptions[] = [];
    certificates: Certificate[] = [];
    practices: Practice[] = [];

    isLoading = false;

    private destroy$ = new Subject<void>();

    constructor(
        private documentHistoryService: DocumentHistoryService,
        private draftService: PrescriptionDraftService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef,
    ) {}

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

    getPrescriptionMedName(p: Prescriptions): string {
        return p.supplies?.[0]?.supply?.name || 'Sin medicamento';
    }

    ngAfterViewInit(): void {
        this.prescriptionColumns = [
            { name: 'fecha', header: 'Fecha', cell: this.fechaCell! },
            { name: 'medicamento', header: 'Medicamento', cell: this.medCell! },
            { name: 'estado', header: 'Estado', cell: this.estadoCell!, headerClass: 'col-centered', cellClass: 'col-centered' },
            { name: 'acciones', header: 'Acción', cell: this.accionesCell!, headerClass: 'col-centered', cellClass: 'col-centered', stopPropagation: true },
        ];
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
}
