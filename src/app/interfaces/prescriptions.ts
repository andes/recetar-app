import Supply from '@interfaces/supplies'
import { Patient } from '@interfaces/patients'

export class Prescriptions {
  _id: string;
  patient: Patient;
  professional: {
    userId: string,
    enrollment: string,
    cuil: string,
    businessName: string,
  };
  dispensedBy?: {
    userId: string,
    cuil: string,
    businessName: string,
  };
  dispensedAt?: Date;
  supplies: Array<{ supply: Supply, quantity: number }>;
  status: string;
  date: Date;

  diagnostic?: string;
  observation?: string;
  createdAt?: Date;
  updatedAt?: Date;
  triple?: boolean;
}
