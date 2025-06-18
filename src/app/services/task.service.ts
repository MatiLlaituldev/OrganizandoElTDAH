import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, where, Timestamp, getDocs } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Tarea } from '../models/tarea.model';
import { RegistroTarea } from '../models/registro-tarea.model'; // 1. Importar el nuevo modelo

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private firestore: Firestore = inject(Firestore);

  constructor() { }

  // --- MÉTODOS EXISTENTES (SIN CAMBIOS) ---
  getTasks(userId: string): Observable<Tarea[]> {
    const tasksRef = collection(this.firestore, `usuarios/${userId}/tareas`);
    return collectionData(tasksRef, { idField: 'id' }) as Observable<Tarea[]>;
  }

  agregarTask(userId: string, tarea: Tarea) {
    const tasksRef = collection(this.firestore, `usuarios/${userId}/tareas`);
    return addDoc(tasksRef, tarea);
  }

  actualizarTask(userId: string, taskId: string, data: Partial<Tarea>) {
    const taskDocRef = doc(this.firestore, `usuarios/${userId}/tareas/${taskId}`);
    return updateDoc(taskDocRef, data);
  }

  eliminarTask(userId: string, taskId: string) {
    const taskDocRef = doc(this.firestore, `usuarios/${userId}/tareas/${taskId}`);
    return deleteDoc(taskDocRef);
  }

  // --- NUEVOS MÉTODOS PARA TAREAS RECURRENTES ---

  /**
   * Obtiene todos los registros de tareas para una fecha específica.
   * @param userId ID del usuario.
   * @param fecha La fecha en formato 'YYYY-MM-DD'.
   * @returns Un Observable con un array de los registros de ese día.
   */
  getRegistrosPorDia(userId: string, fecha: string): Observable<RegistroTarea[]> {
    const registrosRef = collection(this.firestore, `usuarios/${userId}/registrosTareas`);
    const q = query(registrosRef, where('fecha', '==', fecha));
    return collectionData(q, { idField: 'id' }) as Observable<RegistroTarea[]>;
  }

  /**
   * Crea o actualiza el registro de una tarea recurrente para un día específico.
   * @param userId ID del usuario.
   * @param tareaId ID de la tarea recurrente.
   * @param fecha La fecha en formato 'YYYY-MM-DD'.
   * @param completada El nuevo estado.
   */
  async registrarEstadoTareaDiaria(userId: string, tareaId: string, fecha: string, completada: boolean) {
    const registrosRef = collection(this.firestore, `usuarios/${userId}/registrosTareas`);
    const q = query(registrosRef, where('fecha', '==', fecha), where('tareaId', '==', tareaId));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // No existe un registro para esta tarea en este día, así que lo creamos.
      const nuevoRegistro: Omit<RegistroTarea, 'id'> = {
        tareaId,
        fecha,
        completada,
        timestamp: Timestamp.now()
      };
      return addDoc(registrosRef, nuevoRegistro);
    } else {
      // Ya existe un registro, así que lo actualizamos.
      const registroDoc = querySnapshot.docs[0];
      return updateDoc(registroDoc.ref, { completada });
    }
  }
}
