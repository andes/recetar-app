import { TestBed } from '@angular/core/testing';

import { RoleProfessionalGuard } from './role-professional.guard';

describe('RoleProfessionalGuard', () => {
    let guard: RoleProfessionalGuard;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        guard = TestBed.inject(RoleProfessionalGuard);
    });

    it('should be created', () => {
        expect(guard).toBeTruthy();
    });
});
