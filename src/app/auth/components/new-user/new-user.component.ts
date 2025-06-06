import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormGroupDirective } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { cuilValidator } from '../../../utils/custome-validators/cuil.validator';
import { fechaValida } from '../../../utils/custome-validators/date.validator';
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
    public regexPassword = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?!.* ).{8,}$/;
    public regexEmail = '^[a-z0-9._%+-]+@[a-z0-9.-]+[\.]{1}[a-z]{2,4}$';
    public siteKey = '0x4AAAAAAAhL2mZAyxFj63Dw';
    public minDate = new Date();

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
            dni: ['', [Validators.required, Validators.pattern(/^\d{5,8}$/)]],
            cuil: ['', [Validators.required, cuilValidator]],
            username: [''],
            enrollment: ['', [Validators.required, Validators.pattern(/^\d{2,10}$/)]],
            email: ['', Validators.required],
            businessName: [''],
            password: ['', Validators.required],
            roleType: ['professional', Validators.required],
            fechaEgreso: ['', [Validators.required, fechaValida]],
            fechaMatVencimiento: ['', [Validators.required, fechaValida]],
            captcha: ['', Validators.required]
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
                email: newUserForm.get('email').value,
                matricula: newUserForm.get('enrollment').value,
                cuil: newUserForm.get('cuil').value,
                fechaEgreso: moment(newUserForm.get('fechaEgreso').value).format('DD-MM-YYYY'),
                fechaMatVencimiento: moment(newUserForm.get('fechaMatVencimiento').value).format('DD-MM-YYYY')
            }
            this.professionalsService.getProfessionalByDni(params).subscribe(res => {
                if (res.length) {
                    const profesional = res[0];
                    const { profesiones } = profesional;
                    if (this.checkPersona(profesional) && this.checkMatricula(profesiones)) {
                        this.userRegister(newUserForm, newUserNgForm)
                    } else {
                        this._snackBar.open('El número de matricula o el número de cuil no es correcto', 'cerrar', {
                            duration: 5000
                        });
                    }
                } else {
                    this._snackBar.open('Profesional no se encuentra registrado, contáctese con fiscalización para corroborar sus datos', 'cerrar', {
                        duration: 5000
                    });
                }
            },
                err => {
                    if (err.status === 404) {
                        this._snackBar.open('No se encuentra el profesional.', 'cerrar', {
                            duration: 5000
                        });
                    } else {
                        this._snackBar.open('Profesional no se encuentra registrado, corrobore los datos ingresados', 'cerrar', {
                            duration: 5000
                        });
                    }
                })
        } else {
            this._snackBar.open('Los campos deben estar completos y ser validos', 'cerrar', {
                duration: 5000
            })
        }
    }

    userRegister(newUserForm: FormGroup, newUserNgForm: FormGroupDirective) {
        this.authService.register(this.newUserForm.value).subscribe
            (() => {
                this.cancelar();
                this._snackBar.open('La cuenta ha sido creada exitosamente', 'cerrar', {
                    duration: 5000
                });
                newUserNgForm.resetForm();
                newUserForm.reset();
            },
                err => {
                    this._snackBar.open(`Ha ocurrido un error al intentar crear la cuenta: ${JSON.stringify(err)}'`, 'cerrar', {
                        duration: 5000
                    });
                })
    }


    checkPersona(profesional) {
        const cuil = this.newUserForm.get('cuil').value;
        let salida = profesional.cuit == cuil ? true : false
        return salida;
    }

    checkMatricula(profesiones) {
        const lastProfesion = profesiones.find(p => p.profesion.codigo == '1' || p.profesion.codigo == '23' || p.profesion.codigo == '2');
        const lastMatriculacion = lastProfesion.matriculacion[lastProfesion.matriculacion.length - 1];
        if (lastMatriculacion) {
            const res = ((moment(lastMatriculacion.fin)) > moment() && (lastMatriculacion.matriculaNumero).toString() === this.newUserForm.get('enrollment').value);
            return res;
        } else {
            return false;
        }
    }

    cancelar() {
        this.router.navigate(['/auth/login']);
    }

}
