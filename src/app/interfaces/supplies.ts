import SnomedConcept from './snomedConcept';

export default interface Supplies {
    _id: string;
    name: string;
    quantity?: string;
    code?: string;
    status?: 'activo' | 'inactivo';
    type?: 'device' | 'nutrition' | string;
    requiresSpecification?: boolean;
    specification?: string;
    snomedConcept?: SnomedConcept;
    supply?: any;
}
