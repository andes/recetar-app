import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
    standalone: true,
    selector: 'ui-date-field',
    imports: [CommonModule, ReactiveFormsModule, MatDatepickerModule, MatInputModule, MatIconModule, MatButtonModule],
    template: `
        <div class="ui-date-wrap">
            <input matInput class="ui-date-input"
                [matDatepicker]="picker"
                [formControl]="control"
                [placeholder]="placeholder"
                autocomplete="off">
            <mat-datepicker-toggle class="ui-date-toggle" matSuffix [for]="picker">
            </mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }

        .ui-date-wrap {
            position: relative;
            display: flex;
            align-items: center;
        }

        .ui-date-input {
            width: 100%;
            height: 38px;
            padding: 0 10px;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            font-family: inherit;
            font-size: .875rem;
            color: var(--text-primary);
            background: var(--bg-card);
            outline: none;
            transition: border-color .15s;
        }

        .ui-date-input:focus {
            border-color: var(--secondary);
            box-shadow: var(--focus-ring);
        }

        .ui-date-input::placeholder {
            color: var(--text-disabled);
        }

        .ui-date-toggle {
            position: absolute;
            right: 5px;
            color: var(--text-secondary);
        }

        .ui-date-toggle ::ng-deep .mat-mdc-icon-button {
            width: 28px;
            height: 28px;
            padding: 0;
        }

        .ui-date-toggle ::ng-deep .mat-datepicker-toggle-default-icon {
            width: 18px;
            height: 18px;
        }
    `]
})
export class UiDateFieldComponent {
    @Input({ required: true }) control!: FormControl;
    @Input() placeholder = 'DD/MM/AAAA';
}
