import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormGroupDirective } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@auth/services/auth.service';
import { PharmacistsService } from '../../../services/pharmacists.service';
import * as moment from 'moment';
import { Router } from '@angular/router';

@Component({
    selector: 'app-new-user',
    templateUrl: './new-user-pharmacist.component.html',
    styleUrls: ['./new-user-pharmacist.component.sass']
})
export class NewUserPharmacistComponent implements OnInit {

    public newUserForm: FormGroup;
    public error: string;
    public roleSelected: 'pharmacist';
    public regexPassword = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?!.* ).{8,}$/;
    public regexEmail = '^[a-z0-9._%+-]+@[a-z0-9.-]+[\.]{1}[a-z]{2,4}$';
    public minDate = new Date();

    constructor(
        private fBuilder: FormBuilder,
        private authService: AuthService,
        private _snackBar: MatSnackBar,
        private pharmacistsService: PharmacistsService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.initNewUserForm();
    }

    initNewUserForm(): void {
        this.newUserForm = this.fBuilder.group({
            cuil: [''],
            username: [''],
            disposicionHabilitacion: [''],
            enrollment: [''], //matriculaDTResponsable
            vencimientoHabilitacion: [''],
            email: ['', Validators.required],
            businessName: [''],
            password: ['', Validators.required],
            roleType: ['pharmacist', Validators.required]
        });
    }

    checkUser() {
        this.newUserForm.controls.username.setValue(this.newUserForm.get('cuil').value);
    }

    onSubmitEvent(newUserForm: FormGroup, newUserNgForm: FormGroupDirective) {
    
        if (this.newUserForm.valid) {
            this.checkUser();
            const params = {
                cuil: newUserForm.get('cuil').value
            }
            this.pharmacistsService.getPharmacistByCuit(params).subscribe(res => {
                if (res.length) {
                    const pharmacist = res[0];
                    console.log(pharmacist, this.newUserForm.value)
                    if (this.checkDisposicionFarmacia(pharmacist) && this.checkMatricula(pharmacist) && this.checkVencimientoHabilitacion(pharmacist)) {
                        this.userRegister(newUserForm, newUserNgForm)
                    } else {
                        if (!this.checkDisposicionFarmacia(pharmacist)) {
                            this._snackBar.open("El número de disposicion no es correcto", 'cerrar', {
                                duration: 5000
                            });
                        }
                        if (!this.checkMatricula(pharmacist)) {
                            this._snackBar.open("El número de matricula no es correcto", 'cerrar', {
                                duration: 5000
                            });
                        }
                        if (!this.checkVencimientoHabilitacion(pharmacist)) {
                            this._snackBar.open("La fecha de vencimiento de habilitación no es correcta", 'cerrar', {
                                duration: 5000
                            });
                        }
                    }
                } else {
                    this._snackBar.open('La farmacia no se encuentra registrada, contáctese con fiscalización para corroborar sus datos', 'cerrar', {
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
                this._snackBar.open('La cuenta ha sido creada exitosamente', 'cerrar', {
                    duration: 5000
                });
                newUserNgForm.resetForm();
                newUserForm.reset();
            },
                err => {
                    this._snackBar.open(`Ha ocurrido un error al intentar crear la cuenta: ${JSON.stringify(err.error)}'`, 'cerrar', {
                        duration: 5000
                    });
                })
    }

    checkDisposicionFarmacia(pharmacist) {
        const disposicionHabilitacion = this.newUserForm.get('disposicionHabilitacion').value;
        let salida = pharmacist.disposicionHabilitacion === disposicionHabilitacion ? true : false;
        return salida;
    }

    checkMatricula(pharmacist) {
        const matriculaDTResponsable = this.newUserForm.get('enrollment').value;
        let salida = pharmacist.matriculaDTResponsable === matriculaDTResponsable ? true : false;
        return salida;
    }

    checkVencimientoHabilitacion(pharmacist) {
        const vencimientoHabilitacionForm = this.newUserForm.get('vencimientoHabilitacion').value;
        const vencimientoHabilitacionAndes = moment(pharmacist.vencimientoHabilitacion);
        console.log(vencimientoHabilitacionAndes);
        console.log(vencimientoHabilitacionForm);
        const diferencia = vencimientoHabilitacionForm.diff(vencimientoHabilitacionAndes, 'days');
        let salida = diferencia === 0 ? true : false;
        return salida;
    }

    cancelar() {
        this.router.navigate(['/auth/login']);
    }
}
