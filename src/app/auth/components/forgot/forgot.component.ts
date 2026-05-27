import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormGroupDirective, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '@auth/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { ThemePalette } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { getHttpErrorMessage } from '@shared/utils/http-error.util';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-forgot',
    templateUrl: './forgot.component.html',
    styleUrls: ['./forgot.component.sass'],
    standalone: true,
    imports: [
        ReactiveFormsModule,
        FormsModule,
        RouterModule,
        FlexLayoutModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule
    ]
})
export class ForgotComponent implements OnInit {

    forgotForm: FormGroup;
    hide = true;
    error: string;
    readonly spinnerColor: ThemePalette = 'primary';
    readonly spinnerDiameter: number = 30;
    showSubmit = false;
    mailEnviado: boolean;

    constructor(
        private fBuilder: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private _snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.initforgotForm();
    }

    initforgotForm(): void {
        this.forgotForm = this.fBuilder.group({
            usuario: ['', [
                Validators.required
            ]]
        });
    }

    cancelar() {
        this.router.navigate(['/auth/login']);
    }

    onSubmitEvent(resetForm: FormGroup, resetNgForm: FormGroupDirective): void {
        if (this.forgotForm.valid) {
            this.showSubmit = true;
            this.authService.setValidationTokenAndNotify(this.forgotForm.value).subscribe(
                data => {
                    if (data.status === 'ok') {
                        this.mailEnviado = true;
                        this.openSnackBar(data.msg, 'Cerrar');
                    } else {
                        this.openSnackBar(data.msg, 'Cerrar');
                    }
                    this.showSubmit = false;
                },
                err => {
                    resetNgForm.resetForm();
                    resetForm.reset();
                    this.error = getHttpErrorMessage(err);
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

    get usuario(): AbstractControl {
        return this.forgotForm.get('usuario');
    }
}
