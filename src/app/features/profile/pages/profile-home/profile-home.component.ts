import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { SidebarItem } from '@shared/components/layout/sidebar/sidebar.component';
import { SidebarService } from '@shared/services/sidebar.service';
import { NotificationService } from '@shared/services/notification.service';
import { getHttpErrorMessage } from '@shared/utils/http-error.util';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '@auth/services/auth.service';
import { SecurityPinService } from '../../services/security-pin.service';
import { User } from '@interfaces/users';

interface ProfileSection {
    id: 'cuenta' | 'password' | 'pin' | 'organizaciones';
    icon: string;
    label: string;
    description: string;
}

@Component({
    selector: 'app-profile-home',
    templateUrl: './profile-home.component.html',
    styleUrls: ['./profile-home.component.sass'],
    standalone: false
})
export class ProfileHomeComponent implements OnInit, OnDestroy {
    sidebarItems: SidebarItem[] = [];
    isLoading = false;
    currentUser: User | null = null;
    isPharmacist = false;
    isProfessional = false;
    roleLabel = '';
    selected: ProfileSection['id'] = 'cuenta';
    sections: ProfileSection[] = [];
    pinActive: boolean | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        private route: ActivatedRoute,
        private notification: NotificationService,
        private profileService: ProfileService,
        private sidebarService: SidebarService,
        private authService: AuthService,
        private securityPinService: SecurityPinService
    ) { }

    ngOnInit(): void {
        this.sidebarItems = this.sidebarService.getItems();
        this.isPharmacist = this.authService.isPharmacistsRole();
        this.isProfessional = this.authService.isProfessionalRole() || this.authService.isProfessionalPublicRole();
        this.roleLabel = this.authService.getRoleLabel();
        this.buildSections();
        const seccion = this.route.snapshot.queryParamMap.get('seccion');
        if (seccion && this.sections.some(s => s.id === seccion)) {
            this.selected = seccion as ProfileSection['id'];
        }
        this.loadCurrentUser();
        if (this.isProfessional) {
            this.loadPinStatus();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private buildSections(): void {
        const sections: ProfileSection[] = [
            { id: 'cuenta', icon: 'manage_accounts', label: 'Datos de cuenta', description: 'Nombre, usuario y email' },
            { id: 'password', icon: 'lock', label: 'Contraseña', description: 'Cambiá tu acceso' },
        ];
        if (this.isProfessional) {
            sections.push({ id: 'pin', icon: 'pin', label: 'PIN de seguridad', description: 'Protegé tus recetas' });
            sections.push({ id: 'organizaciones', icon: 'corporate_fare', label: 'Organizaciones', description: 'Establecimientos asociados' });
        }
        this.sections = sections;
    }

    selectSection(id: ProfileSection['id']): void {
        this.selected = id;
    }

onAccountSaved(): void {
        this.loadCurrentUser();
    }

    onPinStatusChanged(): void {
        this.loadPinStatus();
    }

    onOrganizationsChanged(): void {
        this.loadCurrentUser();
    }

    private loadCurrentUser(): void {
        if (!this.currentUser) {
            this.isLoading = true;
        }
        this.profileService.getCurrentUser()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isLoading = false)
            )
            .subscribe({
                next: (user) => {
                    this.currentUser = user;
                },
                error: (error) => {
                    const msg = getHttpErrorMessage(error, 'Error al cargar los datos del usuario');
                    this.notification.error(msg);
                }
            });
    }

    private loadPinStatus(): void {
        this.securityPinService.getStatus()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (status) => {
                    this.pinActive = status.isActive;
                },
                error: () => {
                    this.pinActive = false;
                }
            });
    }

get matriculas(): User['profesionGrado'] {
        return this.currentUser?.profesionGrado || [];
    }

    get organizacionesCount(): number {
        return this.currentUser?.organizaciones?.length || 0;
    }

    get pinStatusLabel(): string {
        return this.pinActive ? 'PIN activado' : 'PIN desactivado';
    }

    get pinStatusHint(): string {
        return this.pinActive ? 'Protege tus recetas' : 'Activá tu PIN';
    }

formatVencimiento(value: string | Date): string {
        const date = value instanceof Date ? value : new Date(value);
        if (isNaN(date.getTime())) {
            return String(value);
        }
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${month}/${date.getFullYear()}`;
    }

    vencimientoText(value: string | Date): string {
        const restante = this.vencimientoRestante(value);
        return restante ? `vence en ${restante}` : '';
    }

    vencimientoRestante(value: string | Date): string {
        const months = this.monthsUntil(value);
        if (months < 1) {
            return '';
        }
        const years = Math.floor(months / 12);
        const rest = months % 12;
        if (years === 0) {
            return `${rest} mes${rest === 1 ? '' : 'es'}`;
        }
        const yearText = `${years} año${years === 1 ? '' : 's'}`;
        if (rest === 0) {
            return yearText;
        }
        return `${yearText} y ${rest} mes${rest === 1 ? '' : 'es'}`;
    }

    isNearExpiry(value: string | Date): boolean {
        const months = this.monthsUntil(value);
        return months > 0 && months < 12;
    }

    estadoMatricula(estado?: 'vigente' | 'vencida' | 'suspendida' | 'inhabilitada' | 'baja'): { label: string; variant: 'success' | 'warning' | 'error' } {
        switch (estado) {
            case 'vencida':
                return { label: 'Vencida', variant: 'error' };
            case 'suspendida':
                return { label: 'Suspendida', variant: 'warning' };
            case 'inhabilitada':
                return { label: 'Inhabilitada', variant: 'warning' };
            case 'baja':
                return { label: 'Dada de baja', variant: 'error' };
            case 'vigente':
            default:
                return { label: 'Vigente', variant: 'success' };
        }
    }

    estadoHabilitacion(expiration?: string | Date): { label: string; variant: 'success' | 'error' } {
        if (!expiration) {
            return { label: 'Vigente', variant: 'success' };
        }
        const end = expiration instanceof Date ? expiration : new Date(expiration);
        if (isNaN(end.getTime()) || end.getTime() >= Date.now()) {
            return { label: 'Vigente', variant: 'success' };
        }
        return { label: 'Vencida', variant: 'error' };
    }

    private monthsUntil(value: string | Date): number {
        const end = value instanceof Date ? value : new Date(value);
        if (isNaN(end.getTime())) {
            return -1;
        }
        const now = new Date();
        return (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    }
}
