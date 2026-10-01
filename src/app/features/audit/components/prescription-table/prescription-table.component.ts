import { Component, Input, Output, EventEmitter, TemplateRef, viewChild, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { AuthService } from '@auth/services/auth.service';
import { Prescriptions } from '@interfaces/prescriptions';
import { UnifiedPrinterComponent } from '@shared/components/unified-printer/unified-printer.component';
import { ColumnDef } from '@shared/ui/table.component';

@Component({
    selector: 'app-prescription-table',
    standalone: false,
    templateUrl: './prescription-table.component.html',
    styleUrls: ['./prescription-table.component.sass']
})
export class PrescriptionTableComponent implements OnInit {

    @Input() prescriptions: Prescriptions[] = [];
    @Input() loading = false;
    @Input() totalCount = 0;
    @Input() pageSize = 10;
    @Input() pageIndex = 0;

    @Output() pageChange = new EventEmitter<PageEvent>();
    @Output() filterChange = new EventEmitter<string>();

    professionalCell = viewChild.required<TemplateRef<any>>('professionalCell');
    dateCell = viewChild.required<TemplateRef<any>>('dateCell');
    statusCell = viewChild.required<TemplateRef<any>>('statusCell');
    suppliesCell = viewChild.required<TemplateRef<any>>('suppliesCell');
    actionsCell = viewChild.required<TemplateRef<any>>('actionsCell');

    columns: ColumnDef[] = [];

    constructor(
        private authService: AuthService,
        private unifiedPrinter: UnifiedPrinterComponent
    ) { }

    ngOnInit(): void {
        this.columns = [
            { name: 'professional', header: 'Profesional', cell: this.professionalCell() },
            { name: 'date', header: 'Fecha', cell: this.dateCell() },
            { name: 'status', header: 'Estado', cell: this.statusCell() },
            { name: 'supplies', header: 'Insumos', cell: this.suppliesCell(), headerClass: 'col-centered', cellClass: 'col-centered' },
            { name: 'actions', header: 'Acción', cell: this.actionsCell(), headerClass: 'col-centered', cellClass: 'col-centered', stopPropagation: true },
        ];
    }

    canPrint(prescription: Prescriptions): boolean {
        return (prescription.status === 'Dispensada') &&
            (prescription.dispensedBy?.userId === this.authService.getLoggedUserId());
    }

    async printPrescription(prescription: Prescriptions) {
        await this.unifiedPrinter.printPrescription(prescription);
    }

    isExpired(prescription: Prescriptions): boolean {
        return prescription.status === 'Vencida';
    }

    getStatusVariant(status: string): string {
        switch (status) {
            case 'Dispensada': return 'success';
            case 'Vencida': return 'error';
            case 'Pendiente': return 'warning';
            default: return 'info';
        }
    }

    getDispenserLabel(prescriptions: Prescriptions[]): string {
        if (!prescriptions.length) { return ''; }
        const first = prescriptions[0];
        return first.dispensedBy?.businessName || '';
    }

    getDispenserCuil(prescriptions: Prescriptions[]): string {
        if (!prescriptions.length) { return ''; }
        return prescriptions[0].dispensedBy?.cuil || '';
    }

    onPageChange(event: PageEvent): void {
        this.pageChange.emit(event);
    }
}
