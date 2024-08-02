import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditUsersFormComponent } from './audit-users-form.component';

describe('UserFormComponent', () => {
  let component: AuditUsersFormComponent;
  let fixture: ComponentFixture<AuditUsersFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AuditUsersFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuditUsersFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
