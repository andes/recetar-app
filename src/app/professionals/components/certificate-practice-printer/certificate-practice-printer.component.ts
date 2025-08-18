import { Component, OnInit } from '@angular/core';
import { PdfMakeWrapper, Txt, Canvas, Line, Img, Columns } from 'pdfmake-wrapper';
import { DatePipe } from '@angular/common';
import { Certificate } from '@interfaces/certificate';
import { Practice } from '@interfaces/practices';
import { CertificatesService } from '@services/certificates.service';
import { PracticesService } from '@services/practices.service';
import * as QRCode from 'qrcode';
import { environment } from '@root/environments/environment';

@Component({
    selector: 'app-certificate-practice-printer',
    templateUrl: './certificate-practice-printer.html'
})
export class CertificatePracticePrinterComponent implements OnInit {

    constructor(
        private datePipe: DatePipe,
        private certificatesService: CertificatesService,
        private practicesService: PracticesService
    ) { }

    ngOnInit(): void {
    }

    // Generate QR Code as base64 image
    private async generateQRCode(url: string): Promise<string> {
        try {
            const qrCodeDataURL = await QRCode.toDataURL(url, {
                width: 150,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            return qrCodeDataURL;
        } catch (error) {
            return '';
        }
    }

    // Print a certificate as PDF
    async printCertificate(certificate: Certificate) {
        const pdf: PdfMakeWrapper = new PdfMakeWrapper();
        pdf.info({
            title: 'Certificado médico',
            author: 'RecetAR'
        });

        // Generate QR Code
        const encryptedId = this.certificatesService.encryptId(certificate._id);
        const qrUrl = `${environment.FRONTEND_URL}/certificate/${encryptedId}`;
        const qrCodeImage = await this.generateQRCode(qrUrl);

        // Header
        pdf.add(new Columns([await new Img('assets/img/LogoPdf.jpg').fit([60, 60]).build(), new Txt('RecetAR').bold().fontSize(20).alignment('center').end, new Txt('').end]).end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Txt('CERTIFICADO MÉDICO').bold().fontSize(16).alignment('center').end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Txt(`Fecha: ${this.datePipe.transform(certificate.createdAt, 'dd/MM/yyyy')}`).alignment('right').end);
        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);

        // Patient information
        pdf.add(new Txt([
            { text: 'Paciente: ' },
            { text: `${certificate.patient.lastName.toUpperCase()} ${certificate.patient.firstName.toUpperCase()}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        pdf.add(new Txt([
            { text: 'DNI: ' },
            { text: `${certificate.patient.dni}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        if (certificate.patient.fechaNac) {
            pdf.add(new Txt([
                { text: 'Fecha Nacimiento: ' },
                { text: `${this.datePipe.transform(certificate.patient.fechaNac, 'dd/MM/yyyy')}`, bold: true }
            ]).end);
            pdf.add(new Txt('\n').end);
        }

        pdf.add(new Txt([
            { text: 'Sexo: ' },
            { text: `${certificate.patient.sex}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        // Obra Social information
        let obraSocial = '';
        let numeroAfiliado = '';
        if (certificate.patient.obraSocial?.nombre) {
            obraSocial = certificate.patient.obraSocial.nombre;
            numeroAfiliado = certificate.patient.obraSocial.numeroAfiliado || '';
        }
        pdf.add(new Txt([
            { text: 'Obra Social / Plan de salud: ' }, { text: `${obraSocial || 'No informado'}`, bold: true }
        ]).end);
        if (obraSocial) {
            pdf.add(new Txt([
                { text: 'Número de afiliado: ' }, { text: `${numeroAfiliado || 'No informado'}`, bold: true }
            ]).end);
        }
        pdf.add(new Txt('\n').end);

        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);

        // Certificate content
        pdf.add(new Txt('CERTIFICO QUE:').bold().end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Txt(`${certificate.certificate}`).end);
        pdf.add(new Txt('\n\n').end);

        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);

        // QR Code
        if (qrCodeImage) {
            pdf.add(new Txt('Verificar autenticidad:').bold().alignment('center').end);
            pdf.add(new Txt('\n').end);
            pdf.add(await new Img(qrCodeImage)
                .fit([100, 100])
                .alignment('center')
                .link(qrUrl)
                .build());
            pdf.add(new Txt('\n').end);
        }

        // Footer
        pdf.add(new Txt('Este certificado fue emitido digitalmente a través de RecetAR').italics().alignment('center').end);
        pdf.add(new Txt(`Fecha de emisión: ${this.datePipe.transform(certificate.createdAt, 'dd/MM/yyyy HH:mm')}`).italics().alignment('center').end);

        pdf.create().open();
    }

    // Print a practice as PDF
    async printPractice(practice: Practice) {
        const pdf: PdfMakeWrapper = new PdfMakeWrapper();
        pdf.info({
            title: 'Práctica médica',
            author: 'RecetAR'
        });

        // Generate QR Code
        const encryptedId = this.practicesService.encryptId(practice._id);
        const qrUrl = `${environment.FRONTEND_URL}/practice/${encryptedId}`;
        const qrCodeImage = await this.generateQRCode(qrUrl);

        // Header
        pdf.add(new Columns([await new Img('assets/img/LogoPdf.jpg').fit([60, 60]).build(), new Txt('RecetAR').bold().fontSize(20).alignment('center').end, new Txt('').end]).end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Txt('PRÁCTICA MÉDICA').bold().fontSize(16).alignment('center').end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Txt(`Fecha: ${this.datePipe.transform(practice.date, 'dd/MM/yyyy')}`).alignment('right').end);
        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);

        // Professional information
        pdf.add(new Txt([
            { text: 'Profesional: ' },
            { text: `${practice.professional.businessName}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        pdf.add(new Txt([
            { text: 'Matrícula: ' },
            { text: `${practice.professional.enrollment}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);

        // Patient information
        pdf.add(new Txt([
            { text: 'Paciente: ' },
            { text: `${practice.patient.lastName.toUpperCase()} ${practice.patient.firstName.toUpperCase()}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        pdf.add(new Txt([
            { text: 'DNI: ' },
            { text: `${practice.patient.dni}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        pdf.add(new Txt([
            { text: 'Sexo: ' },
            { text: `${practice.patient.sex}`, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        // Obra Social information
        let obraSocial = '';
        let numeroAfiliado = '';
                console.log(practice);

        if (practice.patient.obraSocial?.nombre) {
            obraSocial = practice.patient.obraSocial.nombre;
            numeroAfiliado = practice.patient.obraSocial.numeroAfiliado || '';
        }
        pdf.add(new Txt([
            { text: 'Obra Social / Plan de salud: ' }, { text: `${obraSocial || 'No informado'}`, bold: true }
        ]).end);
        if (obraSocial) {
            pdf.add(new Txt([
                { text: 'Número de afiliado: ' }, { text: `${numeroAfiliado || 'No informado'}`, bold: true }
            ]).end);
        }
        pdf.add(new Txt('\n').end);

        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);

        // Practice content
        pdf.add(new Txt('PRÁCTICA REALIZADA:').bold().end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Txt(`${practice.practice}`).end);
        pdf.add(new Txt('\n').end);

        if (practice.diagnostic) {
            pdf.add(new Txt('DIAGNÓSTICO:').bold().end);
            pdf.add(new Txt(`${practice.diagnostic}`).end);
            pdf.add(new Txt('\n').end);
        }

        if (practice.indications) {
            pdf.add(new Txt('INDICACIONES:').bold().end);
            pdf.add(new Txt(`${practice.indications}`).end);
            pdf.add(new Txt('\n').end);
        }

        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);

        // QR Code
        if (qrCodeImage) {
            pdf.add(new Txt('Verificar autenticidad:').bold().alignment('center').end);
            pdf.add(new Txt('\n').end);
            pdf.add(await new Img(qrCodeImage)
                .fit([100, 100])
                .alignment('center')
                .link(qrUrl)
                .build());
            pdf.add(new Txt('\n').end);
        }

        // Footer
        pdf.footer(new Txt([
      { text:'Esta receta fue creada por emisor inscripto y valido en el Registro de Recetarios Electrónicos \n del Ministerio de Salud de la Nación - ', italics: true},
      { text:'RL-2025-63212094-APN-SSVEIYES#MS', bold: true}
    ]).fontSize(11).alignment('center').end);
        pdf.create().open();
    }
}
