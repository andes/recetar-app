import { Component, Inject, HostBinding, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { dialogFade } from '@animations/animations.template';
import { WebAuthnService } from '../../services/webauthn.service';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';

@Component({
    selector: 'app-security-pin-dialog',
    templateUrl: './security-pin-dialog.component.html',
    styleUrls: ['./security-pin-dialog.component.sass'],
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        FormFieldComponent
    ],
    animations: [dialogFade]
})
export class SecurityPinDialogComponent implements OnInit {
    @HostBinding('@dialogFade') public dialogFade = true;

    pinForm: FormGroup;
    errorMessage: string | null = null;
    isBiometricAvailable = false;
    isAuthenticatingBiometric = false;
    showBiometricOption = false;
    submitted = false;

    pinErrors: Record<string, string> = {
        required: 'El PIN es obligatorio',
        pattern: 'El PIN debe tener 4 dígitos'
    };

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<SecurityPinDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private webAuthnService: WebAuthnService
    ) {
        this.pinForm = this.fb.group({
            pin: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]]
        });
    }

    ngOnInit(): void {
        this.checkBiometricAvailability();
    }

    private checkBiometricAvailability(): void {
        if (!this.webAuthnService.isSupported()) {
            return;
        }

        this.webAuthnService.hasCredentials().subscribe(hasCreds => {
            if (hasCreds) {
                this.isBiometricAvailable = true;
                this.showBiometricOption = true;
                this.tryBiometricAuth();
            }
        });
    }

    private tryBiometricAuth(): void {
        this.isAuthenticatingBiometric = true;
        this.errorMessage = null;

        this.webAuthnService.authenticate().subscribe({
            next: () => {
                this.isAuthenticatingBiometric = false;
                this.dialogRef.close('biometric');
            },
            error: (error) => {
                this.isAuthenticatingBiometric = false;
                if (error.name === 'NotAllowedError') {
                    this.errorMessage = 'Autenticación biométrica cancelada. Usá tu PIN.';
                } else {
                    this.errorMessage = 'Error en autenticación biométrica. Usá tu PIN.';
                }
            }
        });
    }

    onSubmit(): void {
        this.submitted = true;
        if (this.pinForm.valid) {
            this.dialogRef.close(this.pinForm.value.pin);
        }
    }

    onCancel(): void {
        this.dialogRef.close(null);
    }

    setError(message: string): void {
        this.errorMessage = message;
    }
}

export interface DialogData {
    title?: string;
    message?: string;
}
