import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NotFoundComponent } from './shared/not-found/not-found.component';
import { PublicCertificateComponent } from './shared/components/public-certificate/public-certificate.component';
import { PublicPracticeComponent } from './shared/components/public-practice/public-practice.component';

const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: '/auth/login'
    },
    {
        path: 'certificate/:id',
        component: PublicCertificateComponent
    },
    {
        path: 'practice/:id',
        component: PublicPracticeComponent
    },
    { path: '404', component: NotFoundComponent },
    { path: '**', redirectTo: '/404' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
    exports: [RouterModule]
})
export class AppRoutingModule { }

export const routingComponents = [
    NotFoundComponent,
    PublicCertificateComponent,
    PublicPracticeComponent
];
