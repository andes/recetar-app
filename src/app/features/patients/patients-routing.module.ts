import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@auth/guards/auth.guard';
import { PatientManagerGuard } from './guards/patient-manager.guard';
import { PatientEditCanDeactivateGuard } from './guards/patient-edit-can-deactivate.guard';
import { PatientsHomeComponent } from './pages/patients-home/patients-home.component';
import { PatientEditPageComponent } from './pages/patient-edit/patient-edit-page.component';

const routes: Routes = [
    {
        path: 'pacientes',
        component: PatientsHomeComponent,
        canActivate: [AuthGuard, PatientManagerGuard],
    },
    {
        path: 'pacientes/nuevo',
        component: PatientEditPageComponent,
        canActivate: [AuthGuard, PatientManagerGuard],
        canDeactivate: [PatientEditCanDeactivateGuard],
    },
    {
        path: 'pacientes/:id/editar',
        component: PatientEditPageComponent,
        canActivate: [AuthGuard, PatientManagerGuard],
        canDeactivate: [PatientEditCanDeactivateGuard],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PatientsRoutingModule { }

export const routingComponents = [
    PatientsHomeComponent,
    PatientEditPageComponent,
];
