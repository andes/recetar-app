import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormGroupDirective } from '@angular/forms';
import { AuthService } from '@auth/services/auth.service';
import { AmbitoService } from '@auth/services/ambito.service';
import { Router } from '@angular/router';
import { ThemePalette } from '@angular/material/core';
import { DialogComponent } from '@auth/components/dialog/dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  error: string;
  passwordExpired = false;
  resendingEmail = false;
  resendIdentifier: string;
  readonly spinnerColor: ThemePalette = 'primary';
  readonly spinnerDiameter: number = 30;
  showSubmit = false;
  randomId = Math.random().toString(36).substring(7);
  passwordFieldName: string = 'field_' + Math.random().toString(36).substring(7);
  passwordFieldKey: string = 'pwd_1';
  passwordName: string = 'pwd_' + Math.random().toString(36).substring(7);
  hide = true;

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
      identifier: ['', [
        Validators.required
      ]],
      password: ['', [
        Validators.required
      ]]
    });
  }

  onSubmitEvent(loginForm: FormGroup, loginNgForm: FormGroupDirective): void {
    if (this.loginForm.valid) {

      this.resendIdentifier = this.loginForm.value.identifier;
      this.showSubmit = true;
      this.authService.login(this.loginForm.value).subscribe(
        res => {
          if (this.authService.isProfessionalBothRoles()) {
            this.router.navigate(['/profesionales/seleccionador-ambito']);
          } else if (this.authService.isProfessionalPublicRole()) {
            this.ambitoSrevice.setAmbito('publico');
            this.router.navigate(['/profesionales/recetas/nueva']);
          } else if (this.authService.isProfessionalRole()) {
            this.ambitoSrevice.setAmbito('privado');
            this.router.navigate(['/profesionales/recetas/nueva']);
          } else if (this.authService.isPharmacistsPublicRole()) {
            this.ambitoSrevice.setAmbito('publico');
            this.router.navigate(['/farmacias/recetas/dispensar']);
          } else if (this.authService.isPharmacistsRole()) {
            this.ambitoSrevice.setAmbito('privado');
            this.router.navigate(['/farmacias/recetas/dispensar']);
          } else if (this.authService.isOnlyAuditRole()) {
            this.router.navigate(['/audit/users']);
          } else if (this.authService.isAuditRole()) {
            this.router.navigate(['/audit/recetas/auditar']);
          }
          this.showSubmit = false;
        },
        err => {
          loginNgForm.resetForm();
          loginForm.reset();
          if (typeof err === 'object' && err !== null && err.code === 'PASSWORD_EXPIRED') {
            this.passwordExpired = true;
            this.error = err.message;
          } else {
            this.passwordExpired = false;
            this.error = err;
          }
          this.showSubmit = false;
        });
    }
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '800px'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  resendEmail(): void {
    const identifier = this.resendIdentifier;
    if (!identifier || this.resendingEmail) { return; }
    this.resendingEmail = true;
    this.authService.resendPasswordExpiry(identifier).subscribe(
      () => {
        this.resendingEmail = false;
        this.error = 'Se ha reenviado el correo electrónico con las instrucciones para cambiar su contraseña.';
      },
      () => {
        this.resendingEmail = false;
        this.error = 'No se pudo reenviar el correo. Por favor, intente nuevamente.';
      }
    );
  }

  showInformation(): void {
    this.openDialog();
  }

  get identifier(): AbstractControl {
    return this.loginForm.get('identifier');
  }

  get password(): AbstractControl {
    return this.loginForm.get('password');
  }

  forgot() {
    this.router.navigate(['/auth/forgot-password']);
  }

  newUser() {
    this.router.navigate(['/auth/new-user']);
  }

  newUserPharmacist() {
    this.router.navigate(['/auth/new-user-pharmacist']);
  }

  updateInputType(inputElement: HTMLInputElement) {
    if (this.hide) {
      inputElement.type = inputElement.value.length ? 'password' : 'text';
    } else {
      inputElement.type = 'text';
    }
  }

  toggleVisibility(inputElement: HTMLInputElement) {
    this.hide = !this.hide;
    this.updateInputType(inputElement);
  }
}
