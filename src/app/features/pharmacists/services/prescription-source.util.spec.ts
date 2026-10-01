import { isAndesPrescription } from './prescription-source.util';
import AndesPrescriptions from '@interfaces/andesPrescriptions';
import { Prescriptions } from '@interfaces/prescriptions';

describe('isAndesPrescription', () => {
    it('detecta una receta de ANDES por su paciente', () => {
        const prescription = {
            _id: 'andes-1',
            paciente: { nombre: 'Ana', apellido: 'Pérez' },
            estadoActual: { tipo: 'vigente' },
        } as unknown as AndesPrescriptions;

        expect(isAndesPrescription(prescription)).toBeTrue();
    });

    it('no confunde una receta local con estadoActual vacío', () => {
        const prescription = {
            _id: 'local-1',
            patient: { firstName: 'Ana', lastName: 'Pérez', sex: 'F' },
            supplies: [],
            status: 'Pendiente',
            date: new Date(),
            estadoActual: {},
            estadoDispensaActual: {},
        } as unknown as Prescriptions;

        expect(isAndesPrescription(prescription)).toBeFalse();
    });
});
