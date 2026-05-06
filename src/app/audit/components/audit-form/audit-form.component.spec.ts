import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AuditFormComponent } from './audit-form.component';

describe('AuditFormComponent', () => {
  let component: AuditFormComponent;
  let fixture: ComponentFixture<AuditFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AuditFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuditFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
