import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@auth/guards/auth.guard';
// components
import { PharmacistsComponent } from '@pharmacists/pharmacists.component';
import { PharmacistsFormComponent } from '@pharmacists/components/pharmacists-form/pharmacists-form.component';
import { RolePharmacistGuard } from '@auth/guards/role-pharmacist.guard';



const routes: Routes = [
  {
    path: 'farmacias',
    component: PharmacistsComponent,
    canActivate: [AuthGuard, RolePharmacistGuard],
    children: [
      {
        path: 'recetas/dispensar',
        component: PharmacistsFormComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PharmacistsRoutingModule { }

export const routingComponent = [
  PharmacistsComponent,
  PharmacistsFormComponent
]
