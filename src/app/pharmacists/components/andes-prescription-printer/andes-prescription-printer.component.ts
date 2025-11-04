import { Component, OnInit } from '@angular/core';
import { PdfMakeWrapper, Txt, Canvas, Line, Img, Columns } from 'pdfmake-wrapper';
import { DatePipe } from '@angular/common';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { BarcodeService } from '@services/barcode.service';

@Component({
    selector: 'app-prescription-printer',
    templateUrl: './andes-prescription-printer.component.html',
    styleUrls: ['./andes-prescription-printer.component.sass']
})
export class AndesPrescriptionPrinterComponent implements OnInit {

    constructor(
        private datePipe: DatePipe,
        private barcodeService: BarcodeService

    ) { }

    ngOnInit(): void {
    }

    // Print a prescription as PDF
    async print(prescription: AndesPrescriptions) {
        const pdf: PdfMakeWrapper = new PdfMakeWrapper();

        // Primera página
        await this.addPage(pdf, prescription);

        // Duplicado
        if (prescription.medicamento.tipoReceta === 'duplicado') {
            pdf.add({ text: '', pageBreak: 'after' });
            await this.addPage(pdf, prescription, 'DUPLICADO');
        }

        pdf.create().open();
    }
    private async addPage(pdf: PdfMakeWrapper, prescription: AndesPrescriptions, label?: string) {

        if (prescription.estadoActual.tipo === 'vencida') {
            pdf.watermark({
                text: 'Receta no valida para dispensa',
                color: 'grey',
                opacity: 0.3,
                bold: true,
                fontSize: 60
            });
        }
        if (prescription.estadoActual.tipo === 'dispensada') {
            pdf.watermark({
                text: 'DISPENSADA',
                color: 'grey',
                opacity: 0.3,
                bold: true,
                fontSize: 100
            });
        }

        const barcodeBase64 = await this.barcodeService.generateBarcodeBase64(prescription._id || prescription.idAndes);
        const barcodeImg = await new Img(barcodeBase64).fit([230, 60]).alignment('center').margin([0, 20]).build();
        pdf.info({
            title: 'Receta digital ' + prescription.profesional.nombre + ', ' + prescription.profesional.apellido,
            author: 'Andes'
        });
        // Header
        const fecha = prescription.fechaRegistro ? this.datePipe.transform(prescription.fechaRegistro, 'dd/MM/yyyy') : this.datePipe.transform(prescription.fechaPrestacion, 'dd/MM/yyyy');

        pdf.add(new Columns(
            [
                await new Img('assets/img/LogoPdf.jpg').fit([60, 60]).build(),
                new Txt('RecetAR').bold().fontSize(20).alignment('center').end,
                new Txt(label ? `${label}` : '').bold().italics().fontSize(20).alignment('right').opacity(0.6).end]).end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Columns([new Txt('RECETAR').bold().alignment('left').end, new Txt(`Fecha prescripción: ${fecha}`).alignment('right').end]).end);
        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);

        // paciente
        pdf.add(new Txt([
            { text: 'Paciente:   ' },
            { text: `${prescription.paciente.apellido.toUpperCase()} ${prescription.paciente.nombre.toUpperCase()}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        pdf.add(new Txt([
            { text: 'DNI:    ' },
            { text: `${prescription.paciente.documento}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);
        if (prescription.paciente.fechaNacimiento) {
            pdf.add(new Txt([
                { text: 'Fecha Nacimiento:    ' },
                { text: `${this.datePipe.transform(prescription.paciente.fechaNacimiento, 'dd/MM/yyyy')}`, bold: true }
            ]).end);
            pdf.add(new Txt('\n').end);
        }
        pdf.add(new Txt([
            { text: 'Sexo:    ' },
            { text: `${prescription.paciente.sexo}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        let obraSocial = 'No informado';
        let numeroAfiliado = '';
        if (prescription.paciente.obraSocial) {
            obraSocial = prescription.paciente.obraSocial.nombre ? prescription.paciente.obraSocial.nombre : 'No informado';
            numeroAfiliado = obraSocial ? prescription.paciente.obraSocial.numeroAfiliado : '';
        }
        pdf.add(new Txt([
            { text: 'Obra Social / Plan de salud :   ' }, { text: `${obraSocial}`, bold: true }
        ]).end);
        if (obraSocial) {
            pdf.add(new Txt([
                { text: 'Número de afiliado:' }, { text: `${numeroAfiliado || 'No informado'}`, bold: true }
            ]).end);
        }
        pdf.add(new Txt('\n').end);

        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Columns([new Txt('Medicamento').end, new Columns([new Txt('').end]).end]).end);
        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        // Supplies
        pdf.add(new Txt('\n').end);

        pdf.add(new Columns([
            new Txt('' + prescription.medicamento.concepto.term).bold().end,
            new Columns([
                new Txt(' ').end,
                new Txt(`   ${prescription.medicamento.cantEnvases} envase(s) de ${prescription.medicamento.cantidad} unidad(es)`).bold().end]
            ).end
        ]).end);
        pdf.add(new Txt('\n').end);


        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);

        if (prescription.diagnostico) {
            pdf.add(new Txt('\n').end);
            pdf.add(new Txt('Diagnóstico').bold().end);
            pdf.add(new Txt('' + (prescription.diagnostico.term ? prescription.diagnostico.term : prescription.diagnostico.descripcion)).end);
        }
        if (prescription.medicamento.dosisDiaria.notaMedica) {
            pdf.add(new Txt('\n').end);
            pdf.add(new Txt('Nota medica').bold().end);
            pdf.add(new Txt('' + prescription.medicamento.dosisDiaria.notaMedica).end);
        }
        if (prescription.dispensa.length > 0) {
            pdf.add(new Txt('\n').end);
            pdf.add(new Txt('Observaciones').bold().end);
            prescription.dispensa.forEach(supply => {
                supply.medicamento?.forEach(medicamento => {
                    medicamento.observacion ? pdf.add(new Txt('' + medicamento.observacion).end) : null;
                });
            });
        }
        pdf.add(new Txt('\n').end);
        pdf.add(new Txt('Dosis: ' + (prescription.medicamento.dosisDiaria.dosis ? prescription.medicamento.dosisDiaria.dosis : 'No informado') + (`${typeof (prescription.medicamento.dosisDiaria.intervalo) === 'string' ? ` por ${prescription.medicamento.dosisDiaria.intervalo}` : ''}`)).end);
        pdf.add(new Txt('Duración tratamiento: ' + (prescription.medicamento.dosisDiaria.dias ? prescription.medicamento.dosisDiaria.dias + ' dia/s' : 'No informado')).end);
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
                { text: `\n ${prescription.profesional.apellido}`, fontSize: 14, bold: true },
                { text: `\n MP ${prescription.profesional.matricula}`, bold: true, fontSize: 10 }
            ]).alignment('center').end]).end);

        // Pharmacy
        if (prescription.estadoActual.tipo === 'dispensada' && prescription.estadoDispensaActual.fecha) {
            pdf.add(new Txt(`Fecha dispensación: ${this.datePipe.transform(prescription.estadoDispensaActual.fecha, 'dd/MM/yyyy')}`).end);
        }

        pdf.footer(new Txt([
            { text: 'Esta receta fue creada por emisor inscripto y válido en el Registro de Recetarios Electrónicos \n del Ministerio de Salud de la Nación - ', italics: true },
            { text: 'RL-2025-63212094-APN-SSVEIYES#MS', bold: true }
        ]).fontSize(11).alignment('center').end);
    }
}
