import { Component, OnInit } from '@angular/core';
import { PdfMakeWrapper, Txt, Canvas, Line, Img, Columns } from 'pdfmake-wrapper';
import { DatePipe } from '@angular/common';
import AndesPrescriptions from '@interfaces/andesPrescriptions';

@Component({
  selector: 'app-prescription-printer',
  templateUrl: './andes-prescription-printer.component.html',
  styleUrls: ['./andes-prescription-printer.component.sass']
})
export class AndesPrescriptionPrinterComponent implements OnInit {

  constructor(
    private datePipe: DatePipe
  ){}

  ngOnInit(): void {
  }

  // Print a prescription as PDF
  async print(prescription: AndesPrescriptions){
    const pdf: PdfMakeWrapper = new PdfMakeWrapper();
    pdf.info({
      title: "Receta digital "+prescription.profesional.nombre+", "+prescription.profesional.apellido,
      author: 'Andes'
    });
    // Header
    pdf.add(await new Img('assets/img/LogoPdf.jpg').fit([60, 60]).build());
    pdf.add(new Txt('RECETA DIGITAL').bold().alignment('center').end);
    pdf.add(pdf.ln(2));
    pdf.add(new Txt(""+this.datePipe.transform(prescription.fechaPrestacion, 'dd/MM/yyyy')).alignment('right').end);
    // Professional
    pdf.add(new Columns([ new Txt("Profesional").bold().end, new Txt("Matrícula").bold().end ]).end);
    pdf.add(new Columns([ new Txt(""+prescription.profesional.nombre).end, new Txt(""+prescription.profesional.matricula).end ]).end);
    pdf.add(pdf.ln(2));
    // Patient
    pdf.add(new Columns([ new Txt("Paciente").bold().end, new Txt("DNI").bold().end ]).end);
    pdf.add(new Columns([ new Txt(""+prescription.paciente.apellido.toUpperCase()+", "+prescription.paciente.nombre.toUpperCase()).end, new Txt(""+prescription.paciente.documento) .end ]).end);
    pdf.add(new Canvas([ new Line(10, [500, 10]).end ]).end);
    // Supplies
    pdf.add(pdf.ln(1));
    prescription.dispensa.forEach(supply => {
      supply.medicamento.forEach(medicamento => {
        pdf.add(new Txt(""+medicamento.presentacion+", cantidad de envases: "+medicamento.cantidadEnvases).end);
        pdf.add(new Txt("").end);
      });
    });
    pdf.add(new Canvas([ new Line(10, [500, 10]).end]).end);
    if(prescription.diagnostico){
      pdf.add(pdf.ln(1));
      pdf.add(new Txt("Diagnóstico").bold().end);
      pdf.add(new Txt(""+prescription.diagnostico.term).end);
    }
    if(prescription.dispensa){
      pdf.add(pdf.ln(1));
      pdf.add(new Txt("Observaciones").bold().end);
      prescription.dispensa.forEach(supply => {
        supply.medicamento.forEach(medicamento => {
          pdf.add(new Txt(""+medicamento.observacion).end);
        });
      });
    }
    pdf.add(pdf.ln(2));

    pdf.footer(new Txt("Esta receta se registró en andes.gob.ar").italics().alignment('center').end);

    pdf.create().open();
  }

}
