import { Injectable } from '@angular/core';
import { PdfMakeWrapper, Txt, Canvas, Line, Img, Columns } from 'pdfmake-wrapper';
import * as pdfFontsX from 'pdfmake-unicode/dist/pdfmake-unicode.js';
import { DatePipe } from '@angular/common';
import { BarcodeService } from '@services/barcode.service';

PdfMakeWrapper.setFonts(pdfFontsX);

@Injectable()
export class StockPrinterComponent {

    constructor(
        private datePipe: DatePipe,
        private barcodeService: BarcodeService
    ) { }

    private async _generatePdf(buildFunction: (pdf: PdfMakeWrapper) => Promise<void> | void) {
        const pdf = new PdfMakeWrapper();
        await Promise.resolve(buildFunction(pdf));
        pdf.create().open();
    }

    async print(stockData: any) {
        await this._generatePdf(async (pdf) => {
            await this.addPage(pdf, stockData);
            // Si necesitaramos duplicado, aquí iría la lógica similar a recetas
        });
    }

    private async addPage(pdf: PdfMakeWrapper, stockData: any, label?: string) {

        const barcodeBase64 = await this.barcodeService.generateBarcodeBase64(stockData._id);
        const barcodeImg = await new Img(barcodeBase64).fit([230, 60]).alignment('center').margin([0, 20]).build();

        // Similar prescriptionId barcode logic if needed, assuming just _id for now based on data sample
        let prescriptionIdBarcodeImg = null;
        let prescriptionIdLabel = null;
        if (stockData.prescriptionId) {
            const prescriptionIdBarcodeBase64 = await this.barcodeService.generateBarcodeBase64(stockData.prescriptionId);
            prescriptionIdLabel = new Txt('Número de receta:').fontSize(9).bold().alignment('center').margin([0, 5, 0, 0]).end;
            prescriptionIdBarcodeImg = await new Img(prescriptionIdBarcodeBase64).fit([230, 60]).alignment('center').margin([0, 5]).build();
        }

        pdf.info({
            title: 'Receta de Insumos ' + stockData.professional.businessName,
            author: 'RecetAR'
        });

        // Header
        pdf.add(new Columns([
            await new Img('assets/img/LogoPdf.jpg').fit([60, 60]).build(),
            new Txt('RECETA DE INSUMOS').bold().fontSize(20).alignment('center').end,
            new Txt(label ? `${label}` : '').bold().italics().fontSize(20).alignment('right').opacity(0.6).end]).end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Columns([new Txt('RECETAR').bold().alignment('left').end, new Txt(`Fecha prescripción: ${this.datePipe.transform(stockData.date, 'dd/MM/yyyy')}`).alignment('right').end]).end);
        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);

