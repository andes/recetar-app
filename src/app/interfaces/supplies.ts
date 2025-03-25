import SnomedConcept from './snomedConcept';
export default interface Supplies {
  snomedConcept: SnomedConcept;
  supply: any;
  quantity: string;
  _id: string;
  name: string;
}
