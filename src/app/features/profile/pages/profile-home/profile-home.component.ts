import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { SidebarItem } from '@shared/components/layout/sidebar/sidebar.component';
import { SidebarService } from '@shared/services/sidebar.service';
import { getHttpErrorMessage } from '@shared/utils/http-error.util';
import { ProfileService } from '../../services/profile.service';
import { User } from '@interfaces/users';

@Component({
    selector: 'app-profile-home',
    templateUrl: './profile-home.component.html',
    styleUrls: ['./profile-home.component.sass'],
    standalone: false
})
export class ProfileHomeComponent implements OnInit, OnDestroy {
    sidebarItems: SidebarItem[] = [];
    profileForm: FormGroup;
    isLoading = false;
    isSaving = false;
    currentUser: User | null = null;
    updateError: string | null = null;
    submitted = false;
    isPharmacist = false;

    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private snackBar: MatSnackBar,
        private profileService: ProfileService,
        private sidebarService: SidebarService
    ) {
        this.profileForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            businessName: ['', [Validators.required, Validators.minLength(3)]],
            username: ['', [Validators.required, Validators.minLength(3)]]
        });
    }

    ngOnInit(): void {
        this.sidebarItems = this.sidebarService.getItems();
        this.isPharmacist = this.profileService.isPharmacist();
        this.loadCurrentUser();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadCurrentUser(): void {
        this.isLoading = true;
        this.profileService.getCurrentUser()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isLoading = false)
            )
            .subscribe({
                next: (user) => {
                    this.currentUser = user;
                    this.profileForm.patchValue({
                        email: user.email || '',
                        businessName: user.businessName || '',
                        username: user.username || ''
                    });
                },
                error: (error) => {
                    const msg = getHttpErrorMessage(error, 'Error al cargar los datos del usuario');
                    this.updateError = msg;
                    this.snackBar.open(msg as string, 'Cerrar', {
                        duration: 5000,
                        panelClass: ['error-snackbar']
                    });
                }
            });
    }

    onSubmit(): void {
        this.submitted = true;

        if (!this.profileForm.valid || this.isSaving) {
            return;
        }

        this.isSaving = true;
        this.updateError = null;

        const formValue = this.profileForm.value;
        const updateData = {
            email: formValue.email,
            businessName: formValue.businessName,
            username: formValue.username
        };

        if (this.isPharmacist) {
            this.profileService.requestProfileUpdate({ email: updateData.email, username: updateData.username })
                .pipe(
                    takeUntil(this.destroy$),
                    finalize(() => this.isSaving = false)
                )
                .subscribe({
                    next: () => {
                        this.snackBar.open('Se ha enviado un correo para confirmar los cambios', 'Cerrar', { duration: 5000 });
                        this.router.navigate(['/dashboard']);
                    },
                    error: (error) => {
                        const msg = getHttpErrorMessage(error, 'Error al actualizar el perfil');
                        this.updateError = msg;
                        this.snackBar.open(msg, 'Cerrar', {
                            duration: 5000,
                            panelClass: ['error-snackbar']
                        });
                    }
                });
        } else {
            this.profileService.updateProfile(updateData)
                .pipe(
                    takeUntil(this.destroy$),
                    finalize(() => this.isSaving = false)
                )
                .subscribe({
                    next: () => {
                        this.snackBar.open('Perfil actualizado exitosamente', 'Cerrar', { duration: 5000 });
                        this.router.navigate(['/dashboard']);
                    },
                    error: (error) => {
                        const msg = getHttpErrorMessage(error, 'Error al actualizar el perfil');
                        this.updateError = msg;
                        this.snackBar.open(msg, 'Cerrar', {
                            duration: 5000,
                            panelClass: ['error-snackbar']
                        });
                    }
                });
        }
    }

    cancel(): void {
        this.router.navigate(['/dashboard']);
    }

    get email(): AbstractControl | null { return this.profileForm.get('email'); }
    get businessName(): AbstractControl | null { return this.profileForm.get('businessName'); }
    get username(): AbstractControl | null { return this.profileForm.get('username'); }
}
