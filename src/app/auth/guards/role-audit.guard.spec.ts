import { TestBed } from '@angular/core/testing';

import { RoleAuditGuard } from './role-audit.guard';

describe('RoleAuditGuard', () => {
  let guard: RoleAuditGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(RoleAuditGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
