import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@auth/services/auth.service';
import { UserService } from '@services/users.service';

@Component({
    selector: 'app-edit-user-info',
    templateUrl: './edit-user-info.component.html',
    styleUrls: ['./edit-user-info.component.sass']
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
                this.updateError = error.error.mensaje || 'Error al cargar la información del usuario';
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
                    console.log(error);
                    this.isLoading = false;
                    this.updateError = error.error.mensaje || 'Error al cargar la información del usuario';
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

    cancelar(): void {
        this.router.navigate(['/']);
    }
}
