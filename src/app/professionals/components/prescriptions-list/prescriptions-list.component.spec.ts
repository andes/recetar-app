import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PrescriptionsListComponent } from './prescriptions-list.component';

describe('PrescriptionsListComponent', () => {
  let component: PrescriptionsListComponent;
  let fixture: ComponentFixture<PrescriptionsListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PrescriptionsListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrescriptionsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
