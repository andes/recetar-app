import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { SidebarItem } from '@shared/components/layout/sidebar/sidebar.component';
import { SidebarService } from '@shared/services/sidebar.service';
import { getHttpErrorMessage } from '@shared/utils/http-error.util';
import { SecurityPinService } from '../../services/security-pin.service';

@Component({
    selector: 'app-security-settings',
    templateUrl: './security-settings.component.html',
    styleUrls: ['./security-settings.component.sass'],
    standalone: false
})
export class SecuritySettingsComponent implements OnInit, OnDestroy {
    sidebarItems: SidebarItem[] = [];

    hasPinActive = false;
    isLoading = false;
    isSaving = false;

    setupForm: FormGroup;
    changeForm: FormGroup;
    disableForm: FormGroup;

    showSetupForm = false;
    showChangeForm = false;
    showDisableForm = false;

    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private snackBar: MatSnackBar,
        private sidebarService: SidebarService,
        private securityPinService: SecurityPinService
    ) {
        this.setupForm = this.fb.group({
            currentPassword: ['', [Validators.required]],
            newPin: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
            confirmPin: ['', [Validators.required]]
        }, { validators: this.pinMatchValidator('newPin', 'confirmPin') });

        this.changeForm = this.fb.group({
            currentPin: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
            newPin: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
            confirmPin: ['', [Validators.required]]
        }, { validators: this.pinMatchValidator('newPin', 'confirmPin') });

        this.disableForm = this.fb.group({
            password: ['', [Validators.required]]
        });
    }

    ngOnInit(): void {
        this.sidebarItems = this.sidebarService.getItems();
        this.loadPinStatus();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadPinStatus(): void {
        this.isLoading = true;
        this.securityPinService.getStatus()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isLoading = false)
            )
            .subscribe({
                next: (status) => {
                    this.hasPinActive = status.isActive;
                },
                error: (error) => {
                    const msg = getHttpErrorMessage(error, 'Error al cargar el estado del PIN');
                    this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
                }
            });
    }

    private pinMatchValidator(pinField: string, confirmField: string) {
        return (formGroup: FormGroup): ValidationErrors | null => {
            const pin = formGroup.get(pinField);
            const confirm = formGroup.get(confirmField);

            if (!pin || !confirm) {
                return null;
            }

            if (pin.value !== confirm.value) {
                confirm.setErrors({ pinMismatch: true });
                return { pinMismatch: true };
            }

            if (confirm.errors && confirm.errors['pinMismatch']) {
                const remainingErrors = { ...confirm.errors };
                delete remainingErrors['pinMismatch'];
                confirm.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null);
            }

            return null;
        };
    }

    toggleSetupForm(): void {
        this.showSetupForm = !this.showSetupForm;
        this.showChangeForm = false;
        this.showDisableForm = false;
        if (this.showSetupForm) {
            this.setupForm.reset();
        }
    }

    toggleChangeForm(): void {
        this.showChangeForm = !this.showChangeForm;
        this.showSetupForm = false;
        this.showDisableForm = false;
        if (this.showChangeForm) {
            this.changeForm.reset();
        }
    }

    toggleDisableForm(): void {
        this.showDisableForm = !this.showDisableForm;
        this.showSetupForm = false;
        this.showChangeForm = false;
        if (this.showDisableForm) {
            this.disableForm.reset();
        }
    }

    onSubmitSetup(): void {
        if (this.setupForm.invalid || this.isSaving) {
            return;
        }

        this.isSaving = true;
        const formValue = this.setupForm.value;

        this.securityPinService.setupPin({
            currentPassword: formValue.currentPassword,
            pin: formValue.newPin
        }).pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isSaving = false)
        ).subscribe({
            next: () => {
                this.snackBar.open('PIN de seguridad activado', 'Cerrar', { duration: 5000 });
                this.hasPinActive = true;
                this.showSetupForm = false;
                this.setupForm.reset();
            },
            error: (error) => {
                const msg = getHttpErrorMessage(error, 'Error al activar el PIN');
                this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
            }
        });
    }

    onSubmitChange(): void {
        if (this.changeForm.invalid || this.isSaving) {
            return;
        }

        this.isSaving = true;
        const formValue = this.changeForm.value;

        this.securityPinService.changePin({
            currentPin: formValue.currentPin,
            newPin: formValue.newPin
        }).pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isSaving = false)
        ).subscribe({
            next: () => {
                this.snackBar.open('PIN de seguridad actualizado', 'Cerrar', { duration: 5000 });
                this.showChangeForm = false;
                this.changeForm.reset();
            },
            error: (error) => {
                const msg = getHttpErrorMessage(error, 'Error al cambiar el PIN');
                this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
            }
        });
    }

    onSubmitDisable(): void {
        if (this.disableForm.invalid || this.isSaving) {
            return;
        }

        this.isSaving = true;
        const formValue = this.disableForm.value;

        this.securityPinService.disablePin({
            password: formValue.password
        }).pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isSaving = false)
        ).subscribe({
            next: () => {
                this.snackBar.open('PIN de seguridad desactivado', 'Cerrar', { duration: 5000 });
                this.hasPinActive = false;
                this.showDisableForm = false;
                this.disableForm.reset();
            },
            error: (error) => {
                const msg = getHttpErrorMessage(error, 'Error al desactivar el PIN');
                this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
            }
        });
    }

    cancelForm(): void {
        this.showSetupForm = false;
        this.showChangeForm = false;
        this.showDisableForm = false;
    }

    get setupCurrentPassword(): AbstractControl | null { return this.setupForm.get('currentPassword'); }
    get setupNewPin(): AbstractControl | null { return this.setupForm.get('newPin'); }
    get setupConfirmPin(): AbstractControl | null { return this.setupForm.get('confirmPin'); }

    get changeCurrentPin(): AbstractControl | null { return this.changeForm.get('currentPin'); }
    get changeNewPin(): AbstractControl | null { return this.changeForm.get('newPin'); }
    get changeConfirmPin(): AbstractControl | null { return this.changeForm.get('confirmPin'); }

    get disablePassword(): AbstractControl | null { return this.disableForm.get('password'); }
}
