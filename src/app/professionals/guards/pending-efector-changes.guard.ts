import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';

export interface PendingEfectorChanges {
    rollbackPendingEfectoresOnLeave: () => void;
}

@Injectable({
    providedIn: 'root'
})
export class PendingEfectorChangesGuard implements CanDeactivate<PendingEfectorChanges> {
    canDeactivate(component: PendingEfectorChanges): boolean {
        if (component && component.rollbackPendingEfectoresOnLeave) {
            component.rollbackPendingEfectoresOnLeave();
        }

        return true;
    }
}
