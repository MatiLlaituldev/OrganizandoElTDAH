// src/app/services/tarea.service.ts
// La clase se llama TaskService, pero los modelos que maneja son Tarea y Subtarea.

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
  orderBy,
  Timestamp,
  docData
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Tarea, Subtarea } from '../models/tarea.model';


@Injectable({
  providedIn: 'root',
})
export class TaskService { // El nombre de la clase del servicio se mantiene como TaskService
  constructor(private firestore: Firestore) {}

  // Obtener todas las tareas de un usuario, ordenadas por fecha de creación
  getTasks(userId: string): Observable<Tarea[]> { // Devuelve Observable<Tarea[]>
    if (!userId) {
      return new Observable<Tarea[]>(observer => observer.next([]));
    }
    const tasksCollectionRef = collection(
      this.firestore,
      `usuarios/${userId}/tareas` // La ruta de la colección en Firestore
    );
    const q = query(tasksCollectionRef, orderBy('fechaCreacion', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Tarea[]>;
  }

  // Obtener una tarea específica por su ID
  getTaskById(userId: string, tareaId: string): Observable<Tarea | undefined> { // Devuelve Observable<Tarea | undefined>
    if (!userId || !tareaId) {
      return new Observable<Tarea | undefined>(observer => observer.next(undefined));
    }
    const taskDocRef = doc(this.firestore, `usuarios/${userId}/tareas/${tareaId}`);
    return docData(taskDocRef, { idField: 'id' }) as Observable<Tarea | undefined>;
  }

  // Agregar una nueva tarea para un usuario
  async agregarTask(userId: string, tareaData: Tarea): Promise<DocumentReference<Tarea>> { // Acepta y devuelve Tarea
    if (!userId) {
      return Promise.reject(new Error('User ID es requerido para agregar una tarea.'));
    }
    // Asegurar que las fechas sean Timestamps de Firestore
    if (tareaData.fechaCreacion && !(tareaData.fechaCreacion instanceof Timestamp)) {
        tareaData.fechaCreacion = Timestamp.fromDate(new Date(tareaData.fechaCreacion as any));
    }
    if (tareaData.fechaVencimiento && !(tareaData.fechaVencimiento instanceof Timestamp) && tareaData.fechaVencimiento !== null) {
        tareaData.fechaVencimiento = Timestamp.fromDate(new Date(tareaData.fechaVencimiento as any));
    } else if (tareaData.fechaVencimiento === null) {
      tareaData.fechaVencimiento = null;
    }

    const tasksCollectionRef = collection(this.firestore, `usuarios/${userId}/tareas`) as any;
    return addDoc(tasksCollectionRef, tareaData);
  }

  // Actualizar una tarea existente
  async actualizarTask(userId: string, tareaId: string, tareaData: Partial<Tarea>): Promise<void> { // Acepta Partial<Tarea>
    if (!userId || !tareaId) {
      return Promise.reject(new Error('User ID y Tarea ID son requeridos para actualizar una tarea.'));
    }
    if (tareaData.fechaVencimiento && !(tareaData.fechaVencimiento instanceof Timestamp) && tareaData.fechaVencimiento !== null) {
        tareaData.fechaVencimiento = Timestamp.fromDate(new Date(tareaData.fechaVencimiento as any));
    } else if (tareaData.fechaVencimiento === null) {
        tareaData.fechaVencimiento = null;
    }

    const taskDocRef = doc(this.firestore, `usuarios/${userId}/tareas/${tareaId}`);
    return updateDoc(taskDocRef, tareaData);
  }

  // Eliminar una tarea
  async eliminarTask(userId: string, tareaId: string): Promise<void> {
    if (!userId || !tareaId) {
      return Promise.reject(new Error('User ID y Tarea ID son requeridos para eliminar una tarea.'));
    }
    const taskDocRef = doc(this.firestore, `usuarios/${userId}/tareas/${tareaId}`);
    return deleteDoc(taskDocRef);
  }

  // Actualizar solo el estado 'completada' de una tarea
  async actualizarEstadoCompletadaTask(userId: string, tareaId: string, completada: boolean): Promise<void> {
    if (!userId || !tareaId) {
      return Promise.reject(new Error('User ID y Tarea ID son requeridos.'));
    }
    const taskDocRef = doc(this.firestore, `usuarios/${userId}/tareas/${tareaId}`);
    const datosActualizar: Partial<Tarea> = { // Usa Partial<Tarea>
        completada: completada
    };
    if (completada) {
        datosActualizar.fechaCompletada = Timestamp.now();
    } else {
        datosActualizar.fechaCompletada = null;
    }
    return updateDoc(taskDocRef, datosActualizar);
  }

  // --- Métodos para Subtareas (Subcolección de Tarea) ---
  // Ruta en Firestore: usuarios/{userId}/tareas/{tareaId}/subtareas/{subtareaId}

  // Obtener subtareas de una tarea específica
  getSubtareas(userId: string, tareaId: string): Observable<Subtarea[]> { // Devuelve Observable<Subtarea[]>
    if (!userId || !tareaId) {
      return new Observable<Subtarea[]>(observer => observer.next([]));
    }
    const subtareasCollectionRef = collection(this.firestore, `usuarios/${userId}/tareas/${tareaId}/subtareas`);
    const q = query(subtareasCollectionRef, orderBy('orden', 'asc')); // Asumiendo que Subtarea tiene 'orden'
    return collectionData(q, { idField: 'id' }) as Observable<Subtarea[]>;
  }

  // Agregar una nueva subtarea
  async agregarSubtarea(userId: string, tareaId: string, subtareaData: Subtarea): Promise<DocumentReference<Subtarea>> { // Acepta y devuelve Subtarea
    if (!userId || !tareaId) {
      return Promise.reject(new Error('User ID y Tarea ID son requeridos para agregar una subtarea.'));
    }
    if (subtareaData.fechaCreacion && !(subtareaData.fechaCreacion instanceof Timestamp)) {
        subtareaData.fechaCreacion = Timestamp.fromDate(new Date(subtareaData.fechaCreacion as any));
    }

    const subtareasCollectionRef = collection(this.firestore, `usuarios/${userId}/tareas/${tareaId}/subtareas`) as any;
    return addDoc(subtareasCollectionRef, subtareaData);
  }

  // Actualizar una subtarea
  async actualizarSubtarea(userId: string, tareaId: string, subtareaId: string, subtareaData: Partial<Subtarea>): Promise<void> { // Acepta Partial<Subtarea>
    if (!userId || !tareaId || !subtareaId) {
      return Promise.reject(new Error('User ID, Tarea ID y Subtarea ID son requeridos.'));
    }
    // CORRECCIÓN: Usar el nombre del parámetro 'tareaId' en lugar de 'taskId'
    const subtareaDocRef = doc(this.firestore, `usuarios/${userId}/tareas/${tareaId}/subtareas/${subtareaId}`);
    return updateDoc(subtareaDocRef, subtareaData);
  }

  // Eliminar una subtarea
  async eliminarSubtarea(userId: string, tareaId: string, subtareaId: string): Promise<void> {
    if (!userId || !tareaId || !subtareaId) {
      return Promise.reject(new Error('User ID, Tarea ID y Subtarea ID son requeridos.'));
    }
    // CORRECCIÓN: Usar el nombre del parámetro 'tareaId' en lugar de 'taskId'
    const subtareaDocRef = doc(this.firestore, `usuarios/${userId}/tareas/${tareaId}/subtareas/${subtareaId}`);
    return deleteDoc(subtareaDocRef);
  }
}
