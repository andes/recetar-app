import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CanvasComponent } from './canvas.component';

@Component({
    standalone: true,
    imports: [CanvasComponent],
    template: `
        <app-canvas
            [noCard]="noCard"
            [showHeader]="false"
            [showFooter]="false"
            [showSidebar]="false">
            <div class="projected-content">hello</div>
        </app-canvas>
    `
})
class TestHostComponent {
    noCard = false;
}

describe('CanvasComponent', () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;
    let canvasDebug: DebugElement;
    let contentInner: DebugElement;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [TestHostComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        hostFixture = TestBed.createComponent(TestHostComponent);
        host = hostFixture.componentInstance;
        hostFixture.detectChanges();
        canvasDebug = hostFixture.debugElement.query(By.directive(CanvasComponent));
        contentInner = canvasDebug.query(By.css('.canvas-content-inner'));
    });

    it('should create the canvas', () => {
        expect(canvasDebug.componentInstance).toBeTruthy();
    });

    it('renders the mat-card wrapper by default (noCard=false)', () => {
        expect(canvasDebug.query(By.css('mat-card.canvas-card'))).toBeTruthy();
        expect(contentInner.nativeElement.classList.contains('no-card')).toBeFalse();
    });

    it('omits the mat-card wrapper and adds the no-card class when noCard=true', () => {
        host.noCard = true;
        hostFixture.detectChanges();

        expect(canvasDebug.query(By.css('mat-card.canvas-card'))).toBeNull();
        expect(contentInner.nativeElement.classList.contains('no-card')).toBeTrue();
    });

    it('still projects the consumer content in both modes', () => {
        expect(hostFixture.debugElement.query(By.css('.projected-content'))).toBeTruthy();

        host.noCard = true;
        hostFixture.detectChanges();

        expect(hostFixture.debugElement.query(By.css('.projected-content'))).toBeTruthy();
    });

    it('hides the header and footer when those inputs are false', () => {
        expect(hostFixture.debugElement.query(By.css('app-header'))).toBeNull();
        expect(hostFixture.debugElement.query(By.css('app-footer'))).toBeNull();
    });
});
