import { Injectable } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const MOBILE_BREAKPOINT = '(max-width: 768px)';

@Injectable({ providedIn: 'root' })
export class BreakpointService {
    isMobile$: Observable<boolean>;

    constructor(private breakpointObserver: BreakpointObserver) {
        this.isMobile$ = this.breakpointObserver.observe(MOBILE_BREAKPOINT).pipe(
            map(state => state.matches)
        );
    }

    isMobile(): boolean {
        return window.innerWidth <= 768;
    }
}
