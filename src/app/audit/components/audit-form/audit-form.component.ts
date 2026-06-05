import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl, Validators } from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { switchMap, take, takeUntil } from 'rxjs/operators';

// Services
import { PrescriptionsService } from '@services/prescriptions.service';
import { InsurancesService } from '@services/insurance.service';

// Interfaces
import { Patient } from '@interfaces/patients';
import { Prescriptions } from '@interfaces/prescriptions';

// Material
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogComponent } from '@audit/components/dialog/dialog.component';
import { ThemePalette } from '@angular/material/core';


@Component({
    selector: 'app-audit-form',
    templateUrl: './audit-form.component.html',
    styleUrls: ['./audit-form.component.sass'],
    standalone: false
})
export class AuditFormComponent implements OnInit, OnDestroy {

    @ViewChild('picker1') picker1;

    title = 'Auditor: ';
    prescriptionForm: FormGroup;
    options: string[] = [];
    patient: Patient;
    filteredOptions: Observable<string[]>;
    lastCuitConsult: string;
    readonly spinnerColor: ThemePalette = 'primary';
    cuitShowSpinner = false;
    private lastCuit: string;
    private destroy$ = new Subject<void>();

    constructor(
        private fBuilder: FormBuilder,
        private apiPrescriptions: PrescriptionsService,
        private apiInsurances: InsurancesService,
        public dialog: MatDialog,
        private _snackBar: MatSnackBar,
    ) { }

    ngOnInit(): void {
        this.initFilterPrescriptionForm();

        this.prescriptionForm.valueChanges.pipe(
            takeUntil(this.destroy$),
            switchMap(values => {
                if (typeof (values.pharmacy_cuit) !== 'undefined' && values.pharmacy_cuit >= 10) {
                    this.cuitShowSpinner = this.lastCuit !== values.pharmacy_cuit;
                    return this.apiPrescriptions.getPrescriptions({ dispensedBy: values.pharmacy_cuit });
                }
                return of(null);
            })
        ).subscribe(success => {
            if (success === null) {
                return;
            }
            if (success) {
                this.lastCuit = this.prescriptionForm.value.pharmacy_cuit;
                this.cuitShowSpinner = false;
            } else {
                this._snackBar.open('No se encuentra una farmacia con ese CUIT', 'cerrar', { duration: 3000 });
                this.cuitShowSpinner = false;
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    initFilterPrescriptionForm() {
        this.prescriptionForm = this.fBuilder.group({
            pharmacy_cuit: ['', [
                Validators.required,
                Validators.minLength(10)
            ]],
        });
    }

    // Show a dialog
    openDialog(aDialogType: string, aPrescription?: Prescriptions, aText?: string): void {
        const dialogRef = this.dialog.open(DialogComponent, {
            width: '400px',
            data: { dialogType: aDialogType, prescription: aPrescription, text: aText }
        });

        dialogRef.afterClosed().pipe(take(1)).subscribe();
    }


    get pharmacy_cuit(): AbstractControl {
        return this.prescriptionForm.get('pharmacy_cuit');
    }

}
