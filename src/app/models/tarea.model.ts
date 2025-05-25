import { Timestamp } from 'firebase/firestore';

export interface Subtarea {
  id?: string;
  titulo: string;
  completada: boolean;
  fechaCreacion?: Timestamp;
  orden?: number;
}

export interface Tarea {
  id?: string;
  titulo: string;
  descripcion?: string;
  fechaCreacion: Timestamp;
  fechaVencimiento?: Timestamp | null;
  completada: boolean;
  fechaCompletada?: Timestamp | null;
  prioridad?: number;
  etiquetas?: string[];
  recordatoriosConfigurados?: Timestamp[];
}
