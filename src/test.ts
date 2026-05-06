// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { DatePipe } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Directive, forwardRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { getTestBed, TestBed, TestModuleMetadata } from '@angular/core/testing';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { PatientNamePipe } from '@shared/pipes/patient-name.pipe';

@Directive({
    selector: 'app-patient-form[formControlName],app-patient-form[formControl],app-patient-form[ngModel]',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockPatientFormValueAccessorDirective),
            multi: true
        }
    ]
})
class MockPatientFormValueAccessorDirective implements ControlValueAccessor {
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
    setDisabledState(): void {}
}

const defaultTestModuleMetadata: TestModuleMetadata = {
    declarations: [
        MockPatientFormValueAccessorDirective
    ],
    imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatSlideToggleModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatPaginatorModule,
        MatSortModule,
        MatTableModule
    ],
    providers: [
        DatePipe,
        PatientNamePipe,
        {
            provide: MAT_DIALOG_DATA,
            useValue: {}
        },
        {
            provide: MatDialogRef,
            useValue: {
                close: jasmine.createSpy('close'),
                afterClosed: () => of(undefined)
            }
        }
    ],
    schemas: [NO_ERRORS_SCHEMA]
};

const originalConfigureTestingModule = TestBed.configureTestingModule.bind(TestBed);

TestBed.configureTestingModule = (moduleDef: TestModuleMetadata = {}) =>
  originalConfigureTestingModule({
    ...moduleDef,
    declarations: [
      ...defaultTestModuleMetadata.declarations!,
      ...(moduleDef.declarations ?? [])
    ],
    imports: [
      ...defaultTestModuleMetadata.imports!,
      ...(moduleDef.imports ?? [])
    ],
    providers: [
      ...defaultTestModuleMetadata.providers!,
      ...(moduleDef.providers ?? [])
    ],
    schemas: [
      ...(moduleDef.schemas ?? []),
      ...defaultTestModuleMetadata.schemas!
    ]
  });

const turnstileMock = {
  render: jasmine.createSpy('turnstile.render').and.returnValue('widget-id'),
  reset: jasmine.createSpy('turnstile.reset'),
  getResponse: jasmine.createSpy('turnstile.getResponse').and.returnValue('token'),
  remove: jasmine.createSpy('turnstile.remove')
};

(window as unknown as { turnstile: typeof turnstileMock }).turnstile = turnstileMock;

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(), {
    teardown: { destroyAfterEach: false }
}
);
