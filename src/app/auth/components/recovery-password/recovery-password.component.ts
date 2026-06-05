import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl, FormGroupDirective, Validators, ValidationErrors, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '@auth/services/auth.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
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
    selector: 'app-recovery-password',
    templateUrl: './recovery-password.component.html',
    styleUrls: ['./recovery-password.component.sass'],
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
export class RecoveryComponent implements OnInit, OnDestroy {

    recoveryForm: FormGroup;
    hideOldPassword = true;
    hideNewPassword = true;
    error: string;
    showSubmit = false;
    readonly spinnerColor: ThemePalette = 'primary';
    readonly spinnerDiameter: number = 30;
    private token;
    private destroy$ = new Subject<void>();

    constructor(
        private fBuild: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private _snackBar: MatSnackBar,
        private _location: Location,
        private activateRouter: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.initrecoveryForm();
    }

    initrecoveryForm() {
        this.token = this.activateRouter.snapshot.paramMap.get('token');
        this.recoveryForm = this.fBuild.group({
            newPassword: ['', [
                Validators.required,
                Validators.minLength(8)
            ]],
            confirmPassword: ['', [
                Validators.required,
                this.matchValues('newPassword'),
            ]]
        },
            { validators: this.checkPasswords });
    }

    onSubmitEvent(recoveryForm: FormGroup, recoveryNgForm: FormGroupDirective): void {
        if (this.recoveryForm.valid) {
            this.showSubmit = true;
            this.authService.recoverPassword({ newPassword: this.newPassword.value, authenticationToken: this.token }).subscribe(
                res => {
                    // menssage
                    this.showSubmit = false;
                    timer(3000)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe(() => {
                            this.router.navigate(['/auth/login']);
                        });
                    this.openSnackBar(res, 'Cerrar');
                },
                err => {
                    recoveryNgForm.resetForm();
                    recoveryForm.reset();
                    this.error = getHttpErrorMessage(err);
                    this.showSubmit = false;
                });
        }
    }

    checkPasswords(group: FormGroup) {
        const password = group.get('newPassword').value;
        const confirmPassword = group.get('confirmPassword').value;

        return password === confirmPassword ? null : { notSame: true };
    }

    matchValues(matchTo: string): (AbstractControl) => ValidationErrors | null {
        return (control: AbstractControl): ValidationErrors | null => {
            return !!control.parent &&
                !!control.parent.value &&
                control.value === control.parent.controls[matchTo].value
                ? null
                : { isMatching: false };
        };
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

    get confirmPassword(): AbstractControl {
        return this.recoveryForm.get('confirmPassword');
    }

    get newPassword(): AbstractControl {
        return this.recoveryForm.get('newPassword');
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
