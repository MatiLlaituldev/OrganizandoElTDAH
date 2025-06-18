import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  collectionData,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { Etiqueta } from '../models/etiqueta.model';
import { AuthService } from './auth.service';
import { switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EtiquetaService {

  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);

  constructor() { }

  /**
   * Obtiene las etiquetas desde la subcolección del usuario actual.
   */
  getEtiquetas(): Observable<Etiqueta[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) {
          // Si no hay usuario, devuelve un array vacío.
          return of([]);
        }
        // CAMBIO CLAVE: La ruta ahora apunta a la subcolección del usuario.
        const etiquetasPath = `usuarios/${user.uid}/etiquetas`;
        const etiquetasRef = collection(this.firestore, etiquetasPath);

        // La consulta ahora es más simple. No necesita 'where' para el userId.
        // Y como la consulta es simple, no necesitamos un índice compuesto para ordenar.
        const q = query(etiquetasRef, orderBy('fechaCreacion', 'desc'));

        return collectionData(q, { idField: 'id' }) as Observable<Etiqueta[]>;
      })
    );
  }

  /**
   * Crea una nueva etiqueta en la subcolección del usuario actual.
   */
  async addEtiqueta(nombre: string, color: string): Promise<any> {
    const user = await this.authService.getCurrentUser(); // Usamos el método que tienes en tu task-form
    if (!user) {
      throw new Error('Usuario no autenticado. No se puede crear la etiqueta.');
    }

    // CAMBIO CLAVE: Construimos la ruta a la subcolección.
    const etiquetasPath = `usuarios/${user.uid}/etiquetas`;
    const etiquetasRef = collection(this.firestore, etiquetasPath);

    const nuevaEtiqueta: Omit<Etiqueta, 'id'> = {
      nombre,
      color,
      // Ya no es necesario guardar el 'userId' dentro del documento.
      fechaCreacion: serverTimestamp()
    };

    return addDoc(etiquetasRef, nuevaEtiqueta);
  }

  /**
   * Actualiza una etiqueta en la subcolección del usuario.
   */
  async updateEtiqueta(id: string, data: Partial<Etiqueta>): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado.');

    const etiquetaDocRef = doc(this.firestore, `usuarios/${user.uid}/etiquetas/${id}`);
    return updateDoc(etiquetaDocRef, data);
  }

  /**
   * Elimina una etiqueta de la subcolección del usuario.
   */
  async deleteEtiqueta(id: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado.');

    const etiquetaDocRef = doc(this.firestore, `usuarios/${user.uid}/etiquetas/${id}`);
    return deleteDoc(etiquetaDocRef);
  }
}
