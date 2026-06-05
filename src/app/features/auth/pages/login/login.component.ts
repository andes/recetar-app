import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormGroupDirective, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '@auth/services/auth.service';
import { AmbitoService } from '@auth/services/ambito.service';
import { Router, RouterModule } from '@angular/router';
import { ThemePalette } from '@angular/material/core';
import { DialogComponent } from '@auth/components/dialog/dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { getHttpErrorMessage } from '@shared/utils/http-error.util';
import { take } from 'rxjs/operators';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CanvasComponent } from '@shared/components/layout/canvas/canvas.component';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.sass'],
    standalone: true,
    imports: [
        ReactiveFormsModule,
        FormsModule,
        RouterModule,
        FlexLayoutModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        CanvasComponent,
        FormFieldComponent,
    ]
})
export class LoginComponent implements OnInit {

    loginForm: FormGroup;
    error: string;
    readonly spinnerColor: ThemePalette = 'primary';
    readonly spinnerDiameter: number = 30;
    showSubmit = false;
    hide = true;
    submitted = false;
    readonly loginErrors: Record<string, string> = { required: 'Este campo es obligatorio' };

    constructor(
        private fBuilder: FormBuilder,
        private authService: AuthService,
        private ambitoSrevice: AmbitoService,
        private router: Router,
        public dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.initLoginForm();
    }

    initLoginForm(): void {
        this.loginForm = this.fBuilder.group({
            identifier: ['', [Validators.required]],
            password: ['', [Validators.required]]
        });
    }

    onSubmitEvent(loginForm: FormGroup, loginNgForm: FormGroupDirective): void {
        this.submitted = true;
        if (this.loginForm.valid) {
            this.showSubmit = true;
            this.authService.login(this.loginForm.value).subscribe(
                () => {
                    if (this.authService.isProfessionalBothRoles()) {
                        // user will select ambito in selector
                    } else if (this.authService.isProfessionalPublicRole() || this.authService.isPharmacistsPublicRole()) {
                        this.ambitoSrevice.setAmbito('publico');
                    } else if (this.authService.isProfessionalRole() || this.authService.isPharmacistsRole()) {
                        this.ambitoSrevice.setAmbito('privado');
                    }
                    this.router.navigate(['/dashboard']);
                    this.showSubmit = false;
                },
                err => {
                    loginNgForm.resetForm();
                    loginForm.reset();
                    this.error = getHttpErrorMessage(err);
                    this.showSubmit = false;
                });
        }
    }

    openDialog(): void {
        const dialogRef = this.dialog.open(DialogComponent, { width: '800px' });
        dialogRef.afterClosed().pipe(take(1)).subscribe();
    }

    showInformation(): void {
        this.openDialog();
    }

    get identifier(): AbstractControl { return this.loginForm.get('identifier'); }
    get password(): AbstractControl { return this.loginForm.get('password'); }

    forgot() { this.router.navigate(['/auth/forgot-password']); }
    newUser() { this.router.navigate(['/auth/new-user']); }
    newUserPharmacist() { this.router.navigate(['/auth/new-user-pharmacist']); }

    togglePasswordVisibility() {
        this.hide = !this.hide;
    }
}
