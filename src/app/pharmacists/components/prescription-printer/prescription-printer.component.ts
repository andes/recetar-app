import { Component, OnInit } from '@angular/core';
import { PdfMakeWrapper, Txt, Canvas, Line, Img, Table, Columns } from 'pdfmake-wrapper';
import * as pdfFontsX from 'pdfmake-unicode/dist/pdfmake-unicode.js';
import { DatePipe } from '@angular/common';
import { Prescriptions } from '@interfaces/prescriptions';
import { BarcodeService } from '@services/barcode.service';

PdfMakeWrapper.setFonts(pdfFontsX);

@Component({
  selector: 'app-prescription-printer',
  templateUrl: './prescription-printer.component.html',
  styleUrls: ['./prescription-printer.component.sass']
})
export class PrescriptionPrinterComponent implements OnInit {

  prescription: Prescriptions;

  constructor(
    private datePipe: DatePipe,
    private barcodeService: BarcodeService
  ) { }

  ngOnInit(): void {
  }

  // Print a prescription as PDF
  async print(prescription: Prescriptions) {
    const pdf: PdfMakeWrapper = new PdfMakeWrapper();

    if (prescription.status !== 'Pendiente') {
      pdf.watermark({
        text: 'Receta no valida para dispensa',
        color: 'grey',
        opacity: 0.3,
        bold: true,
        fontSize: 60
      });
    }

    const barcodeBase64 = await this.barcodeService.generateBarcodeBase64(prescription._id);
    const barcodeImg = await new Img(barcodeBase64).fit([230, 60]).alignment('center').margin([0, 20]).build();
    pdf.info({
      title: "Receta digital " + prescription.professional.businessName,
      author: 'RecetAR'
    });
    // Header
    pdf.add(new Columns([await new Img('assets/img/LogoPdf.jpg').fit([60, 60]).build(), new Txt('RecetAR').bold().fontSize(20).alignment('center').end, new Txt('').end]).end);
    pdf.add(new Txt('\n').end);
    pdf.add(new Columns([new Txt('RECETAR').bold().alignment('left').end, new Txt(`Fecha prescripción: ${this.datePipe.transform(prescription.date, 'dd/MM/yyyy')}`).alignment('right').end]).end);
    pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
    pdf.add(new Txt('\n').end);

   // Patient
    pdf.add(new Txt([
      {text:"Paciente:   "},
      {text: `${prescription.patient.lastName.toUpperCase()} ${prescription.patient.firstName.toUpperCase()}`, bold: true}
    ]).end);
    pdf.add(new Txt('\n').end);

    pdf.add(new Txt([
      {text:"DNI:    "},
      {text:`${prescription.patient.dni}`, bold: true}
    ]).end);
    pdf.add(new Txt('\n').end);
    if (prescription.patient.fechaNac) {
      pdf.add(new Txt([
        {text:"Fecha Nacimiento:    "}, 
        {text: `${this.datePipe.transform(prescription.patient.fechaNac, 'dd/MM/yyyy')}`, bold: true}
    ]).end);
      pdf.add(new Txt('\n').end);
    }
    pdf.add(new Txt([
      {text:"Sexo:    "},
      {text:`${prescription.patient.sex}`, bold: true}
    ]).end);
    pdf.add(new Txt('\n').end);
    pdf.add(new Txt([
      {text:'Obra Social / Plan de salud :   '},
      {text:`${(prescription.patient.obraSocial ? prescription.patient.obraSocial.nombre : 'No informado')}`, bold: true}
    ]).end);
    pdf.add(new Txt('\n').end);

    pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
    pdf.add(new Txt('\n').end);
    pdf.add(new Columns([new Txt("Medicamento").end, new Columns([new Txt('Presentación').end, new Txt("Cantidad").end]).end]).end);
    pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
    // Supplies
    pdf.add(new Txt('\n').end);
    prescription.supplies.forEach(supply => {
      pdf.add(new Columns([new Txt("" + supply.supply.name).bold().end, new Columns([new Txt(`${supply.quantity} Valor temporal`).bold().end, new Txt(`${supply.quantity}`).bold().end]).end]).end);
      pdf.add(new Txt('\n').end);
    });

    pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
    pdf.add(new Txt('\n').end);

    if (prescription.diagnostic) {
      pdf.add(new Txt('\n').end);
      pdf.add(new Txt("Diagnóstico").bold().end);
      pdf.add(new Txt("" + prescription.diagnostic).end);
    }
    if (prescription.observation) {
      pdf.add(new Txt('\n').end);
      pdf.add(new Txt("Observaciones").bold().end);
      pdf.add(new Txt("" + prescription.observation).end);
    }
    pdf.add(new Txt('\n').end);
    pdf.add(new Txt('\n').end);


    // Barcode
    pdf.add(new Columns([
      barcodeImg,
      new Txt([
        { text: `Este documento ha sido firmado electrónicamente por Dr.:`, fontSize: 9, bold: true, italics: true },
        { text: `\n ${prescription.professional.businessName}`, fontSize: 20 },
        { text: `\n MEDICO MP ${prescription.professional.enrollment}`, bold: true, fontSize: 11 }
      ]).alignment('center').end]).end)

    // Pharmacy
    if (prescription.status === 'dispensed') {
      pdf.add(new Columns([new Txt("Dispensado por").bold().end, new Txt("CUIL").bold().end]).end);
      pdf.add(new Columns([new Txt("" + prescription.dispensedBy.businessName.toUpperCase()).end, new Txt("" + prescription.dispensedBy.cuil).end]).end);
    }

    pdf.footer(new Txt([
      { text: 'Esta receta fue creada por emisor inscripto y valido en el Registro de Recetarios Electrónicos del Ministerio de Salud de la Nación - ', italics: true },
      { text: 'RL-2025-63212094-APN-SSVEIYES#MS', bold: true }
    ]).fontSize(11).alignment('center').end);
    pdf.create().open();
  }


}
