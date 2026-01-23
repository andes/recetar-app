import { Component, Injectable } from '@angular/core';
import { PdfMakeWrapper, Txt, Canvas, Line, Img, Columns } from 'pdfmake-wrapper';
import * as pdfFontsX from 'pdfmake-unicode/dist/pdfmake-unicode.js';
import { DatePipe } from '@angular/common';
import { Prescriptions } from '@interfaces/prescriptions';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { Certificate } from '@interfaces/certificate';
import { Practice } from '@interfaces/practices';
import { BarcodeService } from '@services/barcode.service';
import { CertificatesService } from '@services/certificates.service';
import { PracticesService } from '@services/practices.service';
import { PatientsService } from '@services/patients.service';
import * as QRCode from 'qrcode';
import { environment } from '../../../../environments/environment';
import { PatientNamePipe } from '@shared/pipes/patient-name.pipe';

PdfMakeWrapper.setFonts(pdfFontsX);

@Injectable({
    providedIn: 'root'
})
export class UnifiedPrinterComponent {

    constructor(
        private datePipe: DatePipe,
        private patientNamePipe: PatientNamePipe,
        private barcodeService: BarcodeService,
        private certificatesService: CertificatesService,
        private practicesService: PracticesService,
        private patientsService: PatientsService
    ) { }

    private async _generatePdf(buildFunction: (pdf: PdfMakeWrapper) => Promise<void> | void) {
        const pdf = new PdfMakeWrapper();
        await Promise.resolve(buildFunction(pdf));
        pdf.create().open();
    }

    // Print regular prescription
    async printPrescription(prescription: Prescriptions) {
        await this._generatePdf(async (pdf) => {
            // Primera página
            await this.addPage(pdf, prescription);
            // Duplicado
            if (prescription.supplies.some(s => s.duplicate)) {
                pdf.add({ text: '', pageBreak: 'after' });
                await this.addPage(pdf, prescription, 'DUPLICADO');
            }
        });
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

        // Segundo código de barras para prescriptionId
        let prescriptionIdBarcodeImg = null;
        let prescriptionIdLabel = null;
        if (prescription.prescriptionId) {
            const prescriptionIdBarcodeBase64 = await this.barcodeService.generateBarcodeBase64(prescription.prescriptionId);
            prescriptionIdLabel = new Txt('Número de receta:').fontSize(9).bold().alignment('center').margin([0, 5, 0, 0]).end;
            prescriptionIdBarcodeImg = await new Img(prescriptionIdBarcodeBase64).fit([230, 60]).alignment('center').margin([0, 5]).build();
        }
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
        this.addPatientData(pdf, {
            firstname: `${prescription.patient.firstName}`,
            lastname: `${prescription.patient.lastName}`,
            autopercibido: `${prescription.patient.nombreAutopercibido || ''}`,
            dni: `${prescription.patient.dni}`,
            dob: prescription.patient.fechaNac,
            sex: `${prescription.patient.sex}`,
            obraSocial: prescription.patient.obraSocial?.nombre,
            affiliateNumber: prescription.patient.obraSocial?.numeroAfiliado
        });

        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Columns([new Txt('Medicamento').end, new Columns([new Txt('').end]).end]).end);
        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        // Supplies
        pdf.add(new Txt('\n').end);

