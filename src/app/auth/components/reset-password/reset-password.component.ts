import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl, FormGroupDirective, Validators } from '@angular/forms';
import { AuthService } from '@auth/services/auth.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { ThemePalette } from '@angular/material/core/common-behaviors/color';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.sass']
})
export class ResetPasswordComponent implements OnInit {

  resetForm: FormGroup;
  hideOldPassword: boolean = true;
  hideNewPassword: boolean = true;

  showSubmit: boolean = false;
  // readonly spinnerColor: ThemePalette = 'accent';
  readonly spinnerColor: ThemePalette = 'primary';
  readonly spinnerDiameter: number = 30;

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
          setTimeout(() => {
            if (this.authService.isPharmacistsRole()) {
              this.router.navigate(['/farmacias/recetas/dispensar']);
            } else if (this.authService.isProfessionalRole()) {
              this.router.navigate(['/profesionales/recetas/nueva']);
            }
          }, 3000);

          const message = res.message || res.mensaje || 'Contraseña cambiada exitosamente';
          this.openSnackBar(message, "Cerrar");
        },
        err => {
          resetNgForm.resetForm();
          resetForm.reset();
          const errorMessage = typeof err === 'string' ? err : (err.error?.message || err.message || 'Error al cambiar contraseña');
          this.openSnackBar(errorMessage, "Cerrar");
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
}
