import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@auth/guards/auth.guard';
import { RolePharmacistGuard } from '@auth/guards/role-pharmacist.guard';
import { DispenseHomeComponent } from './pages/dispense-home/dispense-home.component';

const routes: Routes = [
    {
        path: 'dispensar-nuevo',
        component: DispenseHomeComponent,
        canActivate: [AuthGuard, RolePharmacistGuard],
        children: []
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PharmacistsRoutingModule { }

export const routingComponents = [
    DispenseHomeComponent
];
