import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Patient } from '@interfaces/patients';
import { UiBadgeChipComponent, UiEntityComponent, UiListItemComponent, UiPatientAvatarComponent } from '@shared/ui';
import { formatDni, formatName, getAge } from '@utils/patient-format';

@Component({
    selector: 'app-patient-list-item',
    templateUrl: './patient-list-item.component.html',
    styleUrls: ['./patient-list-item.component.sass'],
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        UiBadgeChipComponent,
        UiEntityComponent,
        UiListItemComponent,
        UiPatientAvatarComponent,
    ]
})
export class PatientListItemComponent {
    @Input({ required: true }) patient!: Patient;
    @Input() selected = false;
    @Output() select = new EventEmitter<void>();
    @Output() edit = new EventEmitter<void>();

    get displayName(): string {
        return formatName(this.patient, true) || 'Sin nombre';
    }

    get dniLabel(): string {
        return this.patient.dni ? `${formatDni(this.patient.dni)}` : 'Sin DNI';
    }

    get age(): number | null {
        return getAge(this.patient.fechaNac);
    }

    get statusKey(): string {
        return (this.patient.status || this.patient.estado || '').toLowerCase();
    }
}
