import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PharmacistsComponent } from './pharmacists.component';

describe('PharmacistsComponent', () => {
  let component: PharmacistsComponent;
  let fixture: ComponentFixture<PharmacistsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PharmacistsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PharmacistsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
