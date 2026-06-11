import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@auth/services/auth.service';
import { UserService } from '@services/users.service';
import { getHttpErrorMessage } from '@shared/utils/http-error.util';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-edit-user-info',
    templateUrl: './edit-user-info.component.html',
    styleUrls: ['./edit-user-info.component.sass'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        FlexLayoutModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule
    ]
})
export class EditUserInfoComponent implements OnInit {
    editUserForm: FormGroup;
    isLoading = false;
    currentUserId: string;
    currentEmail: string;
    updateError: string | null = null;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private snackBar: MatSnackBar,
        private authService: AuthService,
        private userService: UserService
    ) {
        // Inicializar el formulario en el constructor para evitar errores
        this.editUserForm = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    ngOnInit(): void {
        this.currentUserId = this.authService.getLoggedUserId();
        this.loadCurrentUserEmail();
    }

    loadCurrentUserEmail(): void {
        // Obtener los datos del usuario mediante petición HTTP
        this.userService.getUserById(this.currentUserId).subscribe({
            next: (user) => {
                if (user && user.email) {
                    this.currentEmail = user.email;
                    this.editUserForm.patchValue({
                        email: this.currentEmail
                    });
                }
            },
            error: (error) => {
                this.updateError = error || 'Error al cargar la información del usuario';
                this.snackBar.open(this.updateError, 'Cerrar', {
                    duration: 3000,
                    panelClass: ['error-snackbar']
                });
            }
        });
    }

    get email(): AbstractControl | null {
        return this.editUserForm.get('email');
    }

    onSubmit(): void {
        if (this.editUserForm.valid && !this.isLoading) {
            this.isLoading = true;
            const newEmail = this.editUserForm.get('email')?.value;

            if (this.authService.isPharmacistsRole()) {
                const updateData = { email: newEmail };

                this.userService.requestUpdateUser(this.currentUserId, updateData).subscribe({
                    next: () => {
                        this.isLoading = false;
                        this.snackBar.open('Se ha enviado un correo para confirmar los cambios', 'Cerrar', {
                            duration: 5000
                        });
                        this.updateError = null;
                        this.router.navigate(['/']);
                    },
                    error: (error) => {
                        this.isLoading = false;
                        this.updateError = getHttpErrorMessage(error, 'Error al solicitar la actualización');
                        this.snackBar.open(this.updateError as string, 'Cerrar', { duration: 5000 });
                    }
                });
            } else {
                this.userService.updateUser(this.currentUserId, { email: newEmail }).subscribe({
                    next: () => {
                        this.isLoading = false;
                        this.snackBar.open('Email actualizado exitosamente', 'Cerrar', {
                            duration: 5000
                        });
                        this.updateError = null;
                        this.router.navigate(['/']);
                    },
                    error: (error) => {
                        this.isLoading = false;
                        this.updateError = getHttpErrorMessage(error, 'Error al cargar la información del usuario');
                        this.snackBar.open(
                            `${this.updateError}`,
                            'Cerrar',
                            {
                                duration: 5000
                            }
                        );
                    }
                });
            }
        }
    }

    cancelar(): void {
        this.router.navigate(['/']);
    }
}
