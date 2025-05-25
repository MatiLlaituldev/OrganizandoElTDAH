import { Timestamp } from 'firebase/firestore';

export interface Habito {
  id?: string;
  titulo: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  frecuenciaTipo: 'diaria' | 'semanal' | 'diasEspecificos' | string;
  frecuenciaValor?: number[] | string[];
  horaPreferida?: string;
  recordatoriosActivos?: boolean;
  fechaInicio: Timestamp;
  rachaActual?: number;
  mejorRacha?: number;
}
