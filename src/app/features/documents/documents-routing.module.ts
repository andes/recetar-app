import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@auth/guards/auth.guard';
import { DocumentsHomeComponent } from './pages/documents-home/documents-home.component';

const routes: Routes = [
    {
        path: 'documentos',
        component: DocumentsHomeComponent,
        canActivate: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DocumentsRoutingModule { }

export const routingComponents = [
    DocumentsHomeComponent
];
