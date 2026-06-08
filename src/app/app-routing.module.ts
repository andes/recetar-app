import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: '/auth/login'
    },
    {
        path: 'certificate/:id',
        loadComponent: () => import('./shared/components/public-certificate/public-certificate.component').then(m => m.PublicCertificateComponent)
    },
    {
        path: 'practice/:id',
        loadComponent: () => import('./shared/components/public-practice/public-practice.component').then(m => m.PublicPracticeComponent)
    },
    { path: '404', loadComponent: () => import('./shared/not-found/not-found.component').then(m => m.NotFoundComponent) },
    { path: '**', redirectTo: '/404' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {})],
    exports: [RouterModule]
})
export class AppRoutingModule { }
