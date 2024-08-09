import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@auth/guards/auth.guard';
// components
import { AuditComponent } from '@audit/audit.component';
import { AuditFormComponent } from './components/audit-form/audit-form.component';
import { DialogComponent } from '@audit/components/dialog/dialog.component';
import { RoleAuditGuard } from '@auth/guards/role-audit.guard';
import { PrescriptionPrinterComponent } from '@audit/components/prescription-printer/prescription-printer.component';
import { UsersListComponent } from './components/user-list/users-list.component';

const routes: Routes = [
  {
    path: 'audit',
    component: AuditComponent,
    canActivate: [AuthGuard, RoleAuditGuard],
    children: [
      {
        path: 'recetas/auditar',
        component: AuditFormComponent
      },
      {
        path: 'users',
        component: UsersListComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuditRoutingModule { }

export const routingComponent = [
  AuditComponent,
  AuditFormComponent,
  UsersListComponent,
  DialogComponent,
  PrescriptionPrinterComponent
]
