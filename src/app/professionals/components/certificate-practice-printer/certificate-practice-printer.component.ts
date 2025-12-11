import { Component, OnInit } from '@angular/core';
import { Certificate } from '@interfaces/certificate';
import { Practice } from '@interfaces/practices';
import { UnifiedPrinterComponent } from '@shared/components/unified-printer/unified-printer.component';

@Component({
    selector: 'app-certificate-practice-printer',
    templateUrl: './certificate-practice-printer.html'
})
export class CertificatePracticePrinterComponent implements OnInit {

    constructor(
        private unifiedPrinter: UnifiedPrinterComponent
    ) { }

    ngOnInit(): void {
    }

    async printCertificate(certificate: Certificate) {
        await this.unifiedPrinter.printCertificate(certificate);
    }

    async printPractice(practice: Practice) {
        await this.unifiedPrinter.printPractice(practice);
    }

}
