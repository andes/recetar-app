import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PracticesFormComponent } from './practices-form.component';

describe('PracticesFormComponent', () => {
  let component: PracticesFormComponent;
  let fixture: ComponentFixture<PracticesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PracticesFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PracticesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});