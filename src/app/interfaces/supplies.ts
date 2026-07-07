export default interface Supplies {
  _id: string;
  code: string;
  status: 'activo' | 'inactivo';
  quantity: string;
  type: 'device' | 'nutrition' | 'magistral',
  name: string;
  description?: string;
  requiresSpecification: boolean,
  specification?: string
}