        prescription.supplies.forEach(supply => {
            const cant = supply.quantityPresentation ? `${supply.quantity} envase(s) de ${supply.quantityPresentation} unidades` : `x ${supply.quantity}`;
            pdf.add(new Columns([new Txt('' + supply.supply.name).bold().end,
            new Txt(' ').end,
            new Columns([new Txt(`${cant} `).bold().end]).end]).end);
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


        // Barcode
        if (prescriptionIdBarcodeImg) {
            // Si hay prescriptionId, mostrar ambos códigos en columnas
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

            // Firma del profesional debajo cuando hay prescriptionId
            pdf.add(new Txt([
                { text: 'Este documento ha sido firmado \n electrónicamente por Dr.:', fontSize: 9, bold: true, italics: true },
                { text: '\n', fontSize: 3 },
                { text: `\n ${prescription.professional.businessName}`, fontSize: 14, bold: true },
                {
                    text: `\n ${prescription.professional?.profesionGrado?.length ?
                        prescription.professional.profesionGrado
                            .map(g => `${g.profesion} MP ${g.numeroMatricula}`)
                            .join('\n')
                        : (prescription.professional?.enrollment ? `MP ${prescription.professional.enrollment}\n` : '')
                        }`, bold: true, fontSize: 9
                }
            ]).alignment('center').margin([0, 25, 0, 0]).end);
        } else {
            // Si no hay prescriptionId, mostrar código de barras y firma en columnas
            this.addProfessionalSignature(pdf, prescription.professional, [barcodeImg]);
        }

        // Pharmacy
        if (prescription.status === 'Dispensada') {
            pdf.add(new Txt('\n').margin([0, 10]).end);
            pdf.add(new Columns([new Txt('Dispensado por').bold().alignment('center').end, new Txt('CUIL').bold().alignment('center').end]).alignment('center').end);
            pdf.add(new Columns([new Txt('' + prescription.dispensedBy.businessName.toUpperCase()).alignment('center').end, new Txt('' + prescription.dispensedBy.cuil).alignment('center').end]).alignment('center').end);
            pdf.add(new Txt('\n').margin([0, 5]).end);
            pdf.add(new Txt(`Fecha dispensación: ${this.datePipe.transform(prescription.dispensedAt, 'dd/MM/yyyy')}`).alignment('center').end);
        }

        pdf.footer(new Txt([
            { text: '  Esta receta fue creada por emisor inscripto y válido en el Registro de Recetarios Electrónicos \n del Ministerio de Salud de la Nación - ', italics: true },
            { text: 'RL-2025-63212094-APN-SSVEIYES#MS   ', bold: true }
        ]).fontSize(11).alignment('center').end);
    }
    async printAndesPrescription(prescription: AndesPrescriptions) {
        await this._generatePdf(async (pdf) => {
            await this.addAndesPage(pdf, prescription);
            if (prescription.medicamento.tipoReceta === 'duplicado') {
                pdf.add({ text: '', pageBreak: 'after' });
                await this.addAndesPage(pdf, prescription, 'DUPLICADO');
            }
        });
    }

    private async addAndesPage(pdf: PdfMakeWrapper, prescription: AndesPrescriptions, label?: string) {
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

        let barcodeRecetaImg = null;
        let barcodeRecetaLabel = null;
        if (prescription.idReceta) {
            const barcodeRecetaBase64 = await this.barcodeService.generateBarcodeBase64(prescription.idReceta);
            barcodeRecetaLabel = new Txt('Número de receta:').fontSize(9).bold().alignment('center').margin([0, 5, 0, 0]).end;
            barcodeRecetaImg = await new Img(barcodeRecetaBase64).fit([230, 60]).alignment('center').margin([0, 5]).build();
        }

        pdf.info({
            title: 'Receta digital ' + prescription.profesional.nombre + ', ' + prescription.profesional.apellido,
            author: 'Andes'
        });

        const fecha = prescription.fechaRegistro ? this.datePipe.transform(prescription.fechaRegistro, 'dd/MM/yyyy') : this.datePipe.transform(prescription.fechaPrestacion, 'dd/MM/yyyy');

        pdf.add(new Columns([
            await new Img('assets/img/LogoPdf.jpg').fit([60, 60]).build(),
            new Txt('RECETA').bold().fontSize(20).alignment('center').end,
            new Txt(label ? `${label}` : '').bold().italics().fontSize(20).alignment('right').opacity(0.6).end
        ]).end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Columns([new Txt('RECETAR').bold().alignment('left').end, new Txt(`Fecha prescripción: ${fecha}`).alignment('right').end]).end);
        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);

        const patients = await this.patientsService.getPatientByDni(prescription.paciente.documento).toPromise();
        const patient = patients[0];

        this.addPatientData(pdf, {
            firstname: `${prescription.paciente.nombre}`,
            lastname: `${prescription.paciente.apellido}`,
            autopercibido: `${patient.nombreAutopercibido || ''}`, dni: `${prescription.paciente.documento}`,
            dob: prescription.paciente.fechaNacimiento,
            sex: `${prescription.paciente.sexo}`,
            obraSocial: prescription.paciente.obraSocial?.nombre,
            affiliateNumber: prescription.paciente.obraSocial?.numeroAfiliado
        });

        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
        pdf.add(new Txt('\n').end);
        pdf.add(new Columns([new Txt('Medicamento').end, new Columns([new Txt('').end]).end]).end);
        pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
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

        if (barcodeRecetaImg) {
            pdf.add(new Columns([
                { width: '50%', stack: [barcodeImg] },
                { width: '50%', stack: [barcodeRecetaLabel, barcodeRecetaImg], alignment: 'right' }
            ]).end);
        } else {
            pdf.add(new Columns([barcodeImg]).end);
        }

        pdf.add(new Txt([
            { text: 'Este documento ha sido firmado \n electrónicamente por Dr.:', fontSize: 9, bold: true, italics: true },
            { text: '\n', fontSize: 3 },
            { text: `\n ${prescription.profesional.apellido}`, fontSize: 14, bold: true },
            { text: `\n MP ${prescription.profesional.matricula}`, bold: true, fontSize: 10 }
        ]).alignment('center').end);

        if (prescription.estadoActual.tipo === 'dispensada' && prescription.estadoDispensaActual.fecha) {
            pdf.add(new Txt(`Fecha dispensación: ${this.datePipe.transform(prescription.estadoDispensaActual.fecha, 'dd/MM/yyyy')}`).end);
        }

        pdf.footer(new Txt([
            { text: 'Esta receta fue creada por emisor inscripto y válido en el Registro de Recetarios Electrónicos \n del Ministerio de Salud de la Nación - ', italics: true },
            { text: 'RL-2025-63212094-APN-SSVEIYES#MS', bold: true }
        ]).fontSize(11).alignment('center').end);
    }

