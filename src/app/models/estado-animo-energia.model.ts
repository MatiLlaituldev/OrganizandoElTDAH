import { Timestamp } from 'firebase/firestore';
export interface EstadoAnimoEnergia {
  id?: string;
  fechaRegistro: Timestamp;
  fecha: string; // YYYY-MM-DD
  estadoAnimo: number; // Guardamos el número de la escala
  nivelEnergia: number; // Guardamos el número de la escala
  notas?: string;
}
