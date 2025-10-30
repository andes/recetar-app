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
    public authorizedProfessions: any[] = [];

    constructor(
        private fBuilder: FormBuilder,
        private authService: AuthService,
        private _snackBar: MatSnackBar,
        private professionalsService: ProfessionalsService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.initNewUserForm();
        this.professionalsService.getAuthorizedProfessions().subscribe(
            res => { 
                this.authorizedProfessions = res; 
            }
        );
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
            profesion: ['', Validators.required], 
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
            const selectedProf = newUserForm.get('profesion').value;
            const params = {
                documento: newUserForm.get('dni').value,
                email: newUserForm.get('email').value,
                matricula: newUserForm.get('enrollment').value,
                profesionCodigo: selectedProf ? selectedProf.codigoProfesion : null,
                cuil: newUserForm.get('cuil').value,
                fechaEgreso: moment(newUserForm.get('fechaEgreso').value).format('DD-MM-YYYY'),
                fechaMatVencimiento: moment(newUserForm.get('fechaMatVencimiento').value).format('DD-MM-YYYY')
            };
           this.userRegister(newUserForm, newUserNgForm);
        } else {
            this._snackBar.open('Los campos deben estar completos y ser válidos', 'cerrar', {
                duration: 5000
            });
        }
        this.newUserForm.get('captcha')?.reset();

    }

    userRegister(newUserForm: FormGroup, newUserNgForm: FormGroupDirective) {
        this.authService.register(this.newUserForm.value).subscribe
            (user => {
                this.cancelar();
                const selectedProf = this.newUserForm.get('profesion').value;
                const mensaje = `La cuenta ha sido creada exitosamente
                Nombre: ${user.newUser.businessName}
                Usuario: ${this.newUserForm.get('username').value}
                Profesión: ${selectedProf?.profesion || 'No especificada'}
                Matrícula: ${this.newUserForm.get('enrollment').value}`;
                this._snackBar.open(mensaje, 'cerrar', {
                    duration: 12000,
                    panelClass: ['success-snackbar']

                });
                newUserNgForm.resetForm();
                newUserForm.reset();
            },
                err => {
                    this._snackBar.open(`Ha ocurrido un error al intentar crear la cuenta: ${JSON.stringify(err)}'`, 'cerrar', {
                        duration: 5000
                    });
                });
    }


    checkPersona(profesional) {
        const cuil = this.newUserForm.get('cuil').value;
        const salida = profesional.cuit == cuil ? true : false;
        return salida;
    }

    cancelar() {
        this.router.navigate(['/auth/login']);
    }
  
}
