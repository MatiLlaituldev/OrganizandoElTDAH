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
  recurrencia?: 'unica' | 'diaria'; // <-- CAMPO CLAVE QUE USAREMOS
  subtareas?: Subtarea[];
}
export interface Subtarea {
    id?: string;
    titulo: string;
    // 'completada' se elimina de la plantilla.
    fechaCreacion?: import('firebase/firestore').Timestamp;
    orden?: number;
}
