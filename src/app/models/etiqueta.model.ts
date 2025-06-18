import { Timestamp, FieldValue } from '@angular/fire/firestore';

/**
 * Interfaz que representa una Etiqueta (o Tag) como subcolección de un usuario.
 */
export interface Etiqueta {
  id?: string;
  nombre: string;
  color: string;
  fechaCreacion: Timestamp | FieldValue;
  // El campo userId ya no es necesario aquí.
}
