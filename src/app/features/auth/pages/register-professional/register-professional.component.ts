import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from '@auth/services/auth.service';
import { AuthorizedProfession, ProfessionalsService } from '@services/professionals.service';
import { AndesSearchService } from '@services/andes-search.service';
import { CanvasComponent } from '@shared/components/layout/canvas/canvas.component';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { UiAlertComponent } from '@shared/ui';
import { NgxTurnstileModule } from '@shared/ngx-turnstile/ngx-turnstile.module';
import { NgxTurnstileFormsModule } from '@shared/ngx-turnstile/ngx-turnstile-forms.module';
import { NotificationService } from '@shared/services/notification.service';
import { getHttpErrorMessage } from '@shared/utils/http-error.util';
import { cuilValidator } from '@utils/custome-validators/cuil.validator';
import { toRegisterProfessionalPayload } from '@models/dto/register.dto';

type CuilSource = 'andes' | 'sin-cuit' | null;

@Component({
    selector: 'app-register-professional',
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
    templateUrl: './register-professional.component.html',
    styleUrls: ['./register-professional.component.sass'],
})
export class RegisterProfessionalComponent implements OnInit, OnDestroy {
    readonly siteKey = '0x4AAAAAAAhL2mZAyxFj63Dw';
    readonly maxDate = new Date().toISOString().slice(0, 10);

    readonly fieldErrors: Record<string, Record<string, string>> = {
        dni: { required: 'El DNI es obligatorio', pattern: 'El DNI debe tener entre 5 y 8 dígitos' },
        cuil: { required: 'El CUIL es obligatorio', invalidFormat: 'El CUIL debe tener 11 dígitos', invalidCuil: 'El CUIL no es válido' },
        enrollment: { required: 'La matrícula es obligatoria', pattern: 'La matrícula debe tener entre 2 y 10 dígitos' },
        profesion: { required: 'Seleccioná una profesión' },
        fechaEgreso: { required: 'La fecha de egreso es obligatoria' },
        fechaMatVencimiento: { required: 'El vencimiento de matrícula es obligatorio' },
        email: { required: 'El email es obligatorio', email: 'El email no es válido' },
        password: { required: 'La contraseña es obligatoria', pattern: 'Mínimo 8 caracteres, con mayúscula, minúscula y número' },
    };

    form: FormGroup;
    submitted = false;
    isSubmitting = false;
    isSearching = false;
    cuilSource: CuilSource = null;
    serverError: string | null = null;
    authorizedProfessions: AuthorizedProfession[] = [];

    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private professionalsService: ProfessionalsService,
        private andesSearch: AndesSearchService,
        private notification: NotificationService,
        private router: Router,
    ) {
        this.form = this.fb.group({
            dni: ['', [Validators.required, Validators.pattern(/^\d{5,8}$/)]],
            cuil: ['', [Validators.required, cuilValidator]],
            enrollment: ['', [Validators.required, Validators.pattern(/^\d{2,10}$/)]],
            profesion: ['', [Validators.required]],
            fechaEgreso: ['', [Validators.required]],
            fechaMatVencimiento: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.pattern(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?!.* ).{8,}$/)]],
            captcha: ['', [Validators.required]],
        });
    }

    ngOnInit(): void {
        this.loadProfessions();
        this.setupCuilSanitizer();
        this.setupAndesLookup();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get dni(): AbstractControl { return this.form.get('dni')!; }
    get cuil(): AbstractControl { return this.form.get('cuil')!; }
    get enrollment(): AbstractControl { return this.form.get('enrollment')!; }
    get profesion(): AbstractControl { return this.form.get('profesion')!; }
    get fechaEgreso(): AbstractControl { return this.form.get('fechaEgreso')!; }
    get fechaMatVencimiento(): AbstractControl { return this.form.get('fechaMatVencimiento')!; }
    get email(): AbstractControl { return this.form.get('email')!; }
    get password(): AbstractControl { return this.form.get('password')!; }
    get captcha(): AbstractControl { return this.form.get('captcha')!; }

    get professionOptions(): Array<{ value: string; label: string }> {
        return this.authorizedProfessions.map((item) => ({
            value: String(item.codigoProfesion),
            label: item.profesion,
        }));
    }

    get selectedProfession(): AuthorizedProfession | null {
        const code = this.profesion.value;
        return this.authorizedProfessions.find((item) => String(item.codigoProfesion) === String(code)) || null;
    }

    onSubmit(): void {
        this.submitted = true;
        this.serverError = null;
        if (this.form.invalid) {
            return;
        }
        const value = this.form.getRawValue();
        const payload = toRegisterProfessionalPayload({ ...value, profesion: this.selectedProfession });
        this.isSubmitting = true;
        this.authService.register(payload).pipe(
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

    cancel(): void {
        this.router.navigate(['/auth/login']);
    }

    private loadProfessions(): void {
        this.professionalsService.getAuthorizedProfessions().pipe(
            takeUntil(this.destroy$),
            catchError(() => of([])),
        ).subscribe((professions) => {
            this.authorizedProfessions = professions;
        });
    }

    private setupCuilSanitizer(): void {
        this.cuil.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
            const digits = (value || '').replace(/\D/g, '').slice(0, 11);
            if (digits !== value) {
                this.cuil.setValue(digits, { emitEvent: false });
            }
            this.cuilSource = null;
        });
    }

    private setupAndesLookup(): void {
        this.dni.valueChanges.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            takeUntil(this.destroy$),
            switchMap((documento) => {
                if (!documento || !/^\d{5,8}$/.test(documento)) {
                    this.isSearching = false;
                    return of(null);
                }
                this.isSearching = true;
                return this.andesSearch.searchProfessional(documento).pipe(catchError(() => of(null)));
            }),
        ).subscribe((response) => {
            this.isSearching = false;
            const professional = response?.data?.[0];
            if (!professional) {
                return;
            }
            const cuit = (professional.cuit || '').replace(/\D/g, '');
            if (cuit) {
                if (!this.cuil.value) {
                    this.cuil.setValue(cuit, { emitEvent: false });
                }
                this.cuilSource = 'andes';
            } else {
                this.cuilSource = 'sin-cuit';
            }
        });
    }
}
