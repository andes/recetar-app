import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PrescriptionUndoComponent } from './prescription-undo.component';

describe('PrescriptionUndoComponent', () => {
  let component: PrescriptionUndoComponent;
  let fixture: ComponentFixture<PrescriptionUndoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PrescriptionUndoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrescriptionUndoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
