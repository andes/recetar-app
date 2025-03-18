import { Injectable } from '@angular/core';
import { CanActivate, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '@auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleAuditGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router){}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      if (!this.authService.isAuditRole() && this.authService.isPharmacistsRole()) {
        this.router.navigate(['/farmacias/recetas/dispensar']);
        return false;
      } else if (!this.authService.isAuditRole() && this.authService.isProfessionalRole()) {
        this.router.navigate(['/profesionales/recetas/nueva']);
        return false;
      }
      return true;
  }

}
