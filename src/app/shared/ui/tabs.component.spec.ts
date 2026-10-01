import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiTabsComponent } from './tabs.component';

describe('UiTabsComponent', () => {
    let fixture: ComponentFixture<UiTabsComponent>;
    let component: UiTabsComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UiTabsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UiTabsComponent);
        component = fixture.componentInstance;
        component.items = [
            { value: 'basic', label: 'Datos básicos', icon: 'person' },
            { value: 'contact', label: 'Contacto', icon: 'email', error: true },
        ];
        component.value = 'basic';
        fixture.detectChanges();
    });

    it('marca la tab activa y emite al seleccionar otra', () => {
        const tabs = fixture.nativeElement.querySelectorAll('.ui-tab') as NodeListOf<HTMLButtonElement>;
        expect(tabs.length).toBe(2);
        expect(tabs[0].classList).toContain('active');
        expect(tabs[0].getAttribute('aria-selected')).toBe('true');

        let emitted = '';
        component.valueChange.subscribe((value) => emitted = value);
        tabs[1].click();

        expect(emitted).toBe('contact');
    });

    it('no emite al presionar la tab activa', () => {
        const tabs = fixture.nativeElement.querySelectorAll('.ui-tab') as NodeListOf<HTMLButtonElement>;
        let emitted = '';
        component.valueChange.subscribe((value) => emitted = value);

        tabs[0].click();

        expect(emitted).toBe('');
    });

    it('usa ancho completo por defecto y compacto cuando stretch es false', () => {
        expect(fixture.nativeElement.querySelector('.ui-tabs').classList).toContain('stretch');

        component.stretch = false;
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.ui-tabs').classList).not.toContain('stretch');
    });

    it('muestra el contador y el error de la tab', () => {
        component.items = [
            { value: 'basic', label: 'Datos básicos', count: 3, error: true },
        ];
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('ui-badge-chip')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('.text-error')).toBeTruthy();
    });
});
