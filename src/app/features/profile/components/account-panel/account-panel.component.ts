import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { UiAlertComponent } from '@shared/ui';
import { NotificationService } from '@shared/services/notification.service';
import { getHttpErrorMessage } from '@shared/utils/http-error.util';
import { isValidCuitCuil, normalizeTaxId } from '@shared/utils/tax-id.util';
import { cuilValidator } from '@utils/custome-validators/cuil.validator';
import { User } from '@interfaces/users';
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
        FormFieldComponent,
        UiAlertComponent,
    ]
})
export class AccountPanelComponent implements OnInit, OnDestroy {
    @Output() saved = new EventEmitter<void>();
    @Input() isProfessional = false;

    accountForm: FormGroup;
    isLoading = false;
    isSaving = false;
    isPharmacist = false;
    submitted = false;
    updateError: string | null = null;
    cuilInvalido = false;

    private initialValues = { email: '', businessName: '', username: '', cuil: '' };
    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private notification: NotificationService,
        private profileService: ProfileService,
    ) {
        this.accountForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            businessName: ['', [Validators.required, Validators.minLength(3)]],
            username: ['', [Validators.required, Validators.minLength(3)]],
            cuil: ['', [cuilValidator]]
        });
    }

    ngOnInit(): void {
        this.isPharmacist = this.profileService.isPharmacist();
        this.loadUser();
        this.cuil?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
            const digits = (value || '').replace(/\D/g, '').slice(0, 11);
            if (digits !== value) {
                this.cuil?.setValue(digits, { emitEvent: false });
            }
            if (isValidCuitCuil(digits)) {
                this.cuilInvalido = false;
            }
        });
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
                    this.applyUser(user);
                },
                error: (error) => {
                    const msg = getHttpErrorMessage(error, 'Error al cargar los datos del usuario');
                    this.updateError = msg;
                    this.notification.error(msg);
                }
            });
    }

    private applyUser(user: User): void {
        const storedCuil = this.isProfessional ? normalizeTaxId(user.cuil) : '';
        this.cuilInvalido = this.isProfessional && !!storedCuil && !isValidCuitCuil(storedCuil);
        this.initialValues = {
            email: user.email || '',
            businessName: user.businessName || '',
            username: user.username || '',
            cuil: this.cuilInvalido ? '' : storedCuil
        };
        this.accountForm.patchValue(this.initialValues);
        this.accountForm.markAsPristine();
        this.submitted = false;
    }

    onSubmit(): void {
        this.submitted = true;

        if (this.accountForm.invalid) {
            this.accountForm.markAllAsTouched();
            this.notification.warning('Revisá los datos marcados en el formulario');
            return;
        }

        if (this.isSaving) {
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
                        this.notification.success('Se ha enviado un correo para confirmar los cambios');
                        this.saved.emit();
                    },
                    error: (error) => {
                        const msg = getHttpErrorMessage(error, 'Error al actualizar el perfil');
                        this.updateError = msg;
                        this.notification.error(msg);
                    }
                });
        } else {
            const payload: { email: string; businessName: string; username: string; cuil?: string } = {
                email: formValue.email,
                businessName: formValue.businessName,
                username: formValue.username,
            };
            if (this.isProfessional) {
                const cuil = normalizeTaxId(formValue.cuil);
                if (cuil) {
                    payload.cuil = cuil;
                }
            }
            this.profileService.updateProfile(payload)
                .pipe(
                    takeUntil(this.destroy$),
                    finalize(() => this.isSaving = false)
                )
                .subscribe({
                    next: (user) => {
                        this.notification.success('Datos de cuenta actualizados');
                        this.applyUser(user);
                        this.saved.emit();
                    },
                    error: (error) => {
                        const msg = getHttpErrorMessage(error, 'Error al actualizar el perfil');
                        this.updateError = msg;
                        this.notification.error(msg);
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
    get cuil(): AbstractControl | null { return this.accountForm.get('cuil'); }
}
