import { Timestamp } from 'firebase/firestore';

export interface Habito {
  id?: string;
  titulo: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  fechaInicio: Timestamp;
  frecuencia: 'diaria' | 'dias_especificos';
  diasEspecificos?: number[];
  recordatorios: {
    id: string;
    hora: string;
    activo: boolean;
  }[];
  conteoCompletados?: number;
  rachaActual?: number;
  mejorRacha?: number;

  /**
   * Guarda el ID de la meta. Ahora puede ser string o null.
   * null representa explícitamente que no está asociado a ninguna meta.
   */
  metaId?: string | null; // <--- ÚNICO CAMBIO AQUÍ
}
