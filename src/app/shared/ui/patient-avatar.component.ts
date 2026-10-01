import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    standalone: true,
    selector: 'ui-patient-avatar',
    imports: [MatIconModule],
    template: `
        <div class="patient-avatar" [class.female]="isFemale" [class.other]="isOther">
            <mat-icon>{{ icon }}</mat-icon>
        </div>
    `,
    styles: [`
        :host {
            display: inline-flex;
            flex-shrink: 0;
        }

        .patient-avatar {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: var(--radius-md);
            background: var(--highlight-5-bg);
            color: var(--highlight-5);
        }

        .patient-avatar.female {
            background: var(--highlight-2-bg);
            color: var(--highlight-2);
        }

        .patient-avatar.other {
            background: var(--highlight-3-bg);
            color: var(--highlight-3);
        }

        .patient-avatar mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
        }
    `]
})
export class UiPatientAvatarComponent {
    @Input() sex?: string;
    @Input() genero?: string;

    get hasGenero(): boolean {
        return !!this.generoKey;
    }

    get sexKey(): 'female' | 'male' | 'other' {
        const sex = this.normalizeSex(this.sex);
        if (sex.startsWith('f')) { return 'female'; }
        if (sex.startsWith('m')) { return 'male'; }
        return 'other';
    }

    get hasAutopercibido(): boolean {
        return this.hasGenero && this.generoKey !== this.defaultGenero;
    }

    get isFemale(): boolean {
        return !this.hasAutopercibido && this.sexKey === 'female';
    }

    get isOther(): boolean {
        return this.hasAutopercibido || this.sexKey === 'other';
    }

    get icon(): string {
        if (this.isFemale) { return 'female'; }
        if (this.isOther) { return 'transgender'; }
        return 'male';
    }

    private get generoKey(): string {
        return this.normalize(this.genero);
    }

    private get defaultGenero(): string {
        if (this.sexKey === 'female') { return 'mujer'; }
        if (this.sexKey === 'male') { return 'varon'; }
        return '';
    }

    private normalizeSex(value?: string): string {
        return (value || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    private normalize(value?: string): string {
        const normalized = (value || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        if (normalized === 'femenino') { return 'mujer'; }
        if (normalized === 'masculino') { return 'varon'; }
        if (normalized === 'ninguno' || normalized === 'ninguna' || normalized === 'none') { return ''; }
        return normalized;
    }
}
