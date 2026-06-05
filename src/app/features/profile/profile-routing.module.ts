import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@auth/guards/auth.guard';
import { ProfileHomeComponent } from './pages/profile-home/profile-home.component';

const routes: Routes = [
    {
        path: 'perfil',
        component: ProfileHomeComponent,
        canActivate: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ProfileRoutingModule { }

export const routingComponents = [
    ProfileHomeComponent
];
