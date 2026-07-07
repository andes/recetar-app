import { Injectable } from '@angular/core';
import { PdfMakeWrapper, Txt, Canvas, Line, Img, Columns } from 'pdfmake-wrapper';
import * as pdfFontsX from 'pdfmake-unicode/dist/pdfmake-unicode.js';
import { DatePipe } from '@angular/common';
import { BarcodeService } from '@services/barcode.service';
import { formatTipoInsumo } from '@services/stock.service';

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

        let prescriptionIdBarcodeImg = null;
        let prescriptionIdLabel = null;
        const prescriptionId = stockData.prescriptionId || stockData.idReceta;
        if (prescriptionId) {
            const prescriptionIdBarcodeBase64 = await this.barcodeService.generateBarcodeBase64(prescriptionId);
            prescriptionIdLabel = new Txt('Número de receta:').fontSize(9).bold().alignment('center').margin([0, 5, 0, 0]).end;
            prescriptionIdBarcodeImg = await new Img(prescriptionIdBarcodeBase64).fit([230, 60]).alignment('center').margin([0, 5]).build();
        }

        const professional = stockData.professional || stockData.profesional;
        const profBusinessName = this.getProfessionalName(professional) || 'Profesional';

        pdf.info({
            title: 'Receta de Insumos ' + profBusinessName,
            author: 'RecetAR'
        });

        // Header
        pdf.add(new Columns([
            await new Img('assets/img/LogoPdf.jpg').fit([60, 60]).build(),
            new Txt('RECETA DE INSUMOS').bold().fontSize(20).alignment('center').end,
            new Txt(label ? `${label}` : '').bold().italics().fontSize(20).alignment('right').opacity(0.6).end]).end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Columns([new Txt('RECETAR').bold().alignment('left').end, new Txt(`Fecha prescripción: ${this.datePipe.transform(stockData.date || stockData.fechaPrestacion || stockData.fechaRegistro, 'dd/MM/yyyy')}`).alignment('right').end]).end);
        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);

        // Patient
        const patientLastName = (stockData.patient?.lastName || stockData.paciente?.apellido || '').toUpperCase();
        const patientFirstName = (stockData.patient?.firstName || stockData.paciente?.nombre || '').toUpperCase();
        const patientDni = stockData.patient?.dni || stockData.paciente?.documento || '';
        const fechaNac = stockData.patient?.fechaNac || stockData.patient?.fechaNacimiento || stockData.paciente?.fechaNacimiento;
        const sex = stockData.patient?.sex || stockData.paciente?.sexo || stockData.paciente?.genero || 'No informado';

        pdf.add(new Txt([
            { text: 'Paciente:   ' },
            { text: `${patientLastName} ${patientFirstName}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        pdf.add(new Txt([
            { text: 'DNI:    ' },
            { text: `${patientDni}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        if (fechaNac) {
            pdf.add(new Txt([
                { text: 'Fecha Nacimiento:    ' },
                { text: `${this.datePipe.transform(fechaNac, 'dd/MM/yyyy')}`, bold: true }
            ]).end);
            pdf.add(new Txt('\n').end);
        }

        pdf.add(new Txt([
            { text: 'Sexo:    ' },
            { text: `${sex}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        let obraSocial = '';
        let numeroAfiliado = '';
        const osObj = stockData.patient?.obraSocial || stockData.paciente?.obraSocial;
        if (osObj?.nombre || osObj?.financiador) {
            obraSocial = osObj.nombre || osObj.financiador || '';
            numeroAfiliado = osObj.numeroAfiliado || '';
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
        const suppliesList = stockData.supplies || (stockData.insumo ? [{
            supply: {
                name: stockData.insumo.nombre || stockData.insumo.concepto?.term,
                type: stockData.insumo.tipo,
                specification: stockData.insumo.especificacion
            },
            quantity: stockData.insumo.cantidad
        }] : []);

        suppliesList.forEach((item: any) => {
            const supplyName = item.supply?.name || item.name || 'Insumo';
            const cant = item.quantityPresentation ? `${item.quantity} envase(s) de ${item.quantityPresentation} unidades` : `x ${item.quantity || 1}`;

            pdf.add(new Columns([
                new Txt('' + supplyName).bold().end,
                new Txt(' ').end,
                new Txt(cant).bold().end
            ]).end);

            if (item.supply?.type || item.type) {
                pdf.add(new Txt(`Tipo: ${formatTipoInsumo(item.supply?.type || item.type)}`).fontSize(10).margin([10, 0, 0, 0]).end);
            }
            if (item.supply?.specification || item.specification) {
                pdf.add(new Txt(`Especificación: ${item.supply?.specification || item.specification}`).fontSize(10).margin([10, 0, 0, 0]).end);
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
            pdf.add(new Txt(this.getSignatureContent(professional, stockData.organizacion))
                .alignment('center')
                .margin([0, 25, 0, 0])
                .end);

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
                        new Txt(this.getSignatureContent(professional, stockData.organizacion))
                            .alignment('center')
                            .margin([0, 25, 0, 0])
                            .end
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

    private getProfessionalName(prof: any): string {
        if (!prof) {
            return '';
        }
        if (prof.businessName) {
            return prof.businessName;
        }
        if (prof.apellido && prof.nombre) {
            return `${prof.apellido.toUpperCase()}, ${prof.nombre.toUpperCase()}`;
        }
        if (prof.apellido) {
            return prof.apellido.toUpperCase();
        }
        if (prof.nombre) {
            return prof.nombre.toUpperCase();
        }
        return '';
    }

    private getProfessionalMatriculas(prof: any): string {
        if (!prof) {
            return '';
        }
        if (prof.profesionGrado && Array.isArray(prof.profesionGrado) && prof.profesionGrado.length > 0) {
            return prof.profesionGrado
                .map((g: any) => {
                    const mat = g.numeroMatricula || g.matricula;
                    if (g.profesion && mat) {
                        return `${g.profesion} MP ${mat}`;
                    } else if (mat) {
                        return `MP ${mat}`;
                    }
                    return '';
                })
                .filter((s: string) => !!s)
                .join('\n');
        }
        const enrollment = prof.enrollment || prof.matricula;
        if (enrollment) {
            return prof.profesion ? `${prof.profesion} MP ${enrollment}` : `MP ${enrollment}`;
        }
        return '';
    }

    private getOrganizacionDireccion(direccion: any): string {
        if (!direccion) {
            return '';
        }
        if (typeof direccion === 'string') {
            return direccion;
        }
        return direccion.valor || '';
    }

    private getSignatureContent(professional: any, organizacion?: any): any[] {
        const name = this.getProfessionalName(professional);
        const matriculas = this.getProfessionalMatriculas(professional);
        const orgStr = organizacion ? `\n Organización: ${organizacion.nombre}${this.getOrganizacionDireccion(organizacion.direccion) ? ' - ' + this.getOrganizacionDireccion(organizacion.direccion) : ''}` : '';

        const content: any[] = [
            { text: 'Este documento ha sido firmado \n electrónicamente por Dr.:', fontSize: 9, bold: true, italics: true }
        ];

        if (name) {
            content.push({ text: `\n ${name}`, fontSize: 14, bold: true });
        }

        if (matriculas) {
            content.push({ text: `\n ${matriculas}`, fontSize: 9, bold: true });
        }

        if (orgStr) {
            content.push({ text: orgStr, fontSize: 9, bold: true });
        }

        return content;
    }
}
