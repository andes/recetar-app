import SnomedConcept from './snomedConcept';

export default interface Supplies {
  _id: string;
  snomedConcept?: SnomedConcept;
  // supply: any;
  quantity: string;
  type: 'device' | 'nutrition',
  name: string;
  requiresSpecification: boolean,
  specification?: string
}
