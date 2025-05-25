import { Timestamp } from 'firebase/firestore';

export interface RegistroHabito {
  id?: string;
  habitoId: string;
  fecha: string;
  completado: boolean;
  timestampRegistro: Timestamp;
}
