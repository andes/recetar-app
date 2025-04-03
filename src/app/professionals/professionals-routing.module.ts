import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@auth/guards/auth.guard';
// components
import { ProfessionalsComponent } from '@professionals/professionals.component';
import { SupplyComponent } from '@professionals/supply.component';
import { ProfessionalFormComponent } from '@professionals/components/professional-form/professional-form.component';
import { RoleProfessionalGuard } from '@auth/guards/role-professional.guard';
import { ProfessionalDialogComponent } from '@professionals/components/professional-dialog/professional-dialog.component';import { PrescriptionPrinterComponent } from "@professionals/components/prescription-printer/prescription-printer.component";
import { SupplyDialogComponent } from './components/supply-dialog/supply-dialog.component';

const routes: Routes = [
  {
    path: 'profesionales',
    component: ProfessionalsComponent,
    canActivate: [AuthGuard, RoleProfessionalGuard],
    children: [
      {
        path: 'recetas/nueva',
        component: ProfessionalFormComponent
      },
      {
        path: 'productos',
        component: SupplyComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfessionalsRoutingModule { }

export const routingComponents = [
  ProfessionalsComponent,
  ProfessionalFormComponent,
  ProfessionalDialogComponent,
  SupplyDialogComponent,
  PrescriptionPrinterComponent,
  SupplyComponent
]
