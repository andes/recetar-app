import { Injectable } from '@angular/core';
import { CanActivate, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '@auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RolePharmacistGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router){}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      if (!this.authService.isPharmacistsRole()) {
        this.router.navigate(['/profesionales/recetas/nueva']);
        return false;
      }
      return true;
  }

}
