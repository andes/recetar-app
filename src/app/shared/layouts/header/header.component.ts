import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { BreakpointService } from '@shared/services/breakpoint.service';
import { AuthService } from '@auth/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '@services/users.service';
import { ThemeService } from '@shared/services/theme.service';

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
    MatMenuModule,
    MatIconModule,
    MatTooltipModule
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() menuClick = new EventEmitter<void>();
  isLoggedIn$: Observable<boolean>;
  businessName$: Observable<string>;
  isProfessionalBothRoles$: Observable<boolean>;
  editProfileLink$: Observable<string>;
  roleLabel = '';
  userInitials = '';
  userMatricula = '';
  menuOpen = false;
  logoPath$: Observable<string>;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private breakpointService: BreakpointService,
    private themeService: ThemeService
  ) { }

  ngOnInit(): void {
    this.isLoggedIn$ = this.authService.isLoggedIn;
    this.businessName$ = this.authService.getBusinessName;
    this.isProfessionalBothRoles$ = this.authService.getIsProfessionalBothRoles;
    this.logoPath$ = this.themeService.isDarkMode$.pipe(
      map(isDark => isDark ? 'assets/logo-light.svg' : 'assets/logo.svg')
    );

    this.editProfileLink$ = this.isLoggedIn$.pipe(
      map(isLoggedIn => {
        if (isLoggedIn && this.authService.isPharmacistsRole()) {
          return '/farmacias/editar-usuario';
        }
        return '/profesionales/editar-usuario';
      })
    );

    this.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.roleLabel = this.authService.getRoleLabel();
        this.userInitials = this.getInitials();

        // Fetch user matrícula/license number
        const userId = this.authService.getLoggedUserId();
        if (userId) {
          this.userService.getUserById(userId).pipe(takeUntil(this.destroy$)).subscribe({
            next: (user) => {
              this.userMatricula = user.enrollment || user.responsibleDTEnrollment || '';
            },
            error: () => { }
          });
        }

      } else {
        this.roleLabel = '';
        this.userInitials = '';
        this.userMatricula = '';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getInitials(): string {
    const name = this.authService.getLoggedBusinessName();
    if (!name) {
      return '';
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  get isMobile(): boolean {
    return this.breakpointService.isMobile();
  }

  toggleMenu(open: boolean): void {
    this.menuOpen = open;
  }

  logout() {
    this.authService.logout().pipe(takeUntil(this.destroy$)).subscribe(success => {
      if (success) {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
