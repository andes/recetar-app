import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PatientsService } from '@services/patients.service';
import { Patient } from '@interfaces/patients';
import { Prescriptions } from '@interfaces/prescriptions';
import { PrescriptionsService } from '@services/prescriptions.service';
import { CertificatesService } from '@services/certificates.service';
import { PracticesService } from '@services/practices.service';
import { Certificate } from '@interfaces/certificate';
import { Practice } from '@interfaces/practices';
import { VademecumEntry } from '@interfaces/vademecum';
import SnomedConcept from '@interfaces/snomedConcept';
import { SidebarItem } from '@shared/components/layout/sidebar/sidebar.component';
import { SidebarService } from '@shared/services/sidebar.service';
import { NotificationService } from '@shared/services/notification.service';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, catchError, takeUntil, finalize } from 'rxjs/operators';
import { PrescriptionDraftService } from '../../services/prescription-draft.service';
import { FrequencyTrackerService } from '@shared/services/frequency-tracker.service';
import { AuthService } from '@auth/services/auth.service';
import { FrequentPatient, MedicationItem, DocumentDraft, DocumentType, CertificateFormData, PracticeFormData } from '../../models/prescription-draft';
import { toPrescriptionPayload, toCertificatePayload, toPracticePayload } from '../../models/medication-adapter';
import { SecurityPinService } from '@features/profile/services/security-pin.service';
import { PendingPrescriptionService } from '@features/profile/services/pending-prescription.service';
import { SecurityPinDialogComponent } from '@features/profile/components/security-pin-dialog/security-pin-dialog.component';
import { PendingPrescription } from '@features/profile/models/security-pin.model';
import { getInitials, formatName, formatDni, getAge } from '@utils/patient-format';

@Component({
    selector: 'app-new-prescription',
    templateUrl: './new-prescription.component.html',
    styleUrls: ['./new-prescription.component.sass'],
    standalone: false
})
export class NewPrescriptionComponent implements OnInit, OnDestroy {
    sidebarItems: SidebarItem[] = [];

    getInitials = getInitials;
    formatName = formatName;
    formatDni = formatDni;
    getAge = getAge;

    patientSearchForm: FormGroup;

    frequentPatients: FrequentPatient[] = [];
    favoritePatients: FrequentPatient[] = [];
    patientResults: Patient[] = [];
    showPatientResults = false;
    isSearchingPatient = false;
    patientNotFound = false;

    draft: DocumentDraft = { type: 'prescription', patient: null, medications: [], certificateData: null, practiceData: null };

    editingPatient = false;
    creatingPatient = false;
    creatingDocument: DocumentType | null = null;
    editingMedicationIndex: number | null = null;
    editingCertificate = false;
    editingPractice = false;
    isDuplicating = false;
    emptyPatient = new Patient('', '', '');
    sidebarOpen = false;

    hasPinActive = false;
    pendingPrescription: PendingPrescription | null = null;
    isSending = false;

