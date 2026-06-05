import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { UiAlertComponent } from '@shared/ui';
import { getHttpErrorMessage } from '@shared/utils/http-error.util';
import { ProfileService } from '../../services/profile.service';

@Component({
    selector: 'app-account-panel',
    templateUrl: './account-panel.component.html',
    styleUrls: ['./account-panel.component.sass'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        FormFieldComponent,
        UiAlertComponent,
    ]
})
export class AccountPanelComponent implements OnInit, OnDestroy {
    @Output() saved = new EventEmitter<void>();

    accountForm: FormGroup;
    isLoading = false;
    isSaving = false;
    isPharmacist = false;
    submitted = false;
    updateError: string | null = null;

    private initialValues = { email: '', businessName: '', username: '' };
    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private snackBar: MatSnackBar,
        private profileService: ProfileService,
    ) {
        this.accountForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            businessName: ['', [Validators.required, Validators.minLength(3)]],
            username: ['', [Validators.required, Validators.minLength(3)]]
        });
    }

    ngOnInit(): void {
        this.isPharmacist = this.profileService.isPharmacist();
        this.loadUser();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get nameLabel(): string {
        return this.isPharmacist ? 'Nombre de fantasía' : 'Nombre';
    }

    private loadUser(): void {
        this.isLoading = true;
        this.profileService.getCurrentUser()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isLoading = false)
            )
            .subscribe({
                next: (user) => {
                    this.initialValues = {
                        email: user.email || '',
                        businessName: user.businessName || '',
                        username: user.username || ''
                    };
                    this.accountForm.patchValue(this.initialValues);
                },
                error: (error) => {
                    const msg = getHttpErrorMessage(error, 'Error al cargar los datos del usuario');
                    this.updateError = msg;
                    this.snackBar.open(msg, 'Cerrar', {
                        duration: 5000,
                        panelClass: ['error-snackbar']
                    });
                }
            });
    }

    onSubmit(): void {
        this.submitted = true;

        if (!this.accountForm.valid || this.isSaving) {
            return;
        }

        this.isSaving = true;
        this.updateError = null;

        const formValue = this.accountForm.value;

        if (this.isPharmacist) {
            this.profileService.requestProfileUpdate({ email: formValue.email, username: formValue.username })
                .pipe(
                    takeUntil(this.destroy$),
                    finalize(() => this.isSaving = false)
                )
                .subscribe({
                    next: () => {
                        this.snackBar.open('Se ha enviado un correo para confirmar los cambios', 'Cerrar', { duration: 5000 });
                        this.saved.emit();
                    },
                    error: (error) => {
                        const msg = getHttpErrorMessage(error, 'Error al actualizar el perfil');
                        this.updateError = msg;
                        this.snackBar.open(msg, 'Cerrar', {
                            duration: 5000,
                            panelClass: ['error-snackbar']
                        });
                    }
                });
        } else {
            this.profileService.updateProfile({
                email: formValue.email,
                businessName: formValue.businessName,
                username: formValue.username
            })
                .pipe(
                    takeUntil(this.destroy$),
                    finalize(() => this.isSaving = false)
                )
                .subscribe({
                    next: () => {
                        this.snackBar.open('Datos de cuenta actualizados', 'Cerrar', { duration: 5000 });
                        this.saved.emit();
                    },
                    error: (error) => {
                        const msg = getHttpErrorMessage(error, 'Error al actualizar el perfil');
                        this.updateError = msg;
                        this.snackBar.open(msg, 'Cerrar', {
                            duration: 5000,
                            panelClass: ['error-snackbar']
                        });
                    }
                });
        }
    }

    cancel(): void {
        this.accountForm.patchValue(this.initialValues);
        this.accountForm.markAsPristine();
        this.submitted = false;
        this.updateError = null;
    }

    get email(): AbstractControl | null { return this.accountForm.get('email'); }
    get businessName(): AbstractControl | null { return this.accountForm.get('businessName'); }
    get username(): AbstractControl | null { return this.accountForm.get('username'); }
}
