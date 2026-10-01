import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class PatientManagerGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private router: Router,
    ) { }

    canActivate(): boolean | UrlTree {
        const isProfessional = this.authService.isProfessionalRole() || this.authService.isProfessionalPublicRole();
        const isAuditor = this.authService.isAuditRole();
        if (isProfessional || isAuditor) {
            return true;
        }
        if (this.authService.isPharmacistsRole() || this.authService.isPharmacistsPublicRole()) {
            return this.router.createUrlTree(['/dispensar-nuevo']);
        }
        return this.router.createUrlTree(['/dashboard']);
    }
}