    get showFrequentPatients(): boolean {
        return !this.showPatientResults && !this.isSearchingPatient && !this.patientNotFound;
    }

    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private patientsService: PatientsService,
        private prescriptionsService: PrescriptionsService,
        private certificatesService: CertificatesService,
        private practicesService: PracticesService,
        private sidebarService: SidebarService,
        private draftService: PrescriptionDraftService,
        private frequencyTracker: FrequencyTrackerService,
        private authService: AuthService,
        private notification: NotificationService,
        private securityPinService: SecurityPinService,
        private pendingPrescriptionService: PendingPrescriptionService,
        private dialog: MatDialog,
    ) { }

    ngOnInit(): void {
        this.sidebarItems = this.sidebarService.getItems();

        this.patientSearchForm = this.fb.group({ patientTerm: [''] });

        this.frequentPatients = this.loadFrequentPatients();
        this.favoritePatients = this.frequentPatients.slice(0, 2);

        this.patientSearchForm.get('patientTerm').valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe((term: string) => {
            if (typeof term === 'string' && term.length >= 3) {
                this.isSearchingPatient = true;
                this.showPatientResults = true;
                this.patientNotFound = false;
                this.patientsService.searchPatients(term).pipe(
                    catchError(() => of([]))
                ).subscribe((results) => {
                    const arr = Array.isArray(results) ? results : [];
                    this.isSearchingPatient = false;
                    this.patientResults = arr;
                    this.showPatientResults = arr.length > 0;
                    this.patientNotFound = arr.length === 0;
                });
            } else {
                this.patientResults = [];
                this.showPatientResults = false;
                this.patientNotFound = false;
                this.isSearchingPatient = false;
            }
        });

        this.draftService.draft$.pipe(takeUntil(this.destroy$))
            .subscribe((d) => this.draft = d);

        this.checkPendingPrescription();
        this.loadPinStatus();
    }

    private checkPendingPrescription(): void {
        this.pendingPrescription = this.pendingPrescriptionService.getDraft();
        if (this.pendingPrescription) {
            this.notification.warning('Tenés una receta pendiente de enviar');
        }
    }

    private loadPinStatus(): void {
        this.securityPinService.getStatus().pipe(
            takeUntil(this.destroy$),
            catchError(() => of({ isActive: false }))
        ).subscribe((status) => {
            this.hasPinActive = status.isActive;
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private readonly MAX_MEDICATIONS = 3;

    addMedicationToDraft(item: MedicationItem): void {
        if (this.draft.medications.length >= this.MAX_MEDICATIONS) {
            this.notification.warning(`Máximo ${this.MAX_MEDICATIONS} medicamentos por receta.`);
            return;
        }
        this.draftService.addMedication(item);
        this.backToDocuments();
    }

    get editingMedication(): MedicationItem | null {
        if (this.editingMedicationIndex != null && this.draft.medications[this.editingMedicationIndex]) {
            return this.draft.medications[this.editingMedicationIndex];
        }
        return null;
    }

    editMedication(index: number): void {
        this.creatingDocument = 'prescription';
        this.editingMedicationIndex = index;
        this.draftService.setType('prescription');
    }

    onMedicationUpdated(event: { item: MedicationItem; index: number }): void {
        this.draftService.replaceMedication(event.index, event.item);
        this.advanceDuplicateOrBack();
    }

    cancelEditMedication(): void {
        if (this.isDuplicating && this.editingMedicationIndex != null) {
            this.draftService.removeMedication(this.editingMedicationIndex);
            if (this.draft.medications.length === 0) {
                this.backToDocuments();
                return;
            }
            if (this.editingMedicationIndex >= this.draft.medications.length) {
                this.editingMedicationIndex = this.draft.medications.length - 1;
            }
            return;
        }
        this.backToDocuments();
    }

    private advanceDuplicateOrBack(): void {
        if (this.isDuplicating && this.editingMedicationIndex != null) {
            const nextIndex = this.editingMedicationIndex + 1;
            if (nextIndex < this.draft.medications.length) {
                this.editingMedicationIndex = nextIndex;
            } else {
                this.isDuplicating = false;
                this.backToDocuments();
            }
        } else {
            this.backToDocuments();
        }
    }

    editCertificate(): void {
        this.creatingDocument = 'certificate';
        this.editingCertificate = true;
        this.draftService.setType('certificate');
    }

    onCertificateSaved(data: CertificateFormData): void {
        this.draftService.setCertificateData(data);
        this.backToDocuments();
    }

    cancelCertificateEdit(): void {
        this.backToDocuments();
    }

    removeCertificate(): void {
        this.draftService.setCertificateData(null);
    }

    editPractice(): void {
        this.creatingDocument = 'practice';
        this.editingPractice = true;
        this.draftService.setType('practice');
    }

    onPracticeSaved(data: PracticeFormData): void {
        this.draftService.setPracticeData(data);
        this.backToDocuments();
    }

    cancelPracticeEdit(): void {
        this.backToDocuments();
    }

    removePractice(): void {
        this.draftService.setPracticeData(null);
    }

    get canFinalize(): boolean {
        if (!this.draft.patient) { return false; }
        switch (this.draft.type) {
            case 'prescription': return this.draft.medications.length > 0;
            case 'certificate': return !!this.draft.certificateData;
            case 'practice': return !!this.draft.practiceData;
            default: return false;
        }
    }

    get documentTypeLabel(): string {
        switch (this.draft.type) {
            case 'prescription': return 'receta';
            case 'certificate': return 'certificado';
            case 'practice': return 'práctica';
            default: return 'documento';
        }
    }

    selectPatient(patient: Patient | FrequentPatient): void {
         if ('_id' in patient) {
            const p = patient as Patient;
            this.draftService.setPatient(p);
            this.recordPatientFrequency(p);
        } else {
            const fp = patient as FrequentPatient;
            this.patientsService.getPatientByDni(fp.dni).subscribe({
                next: (patients) => {
                    if (patients.length > 0) {
                        const p = patients[0];
                        p.nombreAutopercibido = p.nombreAutopercibido || fp.nombreAutopercibido;
                        this.draftService.setPatient(p);
                        this.recordPatientFrequency(p);
                    } else {
                        const p = new Patient(fp.lastName, '', fp.sex, '', fp.dni);
                        p.firstName = fp.firstName;
                        p.nombreAutopercibido = fp.nombreAutopercibido;
                        if (fp.fechaNac) { p.fechaNac = new Date(fp.fechaNac); }
                        p.obraSocial = { nombre: fp.insurance };
                        this.draftService.setPatient(p);
                    }
                }
            });
        }
        this.frequentPatients = this.loadFrequentPatients();
    }

    editPatient(): void {
        this.editingPatient = true;
    }

    removePatient(): void {
        this.draftService.clearPatient();
    }

    showForm(type: DocumentType): void {
        this.creatingDocument = type;
        this.editingMedicationIndex = null;
        this.editingCertificate = false;
        this.editingPractice = false;
        this.draftService.setType(type);
    }

    backToDocuments(): void {
        this.creatingDocument = null;
        this.editingMedicationIndex = null;
        this.editingCertificate = false;
        this.editingPractice = false;
        this.isDuplicating = false;
    }

    duplicateDocument(event: { type: DocumentType; document: Prescriptions | Certificate | Practice }): void {
        const patient = this.draft.patient;
        if (!patient) { return; }

        this.editingMedicationIndex = null;
        this.editingCertificate = false;
        this.editingPractice = false;
        this.isDuplicating = false;
        this.creatingDocument = event.type;
        this.draftService.setType(event.type);

        switch (event.type) {
            case 'prescription': {
                const prescription = event.document as Prescriptions;
                this.draftService.setPatient(patient);
                const items = prescription.supplies.map(s => this.supplyToMedicationItem(s));
                const currentCount = this.draft.medications.length;
                const available = this.MAX_MEDICATIONS - currentCount;
                if (available <= 0) {
                    this.notification.warning(`Máximo ${this.MAX_MEDICATIONS} medicamentos por receta.`);
                    break;
                }
                const toAdd = items.slice(0, available);
                this.draftService.setMedications([...this.draft.medications, ...toAdd]);
                if (toAdd.length > 0) {
                    this.isDuplicating = true;
                    this.creatingDocument = 'prescription';
                    this.editingMedicationIndex = currentCount;
                }
                break;
            }
            case 'certificate': {
                const certificate = event.document as Certificate;
                this.draftService.setPatient(patient);
                this.draftService.setCertificateData({
                    certificate: certificate.certificate,
                    startDate: certificate.startDate,
                    cantDias: certificate.cantDias,
                });
                this.editingCertificate = true;
                break;
            }
            case 'practice': {
                const practice = event.document as Practice;
                this.draftService.setPatient(patient);
                this.draftService.setPracticeData({
                    practice: practice.practice,
                    diagnostic: practice.diagnostic,
                    indications: practice.indications,
                });
                this.editingPractice = true;
                break;
            }
        }
    }

    private supplyToMedicationItem(s: Prescriptions['supplies'][0]): MedicationItem {
        const sup = s.supply as unknown as Record<string, unknown> | undefined;
        const snomedConcept = sup?.snomedConcept as SnomedConcept | undefined;

        if (snomedConcept) {
            return {
                snomedConcept,
                quantity: s.quantity || 1,
                packageQuantity: s.quantityPresentation ? Number(s.quantityPresentation) : 1,
                diagnostic: s.diagnostic || '',
                indication: s.indication || '',
                duplicate: s.duplicate || false,
                triplicate: s.triplicate || false,
                serie: s.triplicateData?.serie || '',
                numero: s.triplicateData?.numero?.toString() || '',
            };
        }

        const supply: VademecumEntry = sup?.name || sup?.nombre
            ? {
                id: Number((sup?.code as Record<string, unknown>)?.value) || (sup?.id as number) || 0,
                nombre: (sup?.name || sup?.nombre || '') as string,
                presentacion: (sup?.firstPresentation || sup?.presentacion || '') as string,
                precio: (sup?.precio as number) || 0,
                droga_descrip: (sup?.activePrinciple || sup?.droga_descrip || '') as string,
                accion_descrip: (sup?.accion_descrip as string) || '',
                snomed: ((sup?.snomedConcept as Record<string, unknown>)?.conceptId as string) || (sup?.snomed as string) || '',
                estado: '', importado: '', heladera: '', troquel: '', codigoDeBarras: [],
                atcs: [], iva: '', laboratorio: 0, tipoDeVenta: 0, controlSaludPublica: 0,
                tamanio: 0, forma: 0, via: 0, droga: 0, accion: 0, vigencia: '',
                unidadPotencia: 0, potencia: '', unidadUnidades: 0, unidades: 0,
                gtins: [], gravamen: '', celiacos: '', ndrogas: [],
                cobs: {}, prospecto: 0, fecha_act: '',
            }
            : undefined as unknown as VademecumEntry;

        return {
            supply,
            quantity: s.quantity || 1,
            packageQuantity: s.quantityPresentation ? Number(s.quantityPresentation) : 1,
            diagnostic: s.diagnostic || '',
            indication: s.indication || '',
            duplicate: s.duplicate || false,
            triplicate: s.triplicate || false,
            serie: s.triplicateData?.serie || '',
            numero: s.triplicateData?.numero?.toString() || '',
        };
    }

    private recordPatientFrequency(p: Patient): void {
        this.frequencyTracker.recordUsage('patients', p.dni || p._id || '', {
            firstName: p.firstName,
            lastName: p.lastName,
            initials: this.getInitials(p),
            dni: p.dni,
            insurance: p.obraSocial?.nombre || '',
            sex: p.sex || '',
            fechaNac: p.fechaNac ? p.fechaNac.toISOString() : '',
            nombreAutopercibido: p.nombreAutopercibido || '',
            status: p.status || p.estado || '',
        });
    }

    onPatientSaved(updatedPatient: Patient): void {
        this.draftService.setPatient(updatedPatient);
        this.editingPatient = false;
    }

    onPatientEditCancelled(): void {
        this.editingPatient = false;
    }

    getSearchDni(): string | null {
        const term = (this.patientSearchForm?.get('patientTerm')?.value || '').replace(/\D/g, '');
        return term.length >= 6 && term.length <= 8 ? term : null;
    }

    onPatientCreated(patient: Patient): void {
        this.draftService.setPatient(patient);
        this.recordPatientFrequency(patient);
        this.creatingPatient = false;
    }

    removeMedication(index: number): void {
        this.draftService.removeMedication(index);
    }

    onFinalizeFromTabs(): void {
        this.finalizePrescription();
    }

    getTotalQuantity(): number {
        return this.draft.medications.reduce((sum, m) => sum + m.quantity, 0);
    }

    getTotalPrice(): number {
        return this.draft.medications.reduce((sum, m) => sum + (m.supply?.precio || 0) * m.quantity, 0);
    }

    finalizePrescription(): void {
        if (!this.draft.patient) { return; }

        const professional = {
            userId: this.authService.getLoggedUserId(),
            businessName: this.authService.getLoggedBusinessName(),
        };

        let payload: Record<string, unknown>;
        let serviceCall: (payload: unknown, pin?: string) => any;
        let successMsg: string;

        switch (this.draft.type) {
            case 'prescription':
                if (this.draft.medications.length === 0) { return; }
                payload = toPrescriptionPayload(this.draft, new Date(), professional);
                serviceCall = (p, pin) => this.prescriptionsService.newPrescription(p as any, pin);
                successMsg = 'Receta creada exitosamente';
                break;
            case 'certificate':
                if (!this.draft.certificateData) { return; }
                payload = toCertificatePayload(this.draft, professional);
                serviceCall = (p) => this.certificatesService.newCertificate(p as any);
                successMsg = 'Certificado creado exitosamente';
                break;
            case 'practice':
                if (!this.draft.practiceData) { return; }
                payload = toPracticePayload(this.draft, professional);
                serviceCall = (p) => this.practicesService.newPractice(p as any);
                successMsg = 'Práctica creada exitosamente';
                break;
            default:
                return;
        }

        this.pendingPrescriptionService.saveDraft(payload);

        if (this.hasPinActive && this.draft.type === 'prescription') {
            this.openPinDialogAndSend(payload, serviceCall, successMsg);
        } else {
            this.sendDocument(payload, serviceCall, successMsg);
        }
    }

    private openPinDialogAndSend(payload: Record<string, unknown>, serviceCall: (payload: unknown, pin?: string) => any, successMsg: string): void {
        const dialogRef = this.dialog.open(SecurityPinDialogComponent, {
            width: '400px',
            disableClose: true
        });

        dialogRef.afterClosed().subscribe((pin: string | null) => {
            if (pin) {
                this.sendDocument(payload, serviceCall, successMsg, pin);
            } else {
                this.pendingPrescriptionService.clearDraft();
            }
        });
    }

    private sendDocument(payload: Record<string, unknown>, serviceCall: (payload: unknown, pin?: string) => any, successMsg: string, pin?: string): void {
        this.isSending = true;

        serviceCall(payload, pin).pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isSending = false)
        ).subscribe({
            next: () => {
                this.pendingPrescriptionService.clearDraft();
                this.draftService.reset();
                this.notification.success(successMsg);
            },
            error: (error: any) => {
                if (error.status === 401 && this.hasPinActive && this.draft.type === 'prescription') {
                    this.pendingPrescriptionService.incrementAttempts();
                    this.notification.error('PIN incorrecto. Intentá de nuevo.');
                    this.openPinDialogAndSend(payload, serviceCall, successMsg);
                } else {
                    this.notification.error(`Error al crear ${this.documentTypeLabel}. Podés reintentar desde el panel.`);
                }
            }
        });
    }

    continuePendingPrescription(): void {
        if (!this.pendingPrescription) { return; }

        const professional = {
            userId: this.authService.getLoggedUserId(),
            businessName: this.authService.getLoggedBusinessName(),
        };

        if (this.hasPinActive) {
            const dialogRef = this.dialog.open(SecurityPinDialogComponent, {
                width: '400px',
                disableClose: true
            });
            dialogRef.afterClosed().subscribe((pin: string | null) => {
                if (pin) {
                    this.prescriptionsService.newPrescription(this.pendingPrescription.payload as Prescriptions, pin).subscribe({
                        next: () => {
                            this.pendingPrescriptionService.clearDraft();
                            this.draftService.reset();
                            this.notification.success('Documento creado exitosamente');
                        },
                        error: () => this.notification.error('Error al crear el documento.')
                    });
                }
            });
        } else {
            this.prescriptionsService.newPrescription(this.pendingPrescription.payload as Prescriptions).subscribe({
                next: () => {
                    this.pendingPrescriptionService.clearDraft();
                    this.draftService.reset();
                    this.notification.success('Documento creado exitosamente');
                },
                error: () => this.notification.error('Error al crear el documento.')
            });
        }
    }

    discardPendingPrescription(): void {
        this.pendingPrescriptionService.clearDraft();
        this.pendingPrescription = null;
        this.notification.success('Receta pendiente descartada');
    }

    private loadFrequentPatients(): FrequentPatient[] {
        return this.frequencyTracker.getTopFrequent('patients').map(r => ({
            id: r.key,
            firstName: r.data['firstName'] as string || '',
            lastName: r.data['lastName'] as string || '',
            initials: r.data['initials'] as string || '',
            insurance: r.data['insurance'] as string || '',
            dni: r.data['dni'] as string || '',
            sex: r.data['sex'] as string || '',
            fechaNac: r.data['fechaNac'] as string || '',
            nombreAutopercibido: r.data['nombreAutopercibido'] as string || '',
            status: r.data['status'] as string || '',
        }));
    }

    getInsuranceName(patient: Patient): string {
        return patient.obraSocial?.nombre || '';
    }

    get patientAvatarIcon(): string {
        if (!this.draft.patient) { return 'person'; }
        const sex = this.draft.patient.sex || '';
        if (/^f/i.test(sex)) { return 'female'; }
        if (/^[fm]/i.test(sex)) { return 'male'; }
        return 'transgender';
    }

    get isPatientFemale(): boolean {
        return /^f/i.test(this.draft.patient?.sex || '');
    }

    get isPatientOther(): boolean {
        const s = this.draft.patient?.sex || '';
        return s !== '' && !/^[fm]/i.test(s);
    }

    get validationStatus(): string {
        const p = this.draft.patient;
        if (!p) { return ''; }
        const estado = p.status || p.estado || '';
        return estado.toLowerCase() === 'validado' ? 'validado' : estado.toLowerCase() === 'temporal' ? 'temporal' : '';
    }

    trackByFrequent(index: number, item: FrequentPatient): string {
        return item.id;
    }

    trackByPatient(index: number, item: Patient): string | undefined {
        return item._id || item.dni || String(index);
    }
}
