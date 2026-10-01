import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { PatientEditPageComponent } from '../pages/patient-edit/patient-edit-page.component';

@Injectable({
    providedIn: 'root'
})
export class PatientEditCanDeactivateGuard implements CanDeactivate<PatientEditPageComponent> {
    canDeactivate(component: PatientEditPageComponent): boolean | Observable<boolean> {
        return component.canDeactivate();
    }
}
