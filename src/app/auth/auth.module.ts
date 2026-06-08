import { NgModule } from '@angular/core';
import { AuthRoutingModule } from '@auth/auth-routing.module';
import { httpInterceptorProvider } from '@auth/httpInterceptorProvider';
import { AuthService } from '@auth/services/auth.service';

@NgModule({
    imports: [
        AuthRoutingModule
    ],
    providers: [
        AuthService,
        httpInterceptorProvider
    ]
})
export class AuthModule { }

