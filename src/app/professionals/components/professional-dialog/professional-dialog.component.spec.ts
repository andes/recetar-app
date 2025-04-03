import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfessionalDialogComponent } from './professional-dialog.component';

describe('ProfessionalDialogComponent', () => {
  let component: ProfessionalDialogComponent;
  let fixture: ComponentFixture<ProfessionalDialogComponent>;

  beforeEach(async(() => {
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
