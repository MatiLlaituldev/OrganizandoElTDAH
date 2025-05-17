// src/app/services/goal.service.ts
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
  writeBatch, // Para eliminar subcolecciones si fuera necesario en el futuro
  // serverTimestamp // Si quieres que el servidor ponga la fecha de creación/modificación
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Meta, EstadoMeta } from '../models/meta.model'; // Asegúrate que la ruta sea correcta

@Injectable({
  providedIn: 'root'
})
export class GoalService {

  constructor(private firestore: Firestore) { }

  // Obtener todas las metas de un usuario, ordenadas por fecha de creación o estado
  getMetas(userId: string): Observable<Meta[]> {
    if (!userId) {
      console.warn('[GoalService] getMetas: No se proporcionó userId.');
      return of([]);
    }
    const metasCollectionRef = collection(this.firestore, `usuarios/${userId}/metas`) as CollectionReference<Meta>;
    // Podrías ordenar por estado y luego por fecha de creación, por ejemplo:
    // const q = query(metasCollectionRef, orderBy('estado', 'asc'), orderBy('fechaCreacion', 'desc'));
    const q = query(metasCollectionRef, orderBy('fechaCreacion', 'desc'));
    return collectionData(q, { idField: 'id' });
  }

  // Agregar una nueva meta para un usuario
  async agregarMeta(userId: string, metaData: Omit<Meta, 'id' | 'userId' | 'fechaCreacion' | 'estado'>): Promise<DocumentReference<Meta>> {
    if (!userId) {
      return Promise.reject(new Error('User ID es requerido para agregar una meta.'));
    }

    const nuevaMeta: Omit<Meta, 'id'> = {
      ...metaData,
      userId: userId,
      fechaCreacion: Timestamp.now(),
      estado: 'enProgreso', // Estado inicial por defecto
      fechaLimite: metaData.fechaLimite ? Timestamp.fromDate(new Date(metaData.fechaLimite as any)) : null,
      fechaAlcanzada: null
    };

    const metasCollectionRef = collection(this.firestore, `usuarios/${userId}/metas`) as CollectionReference<Meta>;
    return addDoc(metasCollectionRef, nuevaMeta as Meta); // Firestore generará el ID
  }

  // Actualizar una meta existente
  async actualizarMeta(userId: string, metaId: string, metaData: Partial<Meta>): Promise<void> {
    if (!userId || !metaId) {
      return Promise.reject(new Error('User ID y Meta ID son requeridos para actualizar una meta.'));
    }

    // Convertir fechas a Timestamps si vienen como Date o string
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
    // Considerar si se deben eliminar subcolecciones como 'reg_metas' si existieran.
    // Por ahora, para el MVP, solo eliminamos el documento de la meta.
    // const batch = writeBatch(this.firestore);
    // const metaDocRef = doc(this.firestore, `usuarios/${userId}/metas/${metaId}`);
    // batch.delete(metaDocRef);
    // // Lógica para eliminar subcolecciones aquí si es necesario
    // return batch.commit();
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
      // Si se pasa a 'enProgreso' o 'cancelada' desde 'alcanzada', podríamos querer limpiar fechaAlcanzada
      datosActualizar.fechaAlcanzada = null;
    }

    return this.actualizarMeta(userId, metaId, datosActualizar);
  }

  // --- (Opcional para MVP más avanzado) Métodos para RegMeta si se decide usar subcolección ---
  // async agregarRegistroMeta(userId: string, metaId: string, registroData: Omit<RegMeta, 'id' | 'userId' | 'metaId' | 'fechaRegistro'>) { ... }
  // getRegistrosDeMeta(userId: string, metaId: string): Observable<RegMeta[]> { ... }
}
