import type { MixedPrescription } from './dispense.service';
import AndesPrescriptions from '@interfaces/andesPrescriptions';

export function isAndesPrescription(prescription: MixedPrescription): prescription is AndesPrescriptions {
    return 'paciente' in prescription && !('patient' in prescription);
}
