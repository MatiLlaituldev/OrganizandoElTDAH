// src/app/models/meta.model.ts
import { Timestamp } from 'firebase/firestore';

export type EstadoMeta = 'enProgreso' | 'alcanzada' | 'cancelada'; // Podríamos añadir 'cancelada'

export interface Meta {
  id?: string;                 // ID del documento de Firestore
  userId: string;              // ID del usuario al que pertenece la meta
  titulo: string;              // Título de la meta (obligatorio)
  descripcion?: string;        // Descripción detallada (opcional)
  fechaCreacion: Timestamp;    // Fecha de creación de la meta
  fechaLimite?: Timestamp | null; // Fecha límite para alcanzar la meta (opcional)
  fechaAlcanzada?: Timestamp | null; // Fecha en que se marcó como alcanzada (opcional)
  estado: EstadoMeta;          // Estado actual de la meta (ej: 'enProgreso', 'alcanzada')
  // Consideraciones futuras:
  // - Prioridad?
  // - Color?
  // - Icono?
  // - Tareas asociadas (IDs)? (Para RF15 más avanzado)
  // - Hábitos asociados (IDs)? (Para RF15 más avanzado)
}

// Para RF15, el seguimiento del progreso podría inicialmente ser solo el estado de la meta.
// Si se vuelve más complejo (ej. registrar hitos intermedios), se podría crear un modelo RegMeta
// export interface RegMeta {
//   id?: string;
//   metaId: string;
//   userId: string;
//   fechaRegistro: Timestamp;
//   descripcionProgreso?: string;
//   porcentajeAvance?: number; // 0-100
// }
