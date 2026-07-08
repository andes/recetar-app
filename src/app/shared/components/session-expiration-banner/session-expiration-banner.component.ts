import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { UserService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-session-expiration-banner',
    templateUrl: './session-expiration-banner.component.html',
    styleUrls: ['./session-expiration-banner.component.sass']
})
export class SessionExpirationBannerComponent implements OnInit, OnDestroy {
    isVisible = true;
    remainingDays = 0;
    // Expiration date: 19 days from 2026-07-8
    targetDate = new Date('2026-07-27T00:00:00');
    username = '';
    email = '';
    private routerSub: Subscription;

    constructor(private router: Router, private authService: AuthService, private userService: UserService) { }

    ngOnInit(): void {
        const today = new Date();
        const diffTime = this.targetDate.getTime() - today.getTime();
        this.remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (this.remainingDays <= 0) {
            this.isVisible = false;
        }

        this.fetchUserData();

        // Re-fetch user data when navigation ends (e.g. returning from edit-user-info)
        this.routerSub = this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            this.fetchUserData();
        });
    }

    fetchUserData(): void {
        this.username = this.authService.getLoggedUsername() || 'usuario';
        const userId = this.authService.getLoggedUserId();

        if (userId) {
            this.userService.getUserById(userId).subscribe({
                next: (user) => {
                    this.email = (user && user.email) ? user.email : (this.authService.getLoggedUserEmail() || 'mail no registrado');
                },
                error: () => {
                    this.email = this.authService.getLoggedUserEmail() || 'mail no registrado';
                }
            });
        } else {
            this.email = this.authService.getLoggedUserEmail() || 'mail no registrado';
        }
    }

    ngOnDestroy(): void {
        if (this.routerSub) {
            this.routerSub.unsubscribe();
        }
    }

    closeBanner(): void {
        this.isVisible = false;
    }

    goToChangePassword(): void {
        this.router.navigate(['/auth/forgot-password']);
    }

    goToEditUser(): void {
        this.router.navigate(['/profesionales/editar-usuario']);
    }

}
