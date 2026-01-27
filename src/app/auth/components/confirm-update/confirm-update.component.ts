import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '@services/users.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-confirm-update',
    templateUrl: './confirm-update.component.html',
    styleUrls: ['./confirm-update.component.sass']
})
export class ConfirmUpdateComponent implements OnInit {
    isLoading = true;
    message = 'Verificando token...';
    isSuccess = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private userService: UserService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        const token = this.route.snapshot.paramMap.get('token');
        if (token) {
            this.confirmUpdate(token);
        } else {
            this.isLoading = false;
            this.message = 'Token no válido';
        }
    }

    confirmUpdate(token: string): void {
        this.userService.confirmUserUpdate(token).subscribe({
            next: () => {
                this.isLoading = false;
                this.isSuccess = true;
                this.message = 'Actualización confirmada exitosamente';
                this.snackBar.open('Datos actualizados correctamente', 'Cerrar', { duration: 5000 });
                setTimeout(() => {
                    this.router.navigate(['/auth/login']);
                }, 3000);
            },
            error: (err) => {
                this.isLoading = false;
                this.isSuccess = false;
                this.message = err.error?.message || 'Error al confirmar la actualización';
            }
        });
    }
}
