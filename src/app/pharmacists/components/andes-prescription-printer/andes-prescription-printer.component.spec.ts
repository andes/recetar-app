import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AndesPrescriptionPrinterComponent } from './andes-prescription-printer.component';

describe('AndesPrescriptionPrinterComponent', () => {
  let component: AndesPrescriptionPrinterComponent;
  let fixture: ComponentFixture<AndesPrescriptionPrinterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AndesPrescriptionPrinterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AndesPrescriptionPrinterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
