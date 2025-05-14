// src/app/models/habito.model.ts

// Importación del tipo Timestamp de Firestore.
import { Timestamp } from 'firebase/firestore'; // Para Firebase v9+ modular

// Interfaz principal para el documento de Hábito.
// Representa la estructura de los datos de un hábito en la subcolección 'habitos' de un usuario.
// Corresponde a los requisitos funcionales RF06, RF11, RF14.
// Versión simplificada para MVP sin metaDiaria.
export interface Habito {
  id?: string;                // ID del documento de Firestore (opcional, se añade después de obtenerlo de la DB).
  titulo: string;             // Nombre o descripción del hábito (ej: "Leer 30 minutos", "Salir a caminar").
  descripcion?: string;       // Detalles adicionales o el propósito del hábito (opcional).
  icono?: string;             // Nombre de un icono (ej: "book-outline", "walk-outline" de Ionicons) o URL a una imagen (opcional).
  color?: string;             // Color hexadecimal para representar visualmente el hábito (ej: "#4CAF50") (opcional).
  frecuenciaTipo: 'diaria' | 'semanal' | 'diasEspecificos' | string; // Define cómo se repite el hábito.
  frecuenciaValor?: number[] | string[]; // Depende de frecuenciaTipo:
                                         // - 'semanal': Array de números [1,3,5] (L,M,V donde 1=Lunes ... 7=Domingo).
                                         // - 'diasEspecificos': Podría ser un array de fechas específicas si es necesario, o días del mes.
                                         // Para 'diaria', este campo podría no ser necesario.
  horaPreferida?: string;     // Hora preferida para realizar/recordar el hábito (ej: "08:00", "15:30") (opcional).
  recordatoriosActivos?: boolean; // Indica si los recordatorios para este hábito están activos (RF11).
  fechaInicio: Timestamp;     // Fecha en que el usuario comenzó a rastrear este hábito.
  rachaActual?: number;       // Número de días consecutivos cumpliendo el hábito (se actualiza programáticamente).
  mejorRacha?: number;        // La racha más larga alcanzada para este hábito.
  // Considera añadir otros campos si los necesitas, por ejemplo:
  // categoria?: string; // Ej: "Salud", "Productividad", "Ejercicio"
}
