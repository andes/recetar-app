import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrescriptionPrinterComponent } from './prescription-printer.component';

describe('PrescriptionPrinterComponent', () => {
  let component: PrescriptionPrinterComponent;
  let fixture: ComponentFixture<PrescriptionPrinterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrescriptionPrinterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrescriptionPrinterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
