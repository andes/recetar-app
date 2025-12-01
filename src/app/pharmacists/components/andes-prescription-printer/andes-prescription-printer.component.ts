import { Component, OnInit } from '@angular/core';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { UnifiedPrinterComponent } from '@shared/components/unified-printer/unified-printer.component';

@Component({
    selector: 'app-prescription-printer',
    templateUrl: './andes-prescription-printer.component.html',
    styleUrls: ['./andes-prescription-printer.component.sass']
})
export class AndesPrescriptionPrinterComponent implements OnInit {

    constructor(
        private unifiedPrinter: UnifiedPrinterComponent
    ) { }

    ngOnInit(): void {
    }

    async print(prescription: AndesPrescriptions) {
        await this.unifiedPrinter.printAndesPrescription(prescription);
    }

}
