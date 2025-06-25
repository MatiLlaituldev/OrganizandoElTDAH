import { Timestamp, FieldValue } from 'firebase/firestore';

export interface Tarea {
  id?: string;
  titulo: string;
  descripcion?: string;
  fechaCreacion: Timestamp;
  fechaVencimiento?: Timestamp | null;
  completada: boolean;
  fechaCompletada?: Timestamp | null;
  prioridad?: number;
  recordatoriosConfigurados?: Timestamp[];
  userId: string;
  etiquetas?: {
    id: string;
    nombre: string;
    color: string;
  }[];
  recurrencia?: 'unica' | 'diaria';
  subtareas?: Subtarea[];
  eliminada?: boolean;
  metaId?: string | null;
  notificationId?: number;
  fechaRecordatorio?: Date | Timestamp | string;
  notificationIdVencimiento?: number; // <-- Agrega esta línea
}

export interface Subtarea {
  id?: string;
  titulo: string;
  fechaCreacion?: import('firebase/firestore').Timestamp;
  orden?: number;
}
