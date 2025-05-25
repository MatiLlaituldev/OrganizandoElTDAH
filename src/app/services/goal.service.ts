import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  DocumentReference,
  query,
  where,
  orderBy,
  Timestamp,
  CollectionReference,
  writeBatch
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Meta, EstadoMeta } from '../models/meta.model';

@Injectable({
  providedIn: 'root'
})
export class GoalService {

  constructor(private firestore: Firestore) { }

  // Obtener todas las metas de un usuario
  getMetas(userId: string): Observable<Meta[]> {
    if (!userId) {
      console.warn('[GoalService] getMetas: No se proporcionó userId.');
      return of([]);
    }
    const metasCollectionRef = collection(this.firestore, `usuarios/${userId}/metas`) as CollectionReference<Meta>;
    const q = query(metasCollectionRef, orderBy('fechaCreacion', 'desc'));
    return collectionData(q, { idField: 'id' });
  }

  // Agregar una nueva meta
  async agregarMeta(userId: string, metaData: Omit<Meta, 'id' | 'userId' | 'fechaCreacion' | 'estado'>): Promise<DocumentReference<Meta>> {
    if (!userId) {
      return Promise.reject(new Error('User ID es requerido para agregar una meta.'));
    }

    const nuevaMeta: Omit<Meta, 'id'> = {
      ...metaData,
      userId: userId,
      fechaCreacion: Timestamp.now(),
      estado: 'enProgreso',
      fechaLimite: metaData.fechaLimite ? Timestamp.fromDate(new Date(metaData.fechaLimite as any)) : null,
      fechaAlcanzada: null
    };

    const metasCollectionRef = collection(this.firestore, `usuarios/${userId}/metas`) as CollectionReference<Meta>;
    return addDoc(metasCollectionRef, nuevaMeta as Meta);
  }

  // Actualizar una meta existente
  async actualizarMeta(userId: string, metaId: string, metaData: Partial<Meta>): Promise<void> {
    if (!userId || !metaId) {
      return Promise.reject(new Error('User ID y Meta ID son requeridos para actualizar una meta.'));
    }
    if (metaData.fechaLimite && !(metaData.fechaLimite instanceof Timestamp)) {
      metaData.fechaLimite = Timestamp.fromDate(new Date(metaData.fechaLimite as any));
    }
    if (metaData.fechaAlcanzada && !(metaData.fechaAlcanzada instanceof Timestamp)) {
      metaData.fechaAlcanzada = Timestamp.fromDate(new Date(metaData.fechaAlcanzada as any));
    }
    const metaDocRef = doc(this.firestore, `usuarios/${userId}/metas/${metaId}`);
    return updateDoc(metaDocRef, metaData);
  }

  // Eliminar una meta
  async eliminarMeta(userId: string, metaId: string): Promise<void> {
    if (!userId || !metaId) {
      return Promise.reject(new Error('User ID y Meta ID son requeridos para eliminar una meta.'));
    }
    const metaDocRef = doc(this.firestore, `usuarios/${userId}/metas/${metaId}`);
    return deleteDoc(metaDocRef);
  }

  // Actualizar el estado de una meta (ej. marcar como alcanzada)
  async actualizarEstadoMeta(userId: string, metaId: string, nuevoEstado: EstadoMeta): Promise<void> {
    if (!userId || !metaId) {
      return Promise.reject(new Error('User ID y Meta ID son requeridos.'));
    }

    const datosActualizar: Partial<Meta> = {
      estado: nuevoEstado
    };

    if (nuevoEstado === 'alcanzada') {
      datosActualizar.fechaAlcanzada = Timestamp.now();
    } else {
      datosActualizar.fechaAlcanzada = null;
    }

    return this.actualizarMeta(userId, metaId, datosActualizar);
  }

  // Métodos para registros de meta (opcional)
  // async agregarRegistroMeta(...) { ... }
  // getRegistrosDeMeta(...) { ... }
}
