import { Component, OnInit } from '@angular/core';
import { Prescriptions } from '@interfaces/prescriptions';
import { UnifiedPrinterComponent } from '@shared/components/unified-printer/unified-printer.component';

@Component({
  selector: 'app-prescription-printer',
  templateUrl: './prescription-printer.component.html',
  styleUrls: ['./prescription-printer.component.sass']
})
export class PrescriptionPrinterComponent implements OnInit {

  prescription: Prescriptions;

  constructor(
    private unifiedPrinter: UnifiedPrinterComponent
  ){}

  ngOnInit(): void {
  }

  async print(prescription: Prescriptions){
    await this.unifiedPrinter.printPrescription(prescription);
  }
}
