import { Timestamp } from 'firebase/firestore';
export interface EstadoAnimoEnergia {
  id?: string;
  fechaRegistro: Timestamp;
  fecha: string;
  estadoAnimo: number;
  nivelEnergia: number;
  notas?: string;
  notificationId?: number| null; // <-- Para gestionar la notificación
  recordatorioActivo?: boolean;
  horaRecordatorio?: string | null;
  // <-- Para gestionar la notificación
}
