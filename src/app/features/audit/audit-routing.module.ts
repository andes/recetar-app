import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@auth/guards/auth.guard';
import { RoleAuditGuard } from '@auth/guards/role-audit.guard';
import { AuditPrescriptionsComponent } from './pages/audit-prescriptions/audit-prescriptions.component';
import { AuditUsersComponent } from './pages/audit-users/audit-users.component';

const routes: Routes = [
    {
        path: 'audit',
        canActivate: [AuthGuard, RoleAuditGuard],
        children: [
            {
                path: 'recetas/auditar',
                component: AuditPrescriptionsComponent
            },
            {
                path: 'users',
                component: AuditUsersComponent
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AuditRoutingModule { }

export const routingComponents = [
    AuditPrescriptionsComponent,
    AuditUsersComponent
];
