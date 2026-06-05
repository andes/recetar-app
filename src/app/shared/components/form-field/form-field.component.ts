import { Component, EventEmitter, Input, Output, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-form-field',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatIconModule
    ],
    templateUrl: './form-field.component.html',
    styleUrls: ['./form-field.component.sass'],
    host: {
        '[class.fullwidth]': 'fullwidth'
    }
})
export class FormFieldComponent {
    @Input({ required: true }) type!: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'password';
    @Input({ required: true }) label!: string;
    @Input({ required: true }) control!: AbstractControl;
    @Input() placeholder?: string;
    @Input() suffixIcon?: string;
    @Output() suffixClick = new EventEmitter<void>();
    @Input() options?: string[];
    @Input() maxlength?: number;
    @Input() inputmode?: string;
    @Input() min?: string;
    @Input() max?: string;
    @Input() errors?: Record<string, string>;
    @Input({ transform: booleanAttribute }) fullwidth = false;
    @Input({ transform: booleanAttribute }) submitted = false;
}
