import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormGroupDirective } from '@angular/forms';
import { AuthService } from '@auth/services/auth.service';
import { Router } from '@angular/router';
import { ThemePalette } from '@angular/material/core';
import { DialogComponent } from '@auth/components/dialog/dialog.component';
// Material
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  otpForm: FormGroup;
  hide: boolean = true;
  error: string;
  readonly spinnerColor: ThemePalette = 'primary';
  readonly spinnerDiameter: number = 30;
  showSubmit: boolean = false;
  showOtpForm: boolean = false;

  constructor(
    private fBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.initLoginForm();
    this.initOtpForm();
    
    // Suscribirse al observable isOtpRequired
    this.authService.isOtpRequired.subscribe(required => {
      this.showOtpForm = required;
    });
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

  initOtpForm(): void {
    this.otpForm = this.fBuilder.group({
      otpToken: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
        Validators.pattern('^[0-9]*$')
      ]]
    });
  }

  onSubmitEvent(loginForm: FormGroup, loginNgForm: FormGroupDirective): void {
    if (this.loginForm.valid) {
      this.showSubmit = true;
      this.authService.login(this.loginForm.value).subscribe(
        res => {
          console.log("login: primero debe verificar datos válidos", res);
          if(res && !this.showOtpForm) {
            this.redirectBasedOnRole();
          }
          this.showSubmit = false;
        },
        err => {
          loginNgForm.resetForm();
          loginForm.reset();
          this.error = err;
          this.showSubmit = false;
        });
    }
  }

  onSubmitOtp(): void {
    if (this.otpForm.valid) {
      this.showSubmit = true;
      this.authService.verifyOtp(this.otpForm.value.otpToken).subscribe(
        res => {
          console.log("verifyOtp", res);
          if(res) {
            this.redirectBasedOnRole();
          } else {
            this.error = 'Código OTP inválido';
          }
          this.showSubmit = false;
        },
        err => {
          this.otpForm.reset();
          this.error = err;
          this.showSubmit = false;
        });
    }
  }

  redirectBasedOnRole(): void {
    if (this.authService.isPharmacistsRole()) {
      this.router.navigate(['/farmacias/recetas/dispensar']);
    } else if (this.authService.isProfessionalRole()) {
      this.router.navigate(['/profesionales/recetas/nueva']);
    } else if (this.authService.isAuditRole()) {
      this.router.navigate(['/audit/recetas/auditar']);
    }
  }

  // Show a dialog
  openDialog(): void {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '800px'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
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

  get otpToken(): AbstractControl {
    return this.otpForm.get('otpToken');
  }

  forgot() {
    this.router.navigate(['/auth/forgot-password']);
  }

  newUser() {
    this.router.navigate(['/auth/new-user']);
  }

  newUserPharmacist() {
    this.router.navigate(['/auth/new-user-pharmacist'])
  }
}