        // Patient
        pdf.add(new Txt([
            { text: 'Paciente:   ' },
            { text: `${stockData.patient.lastName.toUpperCase()} ${stockData.patient.firstName.toUpperCase()}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        pdf.add(new Txt([
            { text: 'DNI:    ' },
            { text: `${stockData.patient.dni}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        if (stockData.patient.fechaNac) {
            pdf.add(new Txt([
                { text: 'Fecha Nacimiento:    ' },
                { text: `${this.datePipe.transform(stockData.patient.fechaNac, 'dd/MM/yyyy')}`, bold: true }
            ]).end);
            pdf.add(new Txt('\n').end);
        }

        pdf.add(new Txt([
            { text: 'Sexo:    ' },
            { text: `${stockData.patient.sex}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        let obraSocial = '';
        let numeroAfiliado = '';
        if (stockData.patient.obraSocial?.nombre) {
            obraSocial = stockData.patient.obraSocial.nombre;
            numeroAfiliado = stockData.patient.obraSocial.numeroAfiliado || '';
        }
        pdf.add(new Txt([
            { text: 'Obra Social / Plan de salud :   ' }, { text: `${(obraSocial || 'No informado')}`, bold: true }
        ]).end);
        if (obraSocial) {
            pdf.add(new Txt([
                { text: 'Número de afiliado:   ' }, { text: `${numeroAfiliado || 'No informado'}`, bold: true }
            ]).end);
        }
        pdf.add(new Txt('\n').end);

        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Columns([new Txt('Insumos Prescriptos').end, new Columns([new Txt('').end]).end]).end);
        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);

        // Supplies
        stockData.supplies.forEach((item: any) => {
            const cant = item.quantityPresentation ? `${item.quantity} envase(s) de ${item.quantityPresentation} unidades` : `x ${item.quantity}`;

            pdf.add(new Columns([
                new Txt('' + item.supply.name).bold().end,
                new Txt(' ').end,
                new Txt(cant).bold().end
            ]).end);

            if (item.supply.type) {
                pdf.add(new Txt(`Tipo: ${item.supply.type}`).fontSize(10).margin([10, 0, 0, 0]).end);
            }
            if (item.supply.specification) {
                pdf.add(new Txt(`Especificación: ${item.supply.specification}`).fontSize(10).margin([10, 0, 0, 0]).end);
            }
            pdf.add(new Txt('\n').end);
        });

        // Loop ended
        pdf.add(new Txt('\n').end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Txt('\n').end);

        // Barcode Section
        if (prescriptionIdBarcodeImg) {
            pdf.add(new Columns([
                {
                    stack: [barcodeImg],
                    alignment: 'left',
                    width: '55%'
                },
                {
                    stack: [prescriptionIdLabel, prescriptionIdBarcodeImg],
                    alignment: 'right',
                    width: '45%'
                }
            ]).alignment('center').width('100%').end);

            // Professional Signature
            pdf.add(new Txt([
                { text: 'Este documento ha sido firmado \n electrónicamente por Dr.:', fontSize: 9, bold: true, italics: true },
                { text: '\n', fontSize: 3 },
                { text: `\n ${stockData.professional.businessName}`, fontSize: 14, bold: true },
                {
                    text: `\n ${stockData.professional?.profesionGrado?.length ?
                        stockData.professional.profesionGrado
                            .map((g: any) => `${g.profesion} MP ${g.numeroMatricula}`)
                            .join('\n')
                        : (stockData.professional?.enrollment ? `MP ${stockData.professional.enrollment}\n` : '')
                        }`, bold: true, fontSize: 9
                }
            ]).alignment('center').margin([0, 25, 0, 0]).end);

        } else {
            // Just barcode and signature
            pdf.add(new Columns([
                {
                    stack: [barcodeImg],
                    alignment: 'center',
                    width: '50%'
                },
                {
                    stack: [
                        new Txt([
                            { text: 'Este documento ha sido firmado \n electrónicamente por Dr.:', fontSize: 9, bold: true, italics: true },
                            { text: '\n', fontSize: 3 },
                            { text: `\n ${stockData.professional.businessName}`, fontSize: 14, bold: true },
                            {
                                text: `\n ${stockData.professional?.profesionGrado?.length ?
                                    stockData.professional.profesionGrado
                                        .map((g: any) => `${g.profesion} MP ${g.numeroMatricula}`)
                                        .join('\n')
                                    : (stockData.professional?.enrollment ? `MP ${stockData.professional.enrollment}\n` : '')
                                    }`, bold: true, fontSize: 9
                            }
                        ]).alignment('center').margin([0, 25, 0, 0]).end
                    ],
                    alignment: 'center',
                    width: '50%'
                }
            ]).alignment('center').width('100%').end);
        }

        // Footer
        pdf.footer(new Txt([
            { text: '  Esta receta fue creada por emisor inscripto y válido en el Registro de Recetarios Electrónicos \n del Ministerio de Salud de la Nación - ', italics: true },
            { text: 'RL-2025-63212094-APN-SSVEIYES#MS   ', bold: true }
        ]).fontSize(11).alignment('center').end);
    }
}
