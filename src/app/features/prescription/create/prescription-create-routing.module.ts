import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@auth/guards/auth.guard';
import { NewPrescriptionComponent } from './pages/new-prescription/new-prescription.component';
import { MedicationSearchComponent } from './pages/new-prescription/medication-search/medication-search.component';

const routes: Routes = [
    {
        path: 'prescription/new',
        component: NewPrescriptionComponent,
        canActivate: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PrescriptionCreateRoutingModule { }

export const routingComponents = [
    NewPrescriptionComponent,
    MedicationSearchComponent
];
