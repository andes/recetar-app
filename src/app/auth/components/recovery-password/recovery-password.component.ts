import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl, FormGroupDirective, Validators, ValidationErrors } from '@angular/forms';
import { AuthService } from '@auth/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ThemePalette } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-recovery-password',
    templateUrl: './recovery-password.component.html',
    styleUrls: ['./recovery-password.component.sass'],
    standalone: false
})
export class RecoveryComponent implements OnInit {

  recoveryForm: FormGroup;
  hideOldPassword: boolean = true;
  hideNewPassword: boolean = true;
  error: string;
  showSubmit: boolean = false;
  readonly spinnerColor: ThemePalette = 'primary';
  readonly spinnerDiameter: number = 30;
  private token;

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
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 3000);
          this.openSnackBar(res, "Cerrar");
        },
        err => {
          recoveryNgForm.resetForm();
          recoveryForm.reset();
          this.error = err;
          this.showSubmit = false;
        });
    }
  }

  checkPasswords(group: FormGroup) {
    const password = group.get('newPassword').value;
    const confirmPassword = group.get('confirmPassword').value;

    return password === confirmPassword ? null : { notSame: true }     
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
}
