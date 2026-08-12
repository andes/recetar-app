import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { PrescriptionsService } from '@services/prescriptions.service';
import { Prescriptions } from '@interfaces/prescriptions';
import { AuditDialogComponent } from '../../components/audit-dialog/audit-dialog.component';
import { NotificationService } from '@shared/services/notification.service';
import { Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
    selector: 'app-audit-prescriptions',
    standalone: false,
    templateUrl: './audit-prescriptions.component.html',
    styleUrls: ['./audit-prescriptions.component.sass']
})
export class AuditPrescriptionsComponent implements OnInit, OnDestroy {

    prescriptionForm: FormGroup;
    cuitControl: FormControl;
    cuitShowSpinner = false;
    prescriptions: Prescriptions[] = [];
    loadingPrescriptions = false;
    totalPrescriptions = 0;
    pageSize = 10;
    pageIndex = 0;
    hasSearched = false;

    private lastCuit: string;
    private destroy$ = new Subject<void>();

    constructor(
        private fBuilder: FormBuilder,
        private apiPrescriptions: PrescriptionsService,
        private dialog: MatDialog,
        private notificationService: NotificationService,
    ) { }

    ngOnInit(): void {
        this.cuitControl = new FormControl('', [Validators.required, Validators.minLength(10)]);

        this.prescriptionForm = this.fBuilder.group({
            pharmacy_cuit: this.cuitControl,
        });

        this.prescriptionForm.valueChanges.pipe(
            takeUntil(this.destroy$),
            switchMap(values => {
                if (typeof (values.pharmacy_cuit) !== 'undefined' && values.pharmacy_cuit >= 10) {
                    this.cuitShowSpinner = this.lastCuit !== values.pharmacy_cuit;
                    this.hasSearched = true;
                    return this.apiPrescriptions.getPrescriptions({ dispensedBy: values.pharmacy_cuit });
                }
                return of(null);
            })
        ).subscribe(success => {
            if (success === null) {
                return;
            }
            if (success) {
                this.lastCuit = this.prescriptionForm.value.pharmacy_cuit;
                this.cuitShowSpinner = false;
            } else {
                this.notificationService.error('No se encuentra una farmacia con ese CUIT');
                this.cuitShowSpinner = false;
            }
        });

        this.apiPrescriptions.prescriptions.pipe(
            takeUntil(this.destroy$)
        ).subscribe((prescriptions: Prescriptions[]) => {
            this.prescriptions = prescriptions;
            this.totalPrescriptions = prescriptions.length;
            this.loadingPrescriptions = false;
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onFilterChange(value: string): void {
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
    }

    openDialog(text: string): void {
        this.dialog.open(AuditDialogComponent, {
            width: '400px',
            data: { dialogType: 'error', text }
        });
    }

    get pharmacy_cuit() {
        return this.prescriptionForm.get('pharmacy_cuit');
    }

    get cuitLength(): number {
        return this.pharmacy_cuit?.value?.length || 0;
    }
}
