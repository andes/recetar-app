import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '@services/users.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { getHttpErrorMessage } from '@shared/utils/http-error.util';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-confirm-update',
    templateUrl: './confirm-update.component.html',
    styleUrls: ['./confirm-update.component.sass'],
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatProgressSpinnerModule,
        MatIconModule,
        MatButtonModule,
        MatSnackBarModule
    ]
})
export class ConfirmUpdateComponent implements OnInit, OnDestroy {
    isLoading = true;
    message = 'Verificando token...';
    isSuccess = false;
    private destroy$ = new Subject<void>();

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
                timer(3000)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe(() => {
                        this.router.navigate(['/auth/login']);
                    });
            },
            error: (err) => {
                this.isLoading = false;
                this.isSuccess = false;
                this.message = getHttpErrorMessage(err, 'Error al confirmar la actualización');
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
