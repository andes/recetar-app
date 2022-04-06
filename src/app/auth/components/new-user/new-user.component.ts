import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormGroupDirective } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@auth/services/auth.service';
import { ProfessionalsService } from '../../../services/professionals.service';
import * as moment from 'moment';
import { Router } from '@angular/router';

@Component({
    selector: 'app-new-user',
    templateUrl: './new-user.component.html',
    styleUrls: ['./new-user.component.sass']
})
export class NewUserComponent implements OnInit {

    public newUserForm: FormGroup;
    public error: string;
    public roleSelected: 'professional';
    public regexPassword = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/;
    public regexEmail = '^[a-z0-9._%+-]+@[a-z0-9.-]+[\.]{1}[a-z]{2,4}$';

    constructor(
        private fBuilder: FormBuilder,
        private authService: AuthService,
        private _snackBar: MatSnackBar,
        private professionalsService: ProfessionalsService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.initNewUserForm();
    }

    initNewUserForm(): void {
        this.newUserForm = this.fBuilder.group({
            dni: [''],
            cuil: [''],
            username: [''],
            enrollment: [''],
            email: ['', Validators.required],
            businessName: [''],
            password: ['', Validators.required],
            roleType: ['professional', Validators.required]
        });
    }

    checkUser() {
        this.newUserForm.controls.username.setValue(this.newUserForm.get('dni').value);
    }

    onSubmitEvent(newUserForm: FormGroup, newUserNgForm: FormGroupDirective) {
        if (this.newUserForm.valid) {
            this.checkUser();
            const params = {
                documento: newUserForm.get('dni').value,
                email: newUserForm.get('email').value
            }
            this.professionalsService.getProfessionalByDni(params).subscribe(res => {
                if (res.length) {
                    const profesional = res[0];
                    const { profesiones } = profesional;
                    if (this.checkMatricula(profesiones)) {
                        this.userRegister(newUserForm, newUserNgForm)
                    } else {
                        this._snackBar.open('La matricula no es correcta', 'cerrar', {
                            duration: 5000
                        });
                    }
                } else {
                    this._snackBar.open('Profesional no registrado, contactese con fiscalización para corroborar sus datos', 'cerrar', {
                        duration: 5000
                    });
                }
            })
        }
    }

    userRegister(newUserForm: FormGroup, newUserNgForm: FormGroupDirective) {
        this.authService.register(this.newUserForm.value).subscribe
            (() => {
                this.cancelar();
                this._snackBar.open('Usuario creado', 'cerrar', {
                    duration: 5000
                });
                newUserNgForm.resetForm();
                newUserForm.reset();
            },
                err => {
                    this._snackBar.open(`Eror: ${JSON.stringify(err.error)}'`, 'cerrar', {
                        duration: 5000
                    });
                })
    }

    checkMatricula(profesiones) {
        const lastProfesion = profesiones[profesiones.length - 1];
        const lastMatriculacion = lastProfesion.matriculacion[lastProfesion.matriculacion.length - 1];
        const res = ((moment(lastMatriculacion.fin)) > moment() && (lastMatriculacion.matriculaNumero).toString() === this.newUserForm.get('enrollment').value);
        return res;
    }

    cancelar() {
        this.router.navigate(['/auth/login']);
    }
}
