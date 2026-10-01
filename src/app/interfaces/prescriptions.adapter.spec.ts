import { PrescriptionsAdapter } from './prescriptions';

describe('PrescriptionsAdapter', () => {
    const adapter = new PrescriptionsAdapter();

    const baseRecord = {
        _id: 'rx-1',
        patient: { firstName: 'Ana', lastName: 'Pérez', dni: '12345678', sex: 'F' },
        professional: { userId: 'u1', businessName: 'Dr. Gómez' },
        supplies: [],
        status: 'Pendiente',
        date: new Date().toISOString(),
    };

    it('mapea los nuevos campos del modelo de receta', () => {
        const result = adapter.adapt({
            ...baseRecord,
            ambito: 'publico',
            tratamientoProlongado: 3,
            treatmentGroupId: 'g1',
            ordenTratamiento: 0,
            estadoActual: { tipo: 'pendiente' },
            estados: [{ tipo: 'pendiente', fecha: new Date().toISOString() }],
            estadoPublicacion: 'pendiente',
        });

        expect(result.ambito).toBe('publico');
        expect(result.tratamientoProlongado).toBe(3);
        expect(result.treatmentGroupId).toBe('g1');
        expect(result.ordenTratamiento).toBe(0);
        expect(result.estadoActual?.tipo).toBe('pendiente');
        expect(result.estados?.length).toBe(1);
        expect(result.estadoPublicacion).toBe('pendiente');
    });

    it('toma el ámbito y orden desde la respuesta aunque falten', () => {
        const result = adapter.adapt({ ...baseRecord });

        expect(result.ambito).toBeUndefined();
        expect(result.ordenTratamiento).toBeUndefined();
        expect(result.status).toBe('Pendiente');
    });

    it('no expone campos de integración (Praxis) en el modelo de app', () => {
        const result = adapter.adapt({
            ...baseRecord,
            syncExterno: { praxis: { estado: 'ok', intentos: 0 } },
            identificadoresExternos: [{ entidad: 'praxis', valor: 'PRAX-1' }],
        }) as unknown as Record<string, unknown>;

        expect(result['syncExterno']).toBeUndefined();
        expect(result['identificadoresExternos']).toBeUndefined();
    });
});