    // Print certificate
    async printCertificate(certificate: Certificate) {
        await this._generatePdf(async (pdf) => {
            pdf.info({
                title: 'Certificado médico',
                author: 'RecetAR'
            });

            const encryptedId = this.certificatesService.encryptId(certificate._id);
            const qrUrl = `${environment.FRONTEND_URL}/certificate/${encryptedId}`;
            const qrCodeImage = await this.generateQRCode(qrUrl);

            pdf.add(new Columns([await new Img('assets/img/LogoPdf.jpg').fit([60, 60]).build(), new Txt('CERTIFICADO MÉDICO').bold().fontSize(20).alignment('center').end, new Txt('').end]).end);
            pdf.add(new Txt('\n').end);
            pdf.add(new Txt(`Fecha: ${this.datePipe.transform(certificate.createdAt, 'dd/MM/yyyy')}`).alignment('right').end);
            pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
            pdf.add(new Txt('\n').end);

            this.addPatientData(pdf, {
                firstname: `${certificate.patient.firstName}`,
                lastname: `${certificate.patient.lastName}`,
                autopercibido: `${certificate.patient.nombreAutopercibido || ''}`,
                dni: `${certificate.patient.dni}`,
                dob: certificate.patient.fechaNac,
                sex: `${certificate.patient.sex}`,
                obraSocial: certificate.patient.obraSocial?.nombre,
                affiliateNumber: certificate.patient.obraSocial?.numeroAfiliado
            });

            if (certificate.startDate) {
                pdf.add(new Txt([
                    { text: 'Fecha de inicio: ' }, { text: `${this.datePipe.transform(certificate.startDate, 'dd/MM/yyyy HH:mm')} hs`, bold: true }
                ]).end);
                pdf.add(new Txt('\n').end);

            }
            if (certificate.endDate) {
                pdf.add(new Txt([
                    { text: 'Fecha de fin:     ' }, { text: `${this.datePipe.transform(certificate.endDate, 'dd/MM/yyyy HH:mm')} hs`, bold: true }
                ]).end);
                pdf.add(new Txt('\n').end);

            }
            if (certificate.cantDias) {

                pdf.add(new Txt([
                    { text: 'Cantidad de días: ' }, { text: `${certificate.cantDias}`, bold: true }
                ]).end);
                pdf.add(new Txt('\n').end);
            }

            pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
            pdf.add(new Txt('\n').end);

            pdf.add(new Txt('CERTIFICO QUE:').bold().end);
            pdf.add(new Txt('\n').end);
            pdf.add(new Txt(`${certificate.certificate}`).end);
            pdf.add(new Txt('\n\n').end);

            pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
            pdf.add(new Txt('\n').end);

            const qrStack = qrCodeImage ? [
                new Txt('Verificar autenticidad:').bold().alignment('center').end,
                new Txt('\n').end,
                await new Img(qrCodeImage).fit([100, 100]).alignment('center').link(qrUrl).build()
            ] : [];
            this.addProfessionalSignature(pdf, certificate.professional, qrStack);
            pdf.footer(new Txt([
                { text: 'Este certificado fue emitido digitalmente a través de RecetAR - ', italics: true },
                { text: `Fecha de emisión: ${this.datePipe.transform(certificate.createdAt, 'dd/MM/yyyy HH:mm')}`, bold: true }
            ]).fontSize(11).alignment('center').end);
        });
    }

