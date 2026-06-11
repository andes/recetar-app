import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AmbitoService } from '../../../auth/services/ambito.service';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.sass'],
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FlexLayoutModule,
        MatToolbarModule,
        MatButtonModule,
        MatMenuModule
    ]
})
export class HeaderComponent implements OnInit {
  isLoggedIn$: Observable<boolean>;
  businessName$: Observable<string>;
  isAuditRole$: Observable<boolean>;
  isOnlyAuditRole$: Observable<boolean>;
  isProfessionalBothRoles$: Observable<boolean>;
  ambito$: Observable<string | null>;
  editProfileLink$: Observable<string>;
  isPharmacist$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private router: Router,
    private ambitoService: AmbitoService,
  ) { }

  ngOnInit(): void {
    this.isLoggedIn$ = this.authService.isLoggedIn;
    this.businessName$ = this.authService.getBusinessName;
    this.isAuditRole$ = this.authService.getIsAudit;
    this.isOnlyAuditRole$ = this.authService.getIsOnlyAudit;
    this.isProfessionalBothRoles$ = this.authService.getIsProfessionalBothRoles;
    this.ambito$ = this.ambitoService.getAmbitoSeleccionado;
    this.isPharmacist$ = this.isLoggedIn$.pipe(
      map(isLoggedIn => isLoggedIn && this.authService.isPharmacistsRole())
    );

    this.editProfileLink$ = this.isLoggedIn$.pipe(
      map(isLoggedIn => {
        if (isLoggedIn && this.authService.isPharmacistsRole()) {
          return '/farmacias/editar-usuario';
        }
        return '/profesionales/editar-usuario';
      })
    );
  }

  logout() {
    this.authService.logout().subscribe(success => {
      if (success) {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
