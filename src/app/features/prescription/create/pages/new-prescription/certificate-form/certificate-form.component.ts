import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CertificateFormData } from '../../../models/prescription-draft';

@Component({
    selector: 'app-certificate-form',
    templateUrl: './certificate-form.component.html',
    styleUrls: ['./certificate-form.component.sass'],
    standalone: false
})
export class CertificateFormComponent implements OnInit {
    @Input() data: CertificateFormData | null = null;
    @Output() saved = new EventEmitter<CertificateFormData>();
    @Output() cancelled = new EventEmitter<void>();

    form: FormGroup;

    constructor(
        private fb: FormBuilder,
    ) {
        this.form = this.fb.group({
            certificate: ['', Validators.required],
            startDate: [new Date(), Validators.required],
            cantDias: [1, [Validators.required, Validators.min(1)]],
        });
    }

    ngOnInit(): void {
        if (this.data) {
            this.form.patchValue(this.data);
        }
    }

    save(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.saved.emit(this.form.value);
    }

    cancel(): void {
        this.cancelled.emit();
    }
}
