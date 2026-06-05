import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from '@auth/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { TitleCasePipe } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '@shared/services/theme.service';
import { BreakpointService } from '@shared/services/breakpoint.service';
import { ProfileService } from '@features/profile/services/profile.service';
import { UiUserMenuComponent, UiAvatarComponent, UiIconComponent } from '@shared/ui';
import { User } from '@interfaces/users';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.sass'],
  standalone: true,
    imports: [
        CommonModule,
        TitleCasePipe,
        RouterModule,
    FlexLayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatTooltipModule,
    UiUserMenuComponent,
    UiAvatarComponent,
    UiIconComponent
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;
  @Output() menuClick = new EventEmitter<void>();
  isLoggedIn$: Observable<boolean>;
  businessName$: Observable<string>;
  roleLabel = '';
  roleIcon = 'person';
  userInitials = '';
  userEmail = '';
  username = '';
  matriculaCount = 0;
  menuOpen = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
    private breakpointService: BreakpointService,
    private profileService: ProfileService
  ) { }

  ngOnInit(): void {
    this.isLoggedIn$ = this.authService.isLoggedIn;
    this.businessName$ = this.authService.getBusinessName;

    this.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.roleLabel = this.authService.getRoleLabel();
        this.roleIcon = this.getRoleIcon();
        this.userInitials = this.getInitials();
        this.userEmail = this.authService.getLoggedUserEmail() || '';
        this.username = this.authService.getLoggedUsername();
        this.loadUserInfo();
      } else {
        this.roleLabel = '';
        this.roleIcon = 'person';
        this.userInitials = '';
        this.userEmail = '';
        this.username = '';
        this.matriculaCount = 0;
      }
    });
  }

  private loadUserInfo(): void {
    this.profileService.getCurrentUser()
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (user: User) => {
          this.matriculaCount = this.getMatriculaCount(user);
          if (!this.userEmail && user.email) {
            this.userEmail = user.email;
          }
          if (!this.username && user.username) {
            this.username = user.username;
          }
        },
        error: () => {
          this.matriculaCount = 0;
        }
      });
  }

  private getMatriculaCount(user: User): number {
    if (!user) {
      return 0;
    }
    if (this.authService.isProfessionalRole() || this.authService.isProfessionalPublicRole()) {
      return user.profesionGrado?.length || 0;
    }
    return (user.responsibleDTEnrollment || user.enrollment) ? 1 : 0;
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

  private getRoleIcon(): string {
    if (this.authService.isProfessionalRole() || this.authService.isProfessionalPublicRole()) {
      return 'medical_services';
    }
    if (this.authService.isPharmacistsRole() || this.authService.isPharmacistsPublicRole()) {
      return 'local_pharmacy';
    }
    if (this.authService.isAuditRole()) {
      return 'fact_check';
    }
    return 'person';
  }

  get isDark(): boolean {
    return this.themeService.isDark();
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  get sidebarToggleIcon(): string {
    if (this.breakpointService.isMobile()) {
      return 'menu';
    }
    return this.collapsed ? 'menu' : 'menu_open';
  }

  get sidebarToggleTooltip(): string {
    if (this.breakpointService.isMobile()) {
      return 'Abrir menú';
    }
    return this.collapsed ? 'Expandir menú' : 'Colapsar menú';
  }

  logout() {
    this.authService.logout().pipe(takeUntil(this.destroy$)).subscribe(success => {
      if (success) {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
