// src/app/models/tarea.model.ts

// Importación del tipo Timestamp de Firestore.
// Asegúrate de que esta importación sea la correcta para tu versión de Firebase.
import { Timestamp } from 'firebase/firestore'; // Para Firebase v9+ modular

// Interfaz para los documentos de la Subcolección Subtarea.
// Cada documento de esta subcolección vivirá bajo una Tarea específica.
// Ruta en Firestore: usuarios/{userId}/tareas/{tareaId}/subtareas/{subtareaId}
// Corresponde al requisito funcional RF05 (referenciadas).
export interface Subtarea {
  id?: string;                // ID del documento de Firestore para la subtarea.
  titulo: string;             // Título o descripción de la subtarea.
  completada: boolean;        // Estado de completitud de la subtarea.
  fechaCreacion?: Timestamp;  // Fecha de creación de la subtarea (opcional, pero útil).
  orden?: number;             // Para mantener un orden visual si es necesario (opcional).
}

// Interfaz principal para el documento de Tarea.
// Representa la estructura de los datos de una tarea en la subcolección 'tareas' de un usuario.
// Las subtareas ahora serán una subcolección de cada documento Tarea.
// Corresponde a los requisitos funcionales RF04, RF09, RF11, RF12.
export interface Tarea {
  id?: string;                // ID del documento de Firestore (opcional, se añade después de obtenerlo de la DB).
  titulo: string;             // Título principal de la tarea.
  descripcion?: string;       // Descripción o detalles adicionales de la tarea (opcional).
  fechaCreacion: Timestamp;   // Fecha y hora en que se creó la tarea.
  fechaVencimiento?: Timestamp | null; // Fecha y hora límite para completar la tarea (opcional).
  completada: boolean;        // Indica si la tarea ha sido marcada como completada.
  fechaCompletada?: Timestamp | null; // Fecha y hora en que se completó la tarea (opcional).
  prioridad?: number;         // Nivel de prioridad (ej: 1 para Alta, 2 para Media, 3 para Baja) (opcional).
  etiquetas?: string[];       // Array de nombres de etiquetas personalizadas asignadas a esta tarea (RF09) (opcional).
  recordatoriosConfigurados?: Timestamp[]; // Array de fechas y horas para las notificaciones (RF11) (opcional).
  // El campo subtareas?: Subtarea[]; ha sido eliminado.
  // Las subtareas ahora se gestionarán como una subcolección.
  // Considera añadir otros campos si los necesitas, por ejemplo:
  // color?: string; // Un color para destacar la tarea visualmente.
  // adjuntos?: string[]; // URLs a archivos adjuntos.
  // contadorSubtareas?: number; // Podrías mantener un contador de subtareas si es útil para la UI.
  // contadorSubtareasCompletadas?: number;
}
