import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Patient } from '@interfaces/patients';
import {
    UiAlertComponent,
    UiBadgeChipComponent,
    UiDetailPanelComponent,
    UiDetailSectionComponent,
    UiEntityComponent,
    UiPatientAvatarComponent,
} from '@shared/ui';
import { formatDni, formatName, getAge, toPascalCase } from '@utils/patient-format';
import { patientGenderLabel } from '../../models/patient-gender';

@Component({
    selector: 'app-patient-detail-panel',
    templateUrl: './patient-detail-panel.component.html',
    styleUrls: ['./patient-detail-panel.component.sass'],
    standalone: true,
    imports: [
        CommonModule,
        UiAlertComponent,
        UiBadgeChipComponent,
        UiDetailPanelComponent,
        UiDetailSectionComponent,
        UiEntityComponent,
        UiPatientAvatarComponent,
    ]
})
export class PatientDetailPanelComponent {
    @Input({ required: true }) patient!: Patient;

    get displayName(): string {
        return formatName(this.patient, true) || 'Sin nombre';
    }

    get realName(): string {
        return formatName(this.patient) || 'Sin nombre';
    }

    get nombreAutopercibido(): string {
        return toPascalCase(this.patient.nombreAutopercibido || '');
    }

    get generoAutopercibido(): string {
        return patientGenderLabel(this.patient.genero);
    }

    get dniHeaderLabel(): string {
        return this.patient.dni ? `DNI ${formatDni(this.patient.dni)}` : 'Sin DNI';
    }

    get age(): number | null {
        return getAge(this.patient.fechaNac);
    }

    get statusKey(): string {
        return (this.patient.status || this.patient.estado || '').toLowerCase();
    }

    get email(): string {
        return this.contactValue('email');
    }

    get celular(): string {
        return this.contactValue('celular');
    }

    get fijo(): string {
        return this.contactValue('fijo');
    }

    get direccion(): string {
        const d = this.patient.direcciones?.[0];
        if (!d) { return 'Sin dirección registrada'; }
        return [d.calle, d.barrio, d.localidad, d.provincia, d.pais].filter(Boolean).join(', ');
    }

    get codigoPostal(): string {
        return this.patient.direcciones?.[0]?.codigoPostal || '';
    }

    private contactValue(tipo: 'email' | 'celular' | 'fijo'): string {
        return this.patient.contactos?.find(c => c.tipo === tipo)?.valor || '';
    }
}
