import { Patient } from '@interfaces/patients';
import { PatientDetailPanelComponent } from './patient-detail-panel.component';

describe('PatientDetailPanelComponent', () => {
    let component: PatientDetailPanelComponent;

    beforeEach(() => {
        component = new PatientDetailPanelComponent();
    });

    it('oculta el género cuando coincide con el derivado del sexo', () => {
        component.patient = Object.assign(new Patient('Perez', 'Juan', 'Masculino'), {
            genero: 'varon',
        });

        expect(component.generoAutopercibido).toBe('—');
    });

    it('muestra el género autopercibido cuando difiere del sexo', () => {
        component.patient = Object.assign(new Patient('Perez', 'Juan', 'Masculino'), {
            genero: 'mujer',
        });

        expect(component.generoAutopercibido).toBe('Mujer');
    });

    it('oculta el género derivado para sexo Otro', () => {
        component.patient = Object.assign(new Patient('Perez', 'Juan', 'Otro'), {
            genero: 'otro',
        });

        expect(component.generoAutopercibido).toBe('—');
    });
});
