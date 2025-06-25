import { Timestamp } from 'firebase/firestore';

export interface Habito {
  id?: string;
  titulo: string;
  descripcion?: string;
  icono: string;
  color: string;
  frecuenciaTipo: 'diaria' | 'semanal';
  horaPreferida?: string | null;
  recordatoriosActivos?: boolean;
  fechaInicio: Timestamp;
  rachaActual?: number;
  mejorRacha?: number;
  metaId?: string | null;
  metaRacha?: number | null;
  diasSemana?: number[];
}
