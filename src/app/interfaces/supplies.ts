export default interface Supplies {
  _id: string;
  code: string;
  status: 'activo' | 'inactivo';
  quantity: string;
  type: 'device' | 'nutrition',
  name: string;
  requiresSpecification: boolean,
  specification?: string
}
