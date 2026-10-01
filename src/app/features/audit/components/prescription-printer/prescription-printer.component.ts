import { Component } from '@angular/core';
import { Prescriptions } from '@interfaces/prescriptions';
import { UnifiedPrinterComponent } from '@shared/components/unified-printer/unified-printer.component';

@Component({
    selector: 'app-prescription-printer',
    standalone: false,
    template: ''
})
export class PrescriptionPrinterComponent {

    constructor(
        private unifiedPrinter: UnifiedPrinterComponent
    ) { }

    async print(prescription: Prescriptions) {
        await this.unifiedPrinter.printPrescription(prescription);
    }
}
