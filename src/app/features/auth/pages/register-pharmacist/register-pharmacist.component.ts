import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import moment from 'moment';
import { AuthService } from '@auth/services/auth.service';
import { PharmacistLookupResult, PharmacistsService } from '@services/pharmacists.service';
import { CanvasComponent } from '@shared/components/layout/canvas/canvas.component';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { UiAlertComponent } from '@shared/ui';
import { NgxTurnstileModule } from '@shared/ngx-turnstile/ngx-turnstile.module';
import { NgxTurnstileFormsModule } from '@shared/ngx-turnstile/ngx-turnstile-forms.module';
import { NotificationService } from '@shared/services/notification.service';
import { getHttpErrorMessage } from '@shared/utils/http-error.util';
import { cuilValidator } from '@utils/custome-validators/cuil.validator';
import { toRegisterPharmacistPayload, RegisterPharmacistInput } from '@models/dto/register.dto';

@Component({
    selector: 'app-register-pharmacist',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        CanvasComponent,
        FormFieldComponent,
        UiAlertComponent,
        NgxTurnstileModule,
        NgxTurnstileFormsModule,
    ],
    templateUrl: './register-pharmacist.component.html',
    styleUrls: ['./register-pharmacist.component.sass'],
})
export class RegisterPharmacistComponent implements OnInit, OnDestroy {
    readonly siteKey = '0x4AAAAAAAhL2mZAyxFj63Dw';

    readonly fieldErrors: Record<string, Record<string, string>> = {
        cuil: { required: 'El CUIT es obligatorio', invalidFormat: 'El CUIT debe tener 11 dígitos', invalidCuil: 'El CUIT no es válido' },
        disposicionHabilitacion: { required: 'El número de disposición es obligatorio' },
        enrollment: { required: 'La matrícula del director técnico es obligatoria' },
        vencimientoHabilitacion: { required: 'La fecha de vencimiento es obligatoria' },
        email: { required: 'El email es obligatorio', email: 'El email no es válido' },
        password: { required: 'La contraseña es obligatoria', pattern: 'Mínimo 8 caracteres, con mayúscula, minúscula y número' },
    };

    form: FormGroup;
    submitted = false;
    isSubmitting = false;
    serverError: string | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private pharmacistsService: PharmacistsService,
        private notification: NotificationService,
        private router: Router,
    ) {
        this.form = this.fb.group({
            cuil: ['', [Validators.required, cuilValidator]],
            disposicionHabilitacion: ['', [Validators.required]],
            enrollment: ['', [Validators.required]],
            vencimientoHabilitacion: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.pattern(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?!.* ).{8,}$/)]],
            captcha: ['', [Validators.required]],
        });
    }

    ngOnInit(): void {
        this.setupCuilSanitizer();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get cuil(): AbstractControl { return this.form.get('cuil')!; }
    get disposicionHabilitacion(): AbstractControl { return this.form.get('disposicionHabilitacion')!; }
    get enrollment(): AbstractControl { return this.form.get('enrollment')!; }
    get vencimientoHabilitacion(): AbstractControl { return this.form.get('vencimientoHabilitacion')!; }
    get email(): AbstractControl { return this.form.get('email')!; }
    get password(): AbstractControl { return this.form.get('password')!; }
    get captcha(): AbstractControl { return this.form.get('captcha')!; }

    onSubmit(): void {
        this.submitted = true;
        this.serverError = null;
        if (this.form.invalid) {
            return;
        }
        const value = this.form.getRawValue() as RegisterPharmacistInput;
        this.isSubmitting = true;
        this.pharmacistsService.getPharmacistByCuit({
            cuil: value.cuil,
            disposicionHabilitacion: value.disposicionHabilitacion,
        }).pipe(takeUntil(this.destroy$)).subscribe({
            next: (results) => {
                const pharmacy = results?.[0];
                if (!pharmacy) {
                    this.isSubmitting = false;
                    this.notification.error('La farmacia no se encuentra registrada. Contactate con fiscalización para corroborar tus datos.');
                    return;
                }
                const validationError = this.validatePharmacy(pharmacy, value);
                if (validationError) {
                    this.isSubmitting = false;
                    this.notification.error(validationError);
                    return;
                }
                this.register(value);
            },
            error: (error) => {
                this.isSubmitting = false;
                this.serverError = getHttpErrorMessage(error, 'No se pudo validar la farmacia');
                this.notification.httpError(error);
            },
        });
    }

    cancel(): void {
        this.router.navigate(['/auth/login']);
    }

    private register(value: RegisterPharmacistInput): void {
        this.authService.register(toRegisterPharmacistPayload(value)).pipe(
            takeUntil(this.destroy$),
            finalize(() => { this.isSubmitting = false; }),
        ).subscribe({
            next: () => {
                this.notification.success('Cuenta creada exitosamente');
                this.router.navigate(['/auth/login']);
            },
            error: (error) => {
                this.serverError = getHttpErrorMessage(error, 'No se pudo crear la cuenta');
                this.notification.httpError(error);
            },
        });
    }

    private validatePharmacy(pharmacy: PharmacistLookupResult, value: RegisterPharmacistInput): string | null {
        if (pharmacy.disposicionHabilitacion !== value.disposicionHabilitacion) {
            return 'El número de disposición no es correcto';
        }
        if (pharmacy.matriculaDTResponsable !== value.enrollment) {
            return 'El número de matrícula no es correcto';
        }
        const expected = moment(value.vencimientoHabilitacion);
        const actual = moment(pharmacy.vencimientoHabilitacion);
        if (!expected.isValid() || !actual.isValid() || !expected.isSame(actual, 'day')) {
            return 'La fecha de vencimiento de habilitación no es correcta';
        }
        return null;
    }

    private setupCuilSanitizer(): void {
        this.cuil.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
            const digits = (value || '').replace(/\D/g, '').slice(0, 11);
            if (digits !== value) {
                this.cuil.setValue(digits, { emitEvent: false });
            }
        });
    }
}
