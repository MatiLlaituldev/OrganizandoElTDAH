import { Timestamp } from 'firebase/firestore';

export interface Subtarea {
  id?: string;
  titulo: string;
  completada: boolean;
  fechaCreacion?: Timestamp;
  orden?: number;
}

/**
 * Interfaz que representa una Tarea con datos de etiquetas desnormalizados para
 * lecturas eficientes.
 */
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

  // --- CAMPO DE ETIQUETAS MEJORADO ---
  // Guardamos un array de objetos de etiqueta. Esto nos permite mostrar
  // el nombre y el color en la UI sin hacer consultas adicionales a la BD.
  etiquetas?: {
    id: string;
    nombre: string;
    color: string;
  }[];
}
