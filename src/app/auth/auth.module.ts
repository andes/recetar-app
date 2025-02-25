import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthRoutingModule, routingComponents } from '@auth/auth-routing.module';
import { httpInterceptorProvider } from '@auth/httpInterceptorProvider';
// services
import { AuthService } from '@auth/services/auth.service';
// flex layout module
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DialogComponent } from './components/dialog/dialog.component';
import { NewUserComponent } from './components/new-user/new-user.component';
import { MatSelectModule } from '@angular/material/select';



@NgModule({
  declarations: [
    routingComponents,
    NewUserComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthRoutingModule,
    BrowserModule,
    HttpClientModule,
    FlexLayoutModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  providers: [
    AuthService,
    httpInterceptorProvider
  ]
})
export class AuthModule { }

