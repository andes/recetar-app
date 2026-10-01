import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { PrescriptionsService } from '@services/prescriptions.service';
import { DispenserInfo, Prescriptions, PrescriptionsResponse } from '@interfaces/prescriptions';
import { UnifiedPrinterComponent } from '@shared/components/unified-printer/unified-printer.component';
import { SidebarItem } from '@shared/components/layout/sidebar/sidebar.component';
import { NotificationService } from '@shared/services/notification.service';
import { SidebarService } from '@shared/services/sidebar.service';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, takeUntil, tap } from 'rxjs/operators';

@Component({
    selector: 'app-audit-prescriptions',
    standalone: false,
    templateUrl: './audit-prescriptions.component.html',
    styleUrls: ['./audit-prescriptions.component.sass']
})
export class AuditPrescriptionsComponent implements OnInit, OnDestroy {

    sidebarItems: SidebarItem[] = [];

    cuitControl = new FormControl('', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(11),
        Validators.pattern(/^\d+$/)
    ]);

    prescriptions: Prescriptions[] = [];
    loading = false;
    hasSearched = false;
    totalPrescriptions = 0;
    pageSize = 10;
    pageIndex = 0;
    currentCuit = '';
    dispenser: DispenserInfo | null = null;

    drawerOpen = false;
    selectedPrescription: Prescriptions | null = null;

    private load$ = new Subject<void>();
    private destroy$ = new Subject<void>();

    constructor(
        private prescriptionsService: PrescriptionsService,
        private notificationService: NotificationService,
        private sidebarService: SidebarService,
        private unifiedPrinter: UnifiedPrinterComponent
    ) { }

    ngOnInit(): void {
        this.sidebarItems = this.sidebarService.getItems();

        this.cuitControl.valueChanges.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(value => {
            const cuit = (value || '').trim();
            if (!cuit) {
                this.resetResults();
                return;
            }
            if (this.cuitControl.invalid) {
                return;
            }
            this.currentCuit = cuit;
            this.pageIndex = 0;
            this.hasSearched = true;
            this.load$.next();
        });

        this.load$.pipe(
            takeUntil(this.destroy$),
            switchMap(() => this.fetchPrescriptions())
        ).subscribe();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private fetchPrescriptions() {
        this.loading = true;
        const offset = this.pageIndex * this.pageSize;
        return this.prescriptionsService.getDispensedByCuil(this.currentCuit, { offset, limit: this.pageSize }).pipe(
            tap((response: PrescriptionsResponse) => {
                this.prescriptions = response.prescriptions as Prescriptions[];
                this.totalPrescriptions = response.total;
                this.dispenser = response.dispenser || null;
                this.loading = false;
            }),
            catchError((error) => {
                this.loading = false;
                this.notificationService.httpError(error);
                this.resetResults();
                return of(null);
            })
        );
    }

    private resetResults(): void {
        this.prescriptions = [];
        this.totalPrescriptions = 0;
        this.dispenser = null;
        this.pageIndex = 0;
        this.hasSearched = false;
        this.closeDrawer();
    }

    get resultsFrom(): number {
        return this.totalPrescriptions === 0 ? 0 : this.pageIndex * this.pageSize + 1;
    }

    get resultsTo(): number {
        return Math.min(this.resultsFrom + this.pageSize - 1, this.totalPrescriptions);
    }

    get canPrintSelected(): boolean {
        return this.selectedPrescription?.status === 'Dispensada';
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.load$.next();
    }

    onClear(): void {
        this.cuitControl.setValue('', { emitEvent: false });
        this.cuitControl.markAsUntouched();
        this.currentCuit = '';
        this.resetResults();
    }

    openDrawer(prescription: Prescriptions): void {
        this.selectedPrescription = prescription;
        this.drawerOpen = true;
    }

    closeDrawer(): void {
        this.drawerOpen = false;
        this.selectedPrescription = null;
    }

    isSelected(prescription: Prescriptions): boolean {
        return this.drawerOpen && this.selectedPrescription?._id === prescription._id;
    }

    async printPrescription(prescription: Prescriptions): Promise<void> {
        await this.unifiedPrinter.printPrescription(prescription);
    }
}
