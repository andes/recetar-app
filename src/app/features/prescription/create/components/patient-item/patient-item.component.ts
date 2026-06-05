import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Patient } from '@interfaces/patients';
import { FrequentPatient } from '../../models/prescription-draft';
import { formatDni, formatName, toPascalCase, getAge } from '@utils/patient-format';

@Component({
    standalone: true,
    selector: 'app-patient-item',
    imports: [CommonModule, MatIconModule],
    template: `
        <div class="item-avatar initials" [class.female]="isFemale" [class.other]="isOther">
            <mat-icon>{{ avatarIcon }}</mat-icon>
        </div>
        <div class="item-info">
            <div class="item-name">
                {{ formatName(patient) }}
                <span class="item-autopercibido" *ngIf="patient.nombreAutopercibido">
                    &mdash; {{ toPascalCase(patient.nombreAutopercibido) }}
                </span>
            </div>
                <div class="item-detail">
                    <ng-container *ngIf="patient.dni">
                        DNI {{ formatDni(patient.dni) }}
                    </ng-container>
                    <ng-container *ngIf="patient.sex"> &middot; {{ patient.sex }}</ng-container>
                    <ng-container *ngIf="patient.fechaNac"> &middot; {{ getAge(patient.fechaNac) }} años</ng-container>
                </div>
        </div>
    `,
    styles: [`
        :host {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            min-width: 0;
        }

        .item-avatar {
            width: 36px;
            height: 36px;
            flex-shrink: 0;
        }

        .item-avatar.initials {
            background: var(--secondary-50);
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius-md);
        }

        .item-avatar.initials .mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
        }

        .item-avatar.initials.female {
            background: var(--highlight-light);
        }

        .item-avatar.initials.other {
            background: #d4f0f7;
        }

        .item-info {
            flex: 1;
            min-width: 0;
        }

        .item-name {
            font-size: 14px;
            font-weight: 500;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        .item-autopercibido {
            font-weight: 400;
            font-style: italic;
            color: var(--text-secondary);
        }

        .item-detail {
            font-size: 12px;
            color: var(--text-secondary);
            margin-top: 2px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
    `]
})
export class PatientItemComponent {
    @Input({ required: true }) patient!: Patient | FrequentPatient;

    get isFemale(): boolean {
        return /^f/i.test(this.patient.sex || '');
    }

    get isOther(): boolean {
        const s = this.patient.sex || '';
        return s !== '' && !/^[fm]/i.test(s);
    }

    get avatarIcon(): string {
        if (this.isFemale) { return 'female'; }
        if (this.isOther) { return 'transgender'; }
        return 'male';
    }

    formatDni = formatDni;
    formatName = formatName;
    toPascalCase = toPascalCase;
    getAge = getAge;
}
