import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormGroupDirective } from '@angular/forms';
import { AuthService } from '@auth/services/auth.service';
import { Router } from '@angular/router';
import { ThemePalette } from '@angular/material/core';
import { DialogComponent } from '@auth/components/dialog/dialog.component';
// Material
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-forgot',
    templateUrl: './forgot.component.html',
    styleUrls: ['./forgot.component.sass'],
    standalone: false
})
export class ForgotComponent implements OnInit {

  forgotForm: FormGroup;
  hide: boolean = true;
  error: string;
  readonly spinnerColor: ThemePalette = 'primary';
  readonly spinnerDiameter: number = 30;
  showSubmit: boolean = false;
  mailEnviado: boolean;

  constructor(
    private fBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private _snackBar: MatSnackBar,
    public dialog: MatDialog
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
            this.openSnackBar(data.msg, "Cerrar");
          } else {
            this.openSnackBar(data.msg, "Cerrar");
          }
          this.showSubmit = false;
        },
        err => {
          resetNgForm.resetForm();
          resetForm.reset();
          this.error = err;
          this.showSubmit = false;
        })
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
