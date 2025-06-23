import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, getDocs, query, where, Timestamp, orderBy, DocumentReference } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { Tarea, Subtarea } from '../models/tarea.model';
import { RegistroTarea } from '../models/registro-tarea.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private firestore: Firestore = inject(Firestore);

  constructor() { }

  getTasks(userId: string): Observable<Tarea[]> {
    if (!userId) return of([]);
    const tareasCollectionRef = collection(this.firestore, `usuarios/${userId}/tareas`);

    const q = query(
      tareasCollectionRef,
      where('eliminada', '!=', true),
      orderBy('eliminada'),
      orderBy('fechaCreacion', 'desc')
    );

    return collectionData(q, { idField: 'id' }) as Observable<Tarea[]>;
  }

  async agregarTask(userId: string, tareaData: Partial<Tarea>): Promise<DocumentReference> {
    if (!userId) {
      return Promise.reject(new Error('User ID es requerido.'));
    }

    // Manejo seguro de fechaVencimiento
    let fechaVencimiento: Timestamp | null = null;
    if (tareaData.fechaVencimiento) {
      if ((tareaData.fechaVencimiento as any).seconds !== undefined && (tareaData.fechaVencimiento as any).nanoseconds !== undefined) {
        // Es un Timestamp de Firestore
        fechaVencimiento = tareaData.fechaVencimiento as Timestamp;
      } else if (typeof tareaData.fechaVencimiento === 'string') {
        const [year, month, day] = (tareaData.fechaVencimiento as string).split('-').map(Number);
        fechaVencimiento = Timestamp.fromDate(new Date(year, month - 1, day, 12));
      } else if (tareaData.fechaVencimiento instanceof Date) {
        fechaVencimiento = Timestamp.fromDate(tareaData.fechaVencimiento);
      }
    }

    const nuevaTarea: Omit<Tarea, 'id'> = {
      titulo: tareaData.titulo!,
      descripcion: tareaData.descripcion || '',
      prioridad: tareaData.prioridad || 1,
      etiquetas: tareaData.etiquetas || [],
      subtareas: tareaData.subtareas || [],
      metaId: tareaData.metaId || null,
      userId: userId,
      fechaCreacion: Timestamp.now(),
      completada: false,
      eliminada: false,
      fechaVencimiento: fechaVencimiento
    };

    const tasksRef = collection(this.firestore, `usuarios/${userId}/tareas`);
    return addDoc(tasksRef, nuevaTarea as any);
  }

  actualizarTask(userId: string, taskId: string, data: Partial<Tarea>) {
    const taskDocRef = doc(this.firestore, `usuarios/${userId}/tareas/${taskId}`);
    return updateDoc(taskDocRef, data);
  }

  async eliminarTask(userId: string, tareaId: string): Promise<void> {
    const tareaDocRef = doc(this.firestore, `usuarios/${userId}/tareas/${tareaId}`);
    // En lugar de borrar, actualizamos el campo 'eliminada' a true
    return updateDoc(tareaDocRef, {
      eliminada: true
    });
  }

  getRegistrosPorDia(userId: string, fecha: string): Observable<RegistroTarea[]> {
    const registrosRef = collection(this.firestore, `usuarios/${userId}/registrosTareas`);
    const q = query(registrosRef, where('fecha', '==', fecha));
    return collectionData(q, { idField: 'id' }) as Observable<RegistroTarea[]>;
  }

  async registrarEstadoTareaDiaria(userId: string, tareaId: string, fecha: string, completada: boolean) {
    const registrosRef = collection(this.firestore, `usuarios/${userId}/registrosTareas`);
    const q = query(registrosRef, where('fecha', '==', fecha), where('tareaId', '==', tareaId));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      const nuevoRegistro: Omit<RegistroTarea, 'id'> = {
        tareaId,
        fecha,
        completada,
        timestamp: Timestamp.now()
      };
      return addDoc(registrosRef, nuevoRegistro);
    } else {
      const registroDoc = querySnapshot.docs[0];
      return updateDoc(registroDoc.ref, { completada });
    }
  }

  /**
   * Crea o actualiza el estado de una SUBTAREA específica en su registro diario.
   * @param userId ID del usuario.
   * @param tareaId ID de la tarea padre.
   * @param subtarea La subtarea que se está actualizando (necesitamos su ID).
   * @param completada El nuevo estado de la subtarea (true o false).
   * @param fecha La fecha del registro en formato 'YYYY-MM-DD'.
   */
  async registrarEstadoSubtarea(userId: string, tareaId: string, subtarea: Subtarea, completada: boolean, fecha: string) {
    const registrosRef = collection(this.firestore, `usuarios/${userId}/registrosTareas`);
    const q = query(registrosRef, where('fecha', '==', fecha), where('tareaId', '==', tareaId));

    const querySnapshot = await getDocs(q);

    if (!subtarea.id) {
      return Promise.reject('La subtarea no tiene un ID.');
    }

    if (querySnapshot.empty) {
      const nuevoRegistro: Omit<RegistroTarea, 'id'> = {
        tareaId,
        fecha,
        completada: false,
        timestamp: Timestamp.now(),
        estadoSubtareas: {
          [subtarea.id]: completada
        }
      };
      return addDoc(registrosRef, nuevoRegistro);
    } else {
      const registroDoc = querySnapshot.docs[0];
      const campoAActualizar = `estadoSubtareas.${subtarea.id}`;
      return updateDoc(registroDoc.ref, { [campoAActualizar]: completada });
    }
  }
}