    // Print practice
    async printPractice(practice: Practice) {
        await this._generatePdf(async (pdf) => {
            pdf.info({
                title: 'Práctica médica',
                author: 'RecetAR'
            });

            const encryptedId = this.practicesService.encryptId(practice._id);
            const qrUrl = `${environment.FRONTEND_URL}/practice/${encryptedId}`;
            const qrCodeImage = await this.generateQRCode(qrUrl);

            pdf.add(new Columns([await new Img('assets/img/LogoPdf.jpg').fit([60, 60]).build(), new Txt('PRÁCTICA MÉDICA').bold().fontSize(20).alignment('center').end, new Txt('').end]).end);
            pdf.add(new Txt('\n').end);
            pdf.add(new Txt(`Fecha: ${this.datePipe.transform(practice.date, 'dd/MM/yyyy')}`).alignment('right').end);
            pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
            pdf.add(new Txt('\n').end);

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

            this.addPatientData(pdf, {
                firstname: `${practice.patient.firstName}`,
                lastname: `${practice.patient.lastName}`,
                autopercibido: `${practice.patient.nombreAutopercibido || ''}`,
                dni: `${practice.patient.dni}`,
                dob: null,
                sex: `${practice.patient.sex}`,
                obraSocial: practice.patient.obraSocial?.nombre,
                affiliateNumber: practice.patient.obraSocial?.numeroAfiliado
            });

            pdf.add(new Canvas([new Line(1, [515, 1]).end]).end);
            pdf.add(new Txt('\n').end);

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

            const qrStack = qrCodeImage ? [
                new Txt('Verificar autenticidad:').bold().alignment('center').end,
                new Txt('\n').end,
                await new Img(qrCodeImage).fit([100, 100]).alignment('center').link(qrUrl).build()
            ] : [];
            this.addProfessionalSignature(pdf, practice.professional, qrStack);
            pdf.footer(new Txt([
                { text: 'Esta receta fue creada por emisor inscripto y valido en el Registro de Recetarios Electrónicos \n del Ministerio de Salud de la Nación - ', italics: true },
                { text: 'RL-2025-63212094-APN-SSVEIYES#MS', bold: true }
            ]).fontSize(11).alignment('center').end);
        });
    }

    private addProfessionalSignature(pdf: PdfMakeWrapper, professional: any, leftStack?: any[]) {
        pdf.add(new Columns([
            {
                stack: leftStack || [],
                alignment: 'center',
                width: '50%'
            },
            {
                stack: [
                    new Txt([
                        { text: 'Este documento ha sido firmado \n electrónicamente por Dr.:', fontSize: 9, bold: true, italics: true },
                        { text: '\n', fontSize: 3 },
                        { text: `\n ${professional.businessName}`, fontSize: 14, bold: true },
                        {
                            text: `\n ${professional?.profesionGrado?.length ?
                                professional.profesionGrado
                                    .map((g: any) => `${g.profesion} MP ${g.numeroMatricula}`)
                                    .join('\n')
                                : (professional?.enrollment ? `MP ${professional.enrollment}\n` : '')}`,
                            bold: true, fontSize: 9
                        }
                    ]).alignment('center').margin([0, 25, 0, 0]).end
                ],
                alignment: 'center',
                width: '50%'
            }
        ]).alignment('center').width('100%').end);
    }

    private addPatientData(pdf: PdfMakeWrapper, data: { lastname: string; firstname: string; autopercibido: string; dni: string; dob?: Date | string; sex: string; obraSocial?: string; affiliateNumber?: string }) {
        pdf.add(new Txt([
            { text: 'PACIENTE' }
        ]).bold().end);
        pdf.add(new Txt('\n').end);
        if (data.autopercibido) {
            pdf.add(new Txt([
                { text: 'Apellido:   ' }, { text: data.lastname.toLocaleUpperCase(), bold: true }, { text: '           Nombre:   ' }, { text: data.firstname.toLocaleUpperCase() }
            ]).end);
            pdf.add(new Txt('\n').end);

            pdf.add(new Txt([
                { text: 'Identidad Autopercibida:   ' }, { text: data.autopercibido.toLocaleUpperCase(), bold: true }
            ]).end);
        } else {
            pdf.add(new Txt([
                { text: 'Apellido:   ' }, { text: data.lastname.toLocaleUpperCase(), bold: true }, { text: '           Nombre:   ' }, { text: data.firstname.toLocaleUpperCase(), bold: true }
            ]).end);
        }
        pdf.add(new Txt('\n').end);

        pdf.add(new Txt([
            { text: 'DNI:    ' },
            { text: data.dni, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        if (data.dob) {
            pdf.add(new Txt([
                { text: 'Fecha Nacimiento:    ' },
                { text: this.datePipe.transform(data.dob, 'dd/MM/yyyy'), bold: true }
            ]).end);
            pdf.add(new Txt('\n').end);
        }

        pdf.add(new Txt([
            { text: 'Sexo:    ' },
            { text: data.sex, bold: true }
        ]).end);
        pdf.add(new Txt('\n').end);

        pdf.add(new Txt([
            { text: 'Obra Social / Plan de salud :   ' }, { text: data.obraSocial || 'No informado', bold: true }
        ]).end);

        if (data.obraSocial) {
            pdf.add(new Txt('\n').end);

            pdf.add(new Txt([
                { text: 'Número de afiliado:   ' }, { text: data.affiliateNumber || 'No informado', bold: true }
            ]).end);
        }
        pdf.add(new Txt('\n').end);
    }

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
}
