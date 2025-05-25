import { Timestamp } from 'firebase/firestore';

export interface ConfiguracionesUsuario {
  notificacionesTareas?: boolean;
  notificacionesHabitos?: boolean;
  temaOscuro?: boolean;
}

export interface Usuario {
  uid: string;
  nombre: string;
  email: string;
  photoURL?: string | null;
  fechaCreacion: Timestamp;
  configuraciones?: ConfiguracionesUsuario;
  ultimoLogin?: Timestamp;
}
