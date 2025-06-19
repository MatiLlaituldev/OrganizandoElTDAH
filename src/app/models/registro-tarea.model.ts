import { Timestamp } from 'firebase/firestore';

/**
 * Representa el registro de estado de una tarea (y sus subtareas) en una fecha específica.
 */
export interface RegistroTarea {
  // --- CAMPOS ORIGINALES (SE MANTIENEN INTACTOS) ---
  id?: string;
  tareaId: string;
  fecha: string; // Se mantiene string 'YYYY-MM-DD'
  completada: boolean;
  timestamp: Timestamp; // Se mantiene el timestamp original

  // --- CAMPO AÑADIDO PARA CONSISTENCIA Y SEGURIDAD ---
 // Alineado con el resto de tus modelos

  // --- NUEVA FUNCIONALIDAD (AÑADIDO DE FORMA SEGURA) ---
  // Opcional para no romper documentos existentes.
  estadoSubtareas?: { [subtareaId: string]: boolean };
}
