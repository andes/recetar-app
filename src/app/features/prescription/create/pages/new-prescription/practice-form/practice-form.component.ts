import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PracticeFormData } from '../../../models/prescription-draft';

@Component({
    selector: 'app-practice-form',
    templateUrl: './practice-form.component.html',
    styleUrls: ['./practice-form.component.sass'],
    standalone: false
})
export class PracticeFormComponent implements OnInit {
    @Input() data: PracticeFormData | null = null;
    @Output() saved = new EventEmitter<PracticeFormData>();
    @Output() cancelled = new EventEmitter<void>();

    form: FormGroup;

    constructor(
        private fb: FormBuilder,
    ) {
        this.form = this.fb.group({
            practice: ['', Validators.required],
            diagnostic: ['', Validators.required],
            indications: [''],
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
