import { TestBed } from '@angular/core/testing';

import { RolePharmacistGuard } from './role-pharmacist.guard';

describe('RolePharmacistGuard', () => {
    let guard: RolePharmacistGuard;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        guard = TestBed.inject(RolePharmacistGuard);
    });

    it('should be created', () => {
        expect(guard).toBeTruthy();
    });
});
