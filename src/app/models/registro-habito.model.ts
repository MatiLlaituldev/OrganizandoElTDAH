// src/app/models/registro-habito.model.ts

// Importación del tipo Timestamp de Firestore.
import { Timestamp } from 'firebase/firestore'; // Para Firebase v9+ modular

// Interfaz para el documento de Registro de Hábito.
// Cada documento representa una instancia en la que un hábito fue marcado como completado en un día específico.
// Esta será una subcolección de 'usuarios': usuarios/{userId}/registrosHabitos/{registroHabitoId}
// Corresponde al requisito funcional RF14.
export interface RegistroHabito {
  id?: string;                // ID del documento de Firestore (opcional, se añade después de obtenerlo de la DB).
  habitoId: string;           // Referencia al ID del documento del hábito (en la subcolección 'habitos' del usuario).
  fecha: string;              // La fecha en que se registró el cumplimiento del hábito (formato YYYY-MM-DD).
                              // Usar un string para la fecha simplifica las consultas por día específico.
  completado: boolean;        // Indica si el hábito se completó ese día (usualmente será 'true' al crear este registro).
  timestampRegistro: Timestamp; // Fecha y hora exactas en que se realizó el registro.
  // Considera si necesitas algún campo adicional, por ejemplo:
  // notas?: string; // Pequeñas notas o reflexiones sobre el cumplimiento de ese día.
  // valorLogrado?: number; // Si en el futuro algunos hábitos tienen metas cuantificables diarias (ej: 5/8 vasos de agua).
                           // Por ahora, para el MVP, lo mantenemos simple.
}
