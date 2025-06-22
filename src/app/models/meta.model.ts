import { Timestamp } from 'firebase/firestore';

export type EstadoMeta = 'enProgreso' | 'alcanzada' | 'cancelada';

export interface Meta {
  id?: string;
  userId: string;
  titulo: string;
  descripcion?: string;
  fechaCreacion: Timestamp;
  fechaLimite?: Timestamp | null;
  fechaAlcanzada?: Timestamp | null;
  estado: EstadoMeta;
  color?: string;
}
