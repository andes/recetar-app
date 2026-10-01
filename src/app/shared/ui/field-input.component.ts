import { Component, Input } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
    standalone: true,
    selector: 'ui-field-input',
    imports: [ReactiveFormsModule],
    template: `
        @if (type === 'select') {
            <select class="ui-field" [formControl]="control">
                <ng-content></ng-content>
            </select>
        } @else {
            <input class="ui-field" [type]="type" [formControl]="control" [placeholder]="placeholder" />
        }
    `,
    styles: [`
        :host {
            display: block;
        }

        .ui-field {
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

        .ui-field:focus {
            border-color: var(--secondary);
            box-shadow: var(--focus-ring);
        }

        .ui-field::placeholder {
            color: var(--text-disabled);
        }
    `]
})
export class UiFieldInputComponent {
    @Input({ required: true }) control!: FormControl;
    @Input() type: 'text' | 'number' | 'select' = 'text';
    @Input() placeholder = '';
}
