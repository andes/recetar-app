import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Services
import { AndesPrescriptionsService } from '@services/andesPrescription.service';
import { InsurancesService } from '@services/insurance.service';
import { PrescriptionsService } from '@services/prescriptions.service';

// Interfaces
import { Insurances } from '@interfaces/insurances';
import { Patient } from '@interfaces/patients';

// Material
import { ThemePalette } from '@angular/material/core';
import { PatientsService } from '@services/patients.service';
import { MatDialog } from '@angular/material/dialog';
import { PrescriptionListComponent } from '../prescription-list/prescription-list.component';
import { DialogComponent } from '../dialog/dialog.component';
import { Prescriptions } from '@interfaces/prescriptions';


@Component({
    selector: 'app-pharmacists-form',
    templateUrl: './pharmacists-form.component.html',
    styleUrls: ['./pharmacists-form.component.sass'],

})
export class PharmacistsFormComponent implements OnInit {

    @ViewChild('picker1') picker1;
    @ViewChild(PrescriptionListComponent) prescriptionList: PrescriptionListComponent;

    title = 'Farmacia: ';
    prescriptionForm: FormGroup;
    displayedInsColumns: string[] = ['codigoPuco', 'financiador'];
    options: string[] = [];
    patient: Patient;
    insurances: Insurances;
    filteredOptions: Observable<string[]>;
    lastDniConsult: string;
    readonly spinnerColor: ThemePalette = 'primary';
    dniShowSpinner = false;
    dateShowSpinner = false;
    private lastDni: string;
    private lastSexo: string;
    private lastDate: string;
    dniMinLength = 6;
    // Controla si ya se presionó "Buscar" al menos una vez
    hasSearchedOnce = false;

    constructor(
        private fBuilder: FormBuilder,
        private apiPrescriptions: PrescriptionsService,
        private apiAndesPrescriptions: AndesPrescriptionsService,
        private patientsService: PatientsService,
        private apiInsurances: InsurancesService,
        public dialog: MatDialog,
    ) { }

    ngOnInit(): void {
        this.initFilterPrescriptionForm();
    }

    searchPrescriptions(): void {
        const values = this.prescriptionForm.value;
        const digestDate = typeof (values.dateFilter) !== 'undefined' && values.dateFilter != null && values.dateFilter !== '' ? values.dateFilter.format('YYYY-MM-DD') : '';

        if (typeof (values.patient_dni) !== 'undefined' && values.patient_dni.length >= this.dniMinLength) {
            this.dniShowSpinner = this.lastDni !== values.patient_dni;
            this.dateShowSpinner = this.lastDate !== digestDate;

            forkJoin([
                this.apiPrescriptions.getFromDniAndDate({ patient_dni: values.patient_dni, dateFilter: digestDate }).pipe(catchError(() => of(false))),
                this.apiAndesPrescriptions.getPrescriptionsFromAndes({ patient_dni: values.patient_dni, patient_sex: values.patient_sexo }).pipe(catchError(() => of(false))),
                this.patientsService.getPatientByDni(values.patient_dni)
            ]).subscribe(([prescriptionsSuccess, andesPrescriptionsSuccess, patientSuccess]) => {
                this.lastDni = values.patient_dni;
                this.lastDate = digestDate;
                this.dniShowSpinner = false;
                this.dateShowSpinner = false;

                if (!prescriptionsSuccess && !andesPrescriptionsSuccess) {
                    this.openDialog('noPrescriptions');
                }

                this.patient = patientSuccess[0];

                // Establecer el contexto del paciente en la lista, habilitar filtros y resetearlos
                if (this.prescriptionList) {
                    this.prescriptionList.setPatientContext(values.patient_dni, values.patient_sexo);
                    this.prescriptionList.resetFiltersToDefault();
                    this.hasSearchedOnce = true;
                    // Aplicar los filtros por defecto inmediatamente
                    this.prescriptionList.applyFilters();
                } else {
                    // Habilitar igual por si el ViewChild no está disponible aún
                    this.hasSearchedOnce = true;
                }
            });
        }
    }

    initFilterPrescriptionForm() {
        this.prescriptionForm = this.fBuilder.group({
            patient_dni: ['', [
                Validators.required,
                Validators.minLength(this.dniMinLength)
            ]],
            patient_sexo: [''],
            dateFilter: ['', [
            ]],
        });
    }

    // clear dapicker input
    cleanDateEvent() {
        this.dateFilter.setValue('');
    }

    // Show a dialog
    openDialog(aDialogType: string, aPrescription?: Prescriptions, aText?: string): void {
        const dialogRef = this.dialog.open(DialogComponent, {
            width: '400px',
            data: { dialogType: aDialogType, prescription: aPrescription, text: aText }
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('The dialog was closed');
        });
    }


    get patient_dni(): AbstractControl {
        return this.prescriptionForm.get('patient_dni');
    }

    get patient_sexo(): AbstractControl {
        return this.prescriptionForm.get('patient_sexo');
    }

    get dateFilter(): AbstractControl {
        return this.prescriptionForm.get('dateFilter');
    }
}


