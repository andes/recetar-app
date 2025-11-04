import { Component, Inject, OnInit, } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Prescriptions } from '@interfaces/prescriptions';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { InteractionService } from '@professionals/interaction.service';
import { Certificate } from '@interfaces/certificate';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';

@Component({
    selector: 'app-professional-dialog',
    templateUrl: './professional-dialog.component.html',
    styleUrls: ['./professional-dialog.component.sass'],
    animations: [
        fadeInOnEnterAnimation(),
        fadeOutOnLeaveAnimation()
    ],
})
export class ProfessionalDialogComponent implements OnInit {
    prescription: Prescriptions;
    constructor(
        public dialogRef: MatDialogRef<ProfessionalDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private _interactionService: InteractionService
    ) { }

    ngOnInit(): void {
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    deletePrescription(prescription: Prescriptions | AndesPrescriptions) {
        // Solo procesar si es una prescripción local
        if (!this.isAndesPrescription(prescription)) {
            const localPrescription = prescription as Prescriptions;
            this._interactionService.deletePrescription(localPrescription).subscribe(
                success => {
                    if (success) {
                        // Emitir evento para actualizar listas
                        this._interactionService.emitPrescriptionDeleted(localPrescription);
                        this.dialogRef.close('deleted');
                    } else {
                        this.dialogRef.close('error');
                    }
                },
                error => {
                    this.dialogRef.close('error-dispensed');
                }
            );
        }
    }

    confirmSuspendAndes() {
        this.dialogRef.close('suspend_andes');
    }

    isAndesPrescription(item: any): item is AndesPrescriptions {
        return 'idAndes' in item || 'paciente' in item;
    }

    getPatientName(): string {
        if (this.isAndesPrescription(this.data.item)) {
            const andesPrescription = this.data.item as AndesPrescriptions;
            return `${andesPrescription.paciente?.apellido}, ${andesPrescription.paciente?.nombre}`;
        } else {
            const localPrescription = this.data.item as Prescriptions;
            return `${localPrescription.patient?.lastName}, ${localPrescription.patient?.firstName}`;
        }
    }
}

export interface DialogData {
    item: Prescriptions | AndesPrescriptions;
    dialogType: string;
    text: string;
}
