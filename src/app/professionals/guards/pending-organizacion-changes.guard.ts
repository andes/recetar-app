import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';

export interface PendingOrganizacionChanges {
    rollbackPendingOrganizacionesOnLeave: () => void;
}

@Injectable({
    providedIn: 'root'
})
export class PendingOrganizacionChangesGuard implements CanDeactivate<PendingOrganizacionChanges> {
    canDeactivate(component: PendingOrganizacionChanges): boolean {
        if (component && component.rollbackPendingOrganizacionesOnLeave) {
            component.rollbackPendingOrganizacionesOnLeave();
        }

        return true;
    }
}
