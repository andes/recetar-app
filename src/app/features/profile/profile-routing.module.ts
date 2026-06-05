import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@auth/guards/auth.guard';
import { ProfileHomeComponent } from './pages/profile-home/profile-home.component';
import { SecuritySettingsComponent } from './pages/security-settings/security-settings.component';
import { BiometricSettingsComponent } from './pages/biometric-settings/biometric-settings.component';

const routes: Routes = [
    {
        path: 'perfil',
        component: ProfileHomeComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'perfil/seguridad',
        component: SecuritySettingsComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'perfil/biometria',
        component: BiometricSettingsComponent,
        canActivate: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ProfileRoutingModule { }

export const routingComponents = [
    ProfileHomeComponent,
    SecuritySettingsComponent,
    BiometricSettingsComponent
];
