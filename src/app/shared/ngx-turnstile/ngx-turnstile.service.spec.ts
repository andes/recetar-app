import { TestBed } from "@angular/core/testing";
import { NgxTurnstileService } from './ngx-turnstile.service';

describe('NgxTurnstileService', () => {
  let service: NgxTurnstileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxTurnstileService);
  });

  it('shoud be created', () => {
    expect(service).toBeTruthy();
  })
})