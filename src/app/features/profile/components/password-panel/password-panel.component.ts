import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { getHttpErrorMessage } from '@shared/utils/http-error.util';
import { AuthService } from '@auth/services/auth.service';

@Component({
    selector: 'app-password-panel',
    templateUrl: './password-panel.component.html',
    styleUrls: ['./password-panel.component.sass'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        FormFieldComponent,
    ]
})
export class PasswordPanelComponent implements OnInit, OnDestroy {
    passwordForm: FormGroup;
    isSaving = false;
    submitted = false;
    hideCurrent = true;
    hideNew = true;
    hideConfirm = true;

    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private snackBar: MatSnackBar,
        private authService: AuthService,
    ) {
        this.passwordForm = this.fb.group({
            oldPassword: ['', [Validators.required]],
            newPassword: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });
    }

    ngOnInit(): void { }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private passwordMatchValidator = (formGroup: FormGroup): ValidationErrors | null => {
        const newPassword = formGroup.get('newPassword');
        const confirmPassword = formGroup.get('confirmPassword');

        if (!newPassword || !confirmPassword) {
            return null;
        }

        if (newPassword.value !== confirmPassword.value) {
            confirmPassword.setErrors({ passwordMismatch: true });
            return { passwordMismatch: true };
        }

        if (confirmPassword.errors && confirmPassword.errors['passwordMismatch']) {
            const remainingErrors = { ...confirmPassword.errors };
            delete remainingErrors['passwordMismatch'];
            confirmPassword.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null);
        }

        return null;
    };

    onSubmit(): void {
        this.submitted = true;

        if (!this.passwordForm.valid || this.isSaving) {
            return;
        }

        this.isSaving = true;
        const { oldPassword, newPassword } = this.passwordForm.value;

        this.authService.resetPassword({ oldPassword, newPassword })
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isSaving = false)
            )
            .subscribe({
                next: (res) => {
                    const message = res.message || res.mensaje || 'Contraseña cambiada exitosamente';
                    this.snackBar.open(message, 'Cerrar', { duration: 5000 });
                    this.passwordForm.reset();
                    this.submitted = false;
                },
                error: (error) => {
                    const msg = getHttpErrorMessage(error, 'Error al cambiar contraseña');
                    this.snackBar.open(msg, 'Cerrar', {
                        duration: 5000,
                        panelClass: ['error-snackbar']
                    });
                }
            });
    }

    cancel(): void {
        this.passwordForm.reset();
        this.submitted = false;
    }

    get oldPassword(): AbstractControl | null { return this.passwordForm.get('oldPassword'); }
    get newPassword(): AbstractControl | null { return this.passwordForm.get('newPassword'); }
    get confirmPassword(): AbstractControl | null { return this.passwordForm.get('confirmPassword'); }
}
