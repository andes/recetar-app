import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IsSignedInGuard } from '@auth/guards/is-signed-in.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('@auth/auth.component').then(m => m.AuthComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('@auth/components/login/login.component').then(m => m.LoginComponent),
        canActivate: [IsSignedInGuard],
      },
      {
        path: 'reset-password',
        loadComponent: () => import('@auth/components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('@auth/components/forgot/forgot.component').then(m => m.ForgotComponent),
      },
      {
        path: 'recovery-password/:token',
        loadComponent: () => import('@auth/components/recovery-password/recovery-password.component').then(m => m.RecoveryComponent),
      },
      {
        path: 'new-user',
        loadComponent: () => import('@auth/components/new-user/new-user.component').then(m => m.NewUserComponent),
      },
      {
        path: 'new-user-pharmacist',
        loadComponent: () => import('@auth/components/new-user-pharmacist/new-user-pharmacist.component').then(m => m.NewUserPharmacistComponent),
      },
      {
        path: 'confirm-update/:token',
        loadComponent: () => import('@auth/components/confirm-update/confirm-update.component').then(m => m.ConfirmUpdateComponent),
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }


