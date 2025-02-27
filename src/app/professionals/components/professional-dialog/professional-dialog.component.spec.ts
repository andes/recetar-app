import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProfessionalDialogComponent } from './professional-dialog.component';

describe('ProfessionalDialogComponent', () => {
  let component: ProfessionalDialogComponent;
  let fixture: ComponentFixture<ProfessionalDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ProfessionalDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfessionalDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
