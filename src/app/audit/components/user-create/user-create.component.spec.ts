import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { UserCreateComponent } from './user-create.component';

describe('UserCreateComponent', () => {
  let component: UserCreateComponent;
  let fixture: ComponentFixture<UserCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserCreateComponent ],
      imports: [
        ReactiveFormsModule,
        MatSnackBarModule,
        NoopAnimationsModule
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with required validators', () => {
    expect(component.userForm.get('businessName')?.hasError('required')).toBeTruthy();
    expect(component.userForm.get('email')?.hasError('required')).toBeTruthy();
    expect(component.userForm.get('roles')?.hasError('required')).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.userForm.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBeFalsy();
  });

  it('should validate CUIL pattern', () => {
    const cuilControl = component.userForm.get('cuil');
    cuilControl?.setValue('123');
    expect(cuilControl?.hasError('pattern')).toBeTruthy();
    
    cuilControl?.setValue('12345678901');
    expect(cuilControl?.hasError('pattern')).toBeFalsy();
  });
});