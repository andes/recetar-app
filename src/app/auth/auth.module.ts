import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxTurnstileModule } from '@shared/ngx-turnstile/ngx-turnstile.module';
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
import { NewUserPharmacistComponent } from './components/new-user-pharmacist/new-user-pharmacist.component';
import { MatSelectModule } from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { NgxTurnstileFormsModule } from '../shared/ngx-turnstile/ngx-turnstile-forms.module';




@NgModule({
  declarations: [
    routingComponents,
    NewUserComponent,
    NewUserPharmacistComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthRoutingModule,
    BrowserModule,
    NgxTurnstileModule,
    NgxTurnstileFormsModule,
    HttpClientModule,
    FlexLayoutModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDatepickerModule
  ],
  providers: [
    AuthService,
    httpInterceptorProvider
  ]
})
export class AuthModule { }

