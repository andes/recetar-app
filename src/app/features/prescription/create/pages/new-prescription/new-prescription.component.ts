import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PatientsService } from '@services/patients.service';
import { Patient } from '@interfaces/patients';
import { Prescriptions } from '@interfaces/prescriptions';
import { PrescriptionsService } from '@services/prescriptions.service';
import { SidebarItem } from '@shared/components/layout/sidebar/sidebar.component';
import { SidebarService } from '@shared/services/sidebar.service';
import { NotificationService } from '@shared/services/notification.service';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, catchError, takeUntil, finalize } from 'rxjs/operators';
import { PrescriptionDraftService } from '../../services/prescription-draft.service';
import { FrequencyTrackerService } from '@shared/services/frequency-tracker.service';
import { AuthService } from '@auth/services/auth.service';
import { FrequentPatient, MedicationItem, PrescriptionDraft } from '../../models/prescription-draft';
import { toPrescriptionPayload } from '../../models/medication-adapter';
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

    draft: PrescriptionDraft = { patient: null, medications: [] };

    editingPatient = false;
    creatingPatient = false;
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

    updateMedQty(index: number, qty: number): void {
        this.draftService.updateMedication(index, { quantity: qty < 1 ? 1 : qty });
    }

    removeMedication(index: number): void {
        this.draftService.removeMedication(index);
    }

    getTotalQuantity(): number {
        return this.draft.medications.reduce((sum, m) => sum + m.quantity, 0);
    }

    finalizePrescription(): void {
        if (!this.draft.patient || this.draft.medications.length === 0) { return; }

        const professional = {
            userId: this.authService.getLoggedUserId(),
            businessName: this.authService.getLoggedBusinessName(),
        };
        const prescription = toPrescriptionPayload(this.draft, new Date(), professional);

        this.pendingPrescriptionService.saveDraft(prescription);

        if (this.hasPinActive) {
            this.openPinDialogAndSend(prescription);
        } else {
            this.sendPrescription(prescription);
        }
    }

    private openPinDialogAndSend(prescription: unknown): void {
        const dialogRef = this.dialog.open(SecurityPinDialogComponent, {
            width: '400px',
            disableClose: true
        });

        dialogRef.afterClosed().subscribe((pin: string | null) => {
            if (pin) {
                this.sendPrescription(prescription, pin);
            } else {
                this.pendingPrescriptionService.clearDraft();
            }
        });
    }

    private sendPrescription(prescription: unknown, pin?: string): void {
        this.isSending = true;

        this.prescriptionsService.newPrescription(prescription as Prescriptions, pin).pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isSending = false)
        ).subscribe({
            next: () => {
                this.pendingPrescriptionService.clearDraft();
                this.draftService.reset();
                this.notification.success('Receta creada exitosamente');
            },
            error: (error) => {
                if (error.status === 401 && this.hasPinActive) {
                    this.pendingPrescriptionService.incrementAttempts();
                    this.notification.error('PIN incorrecto. Intentá de nuevo.');
                    this.openPinDialogAndSend(prescription);
                } else {
                    this.notification.error('Error al crear la receta. Podés reintentar desde el panel.');
                }
            }
        });
    }

    continuePendingPrescription(): void {
        if (!this.pendingPrescription) { return; }

        if (this.hasPinActive) {
            this.openPinDialogAndSend(this.pendingPrescription.payload);
        } else {
            this.sendPrescription(this.pendingPrescription.payload);
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

    trackByFrequent(index: number, item: FrequentPatient): string {
        return item.id;
    }

    trackByPatient(index: number, item: Patient): string | undefined {
        return item._id || item.dni || String(index);
    }
}
