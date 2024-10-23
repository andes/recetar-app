import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacistsFormComponent } from './pharmacists-form.component';

describe('PharmacistsFormComponent', () => {
  let component: PharmacistsFormComponent;
  let fixture: ComponentFixture<PharmacistsFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PharmacistsFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PharmacistsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
