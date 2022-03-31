import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
// components
import { AuthComponent } from '@auth/auth.component';
import { LoginComponent } from '@auth/components/login/login.component';
import { ResetPasswordComponent } from '@auth/components/reset-password/reset-password.component';
import { IsSignedInGuard } from '@auth/guards/is-signed-in.guard';
import { DialogComponent } from '@auth/components/dialog/dialog.component';
import { ForgotComponent } from '@auth/components/forgot/forgot.component';
import { RecoveryComponent } from '@auth/components/recovery-password/recovery-password.component';
import { NewUserComponent } from './components/new-user/new-user.component';


const routes: Routes = [
  {
    path: 'auth',
    component: AuthComponent,
    children: [
      {
        path: 'login',
        component: LoginComponent,
        canActivate: [IsSignedInGuard]
      },
      {
        path: 'reset-password',
        component: ResetPasswordComponent,
      },
      {
        path: 'forgot-password',
        component: ForgotComponent,
      },
      {
        path: 'recovery-password/:token',
        component: RecoveryComponent
      },
      {
        path: 'new-user',
        component: NewUserComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }

export const routingComponents = [
  AuthComponent,
  LoginComponent,
  ResetPasswordComponent,
  DialogComponent,
  ForgotComponent,
  RecoveryComponent
];


