import { Timestamp } from 'firebase/firestore';

export interface Subtarea {
  id?: string;
  tareaId: string;
  titulo: string;
  completada: boolean;
  fechaCreacion?: Timestamp;
}
