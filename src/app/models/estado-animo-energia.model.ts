// src/app/models/estado-animo-energia.model.ts

// Importación del tipo Timestamp de Firestore.
import { Timestamp } from 'firebase/firestore'; // Para Firebase v9+ modular

// Interfaz para el documento de Estado de Ánimo y Energía.
// Cada documento representa un registro que el usuario hace sobre cómo se siente en un momento dado.
// Esta será una subcolección de 'usuarios': usuarios/{userId}/estadosAnimoEnergia/{estadoId}
// Corresponde a los requisitos funcionales RF07 y RF13.
export interface EstadoAnimoEnergia {
  id?: string;                // ID del documento de Firestore (opcional, se añade después de obtenerlo de la DB).
  fechaRegistro: Timestamp;   // Fecha y hora exactas en que se realizó el registro.
  fecha: string;              // Solo la fecha (formato YYYY-MM-DD) para facilitar las consultas
                              // y agrupaciones por día, semana o mes para las estadísticas (RF13).
  estadoAnimo: string | number; // Puede ser un string descriptivo (ej: "Feliz", "Neutral", "Ansioso")
                              // o un valor numérico si prefieres una escala (ej: 1 al 5).
  nivelEnergia: string | number; // Similar a estadoAnimo, puede ser descriptivo (ej: "Alto", "Medio", "Bajo")
                               // o numérico (ej: 1 al 5).
  notas?: string;             // Espacio para que el usuario añada comentarios o contexto sobre cómo se siente (opcional).
  // Considera añadir otros campos si son relevantes para el seguimiento:
  // actividadPrincipal?: string; // Actividad que estaba realizando o que influyó en su estado.
  // factoresInfluyentes?: string[]; // Ej: ["descanso", "trabajo", "social"]
}
