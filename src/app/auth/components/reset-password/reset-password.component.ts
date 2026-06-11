import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl, FormGroupDirective, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '@auth/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { ThemePalette } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { getHttpErrorMessage } from '@shared/utils/http-error.util';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-reset-password',
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.sass'],
    standalone: true,
    imports: [
        ReactiveFormsModule,
        FormsModule,
        RouterModule,
        FlexLayoutModule,
        MatCardModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule
    ]
})
export class ResetPasswordComponent implements OnInit, OnDestroy {

    resetForm: FormGroup;
    hideOldPassword = true;
    hideNewPassword = true;

    showSubmit = false;
    // readonly spinnerColor: ThemePalette = 'accent';
    readonly spinnerColor: ThemePalette = 'primary';
    readonly spinnerDiameter: number = 30;
    private destroy$ = new Subject<void>();

    constructor(
        private fBuild: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private _snackBar: MatSnackBar,
        private _location: Location
    ) { }

    ngOnInit(): void {
        this.initResetForm();
    }

    initResetForm() {
        this.resetForm = this.fBuild.group({
            oldPassword: ['', [
                Validators.required
            ]],
            newPassword: ['', [
                Validators.required,
                Validators.minLength(8)
            ]]
        });
    }

    onSubmitEvent(resetForm: FormGroup, resetNgForm: FormGroupDirective): void {
        if (this.resetForm.valid) {
            this.showSubmit = true;
            this.authService.resetPassword(this.resetForm.value).subscribe(
                res => {
                    timer(3000)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe(() => {
                            if (this.authService.isPharmacistsRole()) {
                                this.router.navigate(['/farmacias/recetas/dispensar']);
                            } else if (this.authService.isProfessionalRole()) {
                                this.router.navigate(['/profesionales/recetas/nueva']);
                            }
                        });

                    const message = res.message || res.mensaje || 'Contraseña cambiada exitosamente';
                    this.openSnackBar(message, 'Cerrar');
                },
                err => {
                    resetNgForm.resetForm();
                    resetForm.reset();
                    const errorMessage = getHttpErrorMessage(err, 'Error al cambiar contraseña');
                    this.openSnackBar(errorMessage, 'Cerrar');
                    this.showSubmit = false;
                });
        }
    }

    // Show a notification
    openSnackBar(message: string, action: string) {
        this._snackBar.open(message, action, {
            duration: 5000
        });
    }

    backClicked() {
        this._location.back();
    }

    get oldPassword(): AbstractControl {
        return this.resetForm.get('oldPassword');
    }

    get newPassword(): AbstractControl {
        return this.resetForm.get('newPassword');
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
