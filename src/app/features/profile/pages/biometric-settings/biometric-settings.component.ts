import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { SidebarItem } from '@shared/components/layout/sidebar/sidebar.component';
import { SidebarService } from '@shared/services/sidebar.service';
import { getHttpErrorMessage } from '@shared/utils/http-error.util';
import { WebAuthnService } from '../../services/webauthn.service';
import { WebAuthnCredential } from '../../models/webauthn.model';

@Component({
    selector: 'app-biometric-settings',
    templateUrl: './biometric-settings.component.html',
    styleUrls: ['./biometric-settings.component.sass'],
    standalone: false
})
export class BiometricSettingsComponent implements OnInit, OnDestroy {
    sidebarItems: SidebarItem[] = [];

    isWebAuthnSupported = false;
    isPlatformAuthenticatorAvailable = false;
    credentials: WebAuthnCredential[] = [];
    isLoading = false;
    isRegistering = false;
    isDeleting: string | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        private snackBar: MatSnackBar,
        private sidebarService: SidebarService,
        private webAuthnService: WebAuthnService
    ) { }

    ngOnInit(): void {
        this.sidebarItems = this.sidebarService.getItems();
        this.checkWebAuthnSupport();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private checkWebAuthnSupport(): void {
        this.isWebAuthnSupported = this.webAuthnService.isSupported();

        if (this.isWebAuthnSupported) {
            this.webAuthnService.isPlatformAuthenticatorAvailable()
                .pipe(takeUntil(this.destroy$))
                .subscribe(available => {
                    this.isPlatformAuthenticatorAvailable = available;
                    if (available) {
                        this.loadCredentials();
                    }
                });
        }
    }

    private loadCredentials(): void {
        this.isLoading = true;
        this.webAuthnService.getCredentials()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isLoading = false)
            )
            .subscribe({
                next: (credentials) => {
                    this.credentials = credentials;
                },
                error: (error) => {
                    const msg = getHttpErrorMessage(error, 'Error al cargar las credenciales');
                    this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
                }
            });
    }

    registerCredential(): void {
        if (this.isRegistering) {
            return;
        }

        this.isRegistering = true;
        this.webAuthnService.registerCredential()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isRegistering = false)
            )
            .subscribe({
                next: (response) => {
                    this.snackBar.open('Credencial biométrica registrada exitosamente', 'Cerrar', { duration: 5000 });
                    this.loadCredentials();
                },
                error: (error) => {
                    if (error.name === 'NotAllowedError') {
                        this.snackBar.open('Operación cancelada por el usuario', 'Cerrar', { duration: 5000 });
                    } else {
                        const msg = getHttpErrorMessage(error, 'Error al registrar la credencial');
                        this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
                    }
                }
            });
    }

    deleteCredential(credentialId: string): void {
        if (this.isDeleting) {
            return;
        }

        if (!confirm('¿Estás seguro de que deseas eliminar esta credencial biométrica?')) {
            return;
        }

        this.isDeleting = credentialId;
        this.webAuthnService.deleteCredential(credentialId)
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isDeleting = null)
            )
            .subscribe({
                next: () => {
                    this.snackBar.open('Credencial eliminada exitosamente', 'Cerrar', { duration: 5000 });
                    this.loadCredentials();
                },
                error: (error) => {
                    const msg = getHttpErrorMessage(error, 'Error al eliminar la credencial');
                    this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
                }
            });
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getDeviceLabel(deviceType: string): string {
        switch (deviceType) {
            case 'singleDevice':
                return 'Dispositivo local';
            case 'multiDevice':
                return 'Dispositivo sincronizado';
            default:
                return deviceType;
        }
    }
}
