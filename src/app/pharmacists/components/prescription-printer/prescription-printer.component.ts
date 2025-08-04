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

        // Primera página
        await this.addPage(pdf, prescription);

        // Duplicado
        if (prescription.supplies.some(s => s.duplicate)) {
            pdf.add({ text: '', pageBreak: 'after' });
            await this.addPage(pdf, prescription, 'DUPLICADO');
        }

        pdf.create().open();
    }
    private async addPage(pdf: PdfMakeWrapper, prescription: Prescriptions, label?: string) {

        if (prescription.status === 'Vencida') {
            pdf.watermark({
                text: 'Receta no valida para dispensa',
                color: 'grey',
                opacity: 0.3,
                bold: true,
                fontSize: 60
            });
        }
        if (prescription.status === 'Dispensada') {
            pdf.watermark({
                text: 'DISPENSADA',
                color: 'grey',
                opacity: 0.3,
                bold: true,
                fontSize: 100
            });
        }

        const barcodeBase64 = await this.barcodeService.generateBarcodeBase64(prescription._id);
        const barcodeImg = await new Img(barcodeBase64).fit([230, 60]).alignment('center').margin([0, 20]).build();
        pdf.info({
            title: 'Receta digital ' + prescription.professional.businessName,
            author: 'RecetAR'
        });
        // Header
        pdf.add(new Columns([
            await new Img('assets/img/LogoPdf.jpg').fit([60, 60]).build(),
            new Txt('RECETA').bold().fontSize(20).alignment('center').end,
            new Txt(label ? `${label}` : '').bold().italics().fontSize(20).alignment('right').opacity(0.6).end]).end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Columns([new Txt('RECETAR').bold().alignment('left').end, new Txt(`Fecha prescripción: ${this.datePipe.transform(prescription.date, 'dd/MM/yyyy')}`).alignment('right').end]).end);
        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);

        // Patient
        pdf.add(new Txt([
            { text: 'Paciente:   ' },
            { text: `${prescription.patient.lastName.toUpperCase()} ${prescription.patient.firstName.toUpperCase()}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        pdf.add(new Txt([
            { text: 'DNI:    ' },
            { text: `${prescription.patient.dni}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);
        if (prescription.patient.fechaNac) {
            pdf.add(new Txt([
                { text: 'Fecha Nacimiento:    ' },
                { text: `${this.datePipe.transform(prescription.patient.fechaNac, 'dd/MM/yyyy')}`, bold: true }
            ]).end);
            pdf.add(new Txt('\n').end);
        }
        pdf.add(new Txt([
            { text: 'Sexo:    ' },
            { text: `${prescription.patient.sex}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        let obraSocial = '';
        let numeroAfiliado = '';
        if (prescription.patient.obraSocial?.nombre) {
            obraSocial = prescription.patient.obraSocial.nombre;
            numeroAfiliado = prescription.patient.obraSocial.numeroAfiliado || '';
        }
        pdf.add(new Txt([
            { text: 'Obra Social / Plan de salud :   ' }, { text: `${(obraSocial)}`, bold: true }
        ]).end);
        if (obraSocial) {
            pdf.add(new Txt([
                { text: 'Número de afiliado:   ' }, { text: `${numeroAfiliado || 'No informado'}`, bold: true }
            ]).end);
        }
        pdf.add(new Txt('\n').end);

        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Columns([new Txt('Medicamento').end, new Columns([new Txt('').end]).end]).end);
        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        // Supplies
        pdf.add(new Txt('\n').end);

        prescription.supplies.forEach(supply => {
            const cant = supply.quantityPresentation ? `${supply.quantity} envase(s) de ${supply.quantityPresentation} unidades` : `x ${supply.quantity}`;
            pdf.add(new Columns([new Txt('' + supply.supply.name).bold().end, new Columns([new Txt(`${cant} `).bold().end]).end]).end);
            pdf.add(new Txt('\n').end);

            if (supply.diagnostic) {
                pdf.add(new Txt('\n').end);
                pdf.add(new Txt('Diagnóstico').bold().end);
                pdf.add(new Txt('' + supply.diagnostic ? supply.diagnostic : 'Sin datos registrados').end);
            }
        });
        if (prescription.observation) {
            pdf.add(new Txt('\n').end);
            pdf.add(new Txt('Observaciones').bold().end);
            pdf.add(new Txt('' + prescription.observation).end);
        }
        pdf.add(new Txt('\n').end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Txt('\n').end);


        // Barcode
        pdf.add(new Columns([
            barcodeImg,
            new Txt([
                { text: 'Este documento ha sido firmado \n electrónicamente por Dr.:', fontSize: 9, bold: true, italics: true },
                { text: '\n', fontSize: 3 },
                { text: `\n ${prescription.professional.businessName}`, fontSize: 14, bold: true },
                { text: `\n MP ${prescription.professional.enrollment}`, bold: true, fontSize: 10 }
            ]).alignment('center').end]).end);

        // Pharmacy
        if (prescription.status === 'Dispensada') {
            pdf.add(new Columns([new Txt('Dispensado por').bold().end, new Txt('CUIL').bold().end]).end);
            pdf.add(new Columns([new Txt('' + prescription.dispensedBy.businessName.toUpperCase()).end, new Txt('' + prescription.dispensedBy.cuil).end]).end);
            pdf.add(new Txt(`Fecha dispensación: ${this.datePipe.transform(prescription.dispensedAt, 'dd/MM/yyyy')}`).end);
        }

        pdf.footer(new Txt([
            { text: '  Esta receta fue creada por emisor inscripto y valido en el Registro de Recetarios Electrónicos \n del Ministerio de Salud de la Nación - ', italics: true },
            { text: 'RL-2025-63212094-APN-SSVEIYES#MS   ', bold: true }
        ]).fontSize(11).alignment('center').end);
    }

}
