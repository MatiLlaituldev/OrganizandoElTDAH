import { Timestamp } from 'firebase/firestore';

/**
 * Representa el registro de estado de una tarea recurrente en una fecha específica.
 * Por ejemplo, si una tarea diaria se completó hoy.
 */
export interface RegistroTarea {
  id?: string;            // ID del documento de registro
  tareaId: string;        // ID de la tarea a la que se refiere este registro
  fecha: string;          // Fecha del registro en formato YYYY-MM-DD para consultas fáciles
  completada: boolean;    // Estado de la tarea en esa fecha
  timestamp: Timestamp;   // Fecha y hora exactas del registro
}
