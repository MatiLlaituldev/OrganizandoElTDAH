import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, where, Timestamp, getDocs, orderBy, DocumentReference } from '@angular/fire/firestore';
import { Observable,of } from 'rxjs';
import { Tarea, Subtarea } from '../models/tarea.model'; // Se añade Subtarea a la importación
import { RegistroTarea } from '../models/registro-tarea.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private firestore: Firestore = inject(Firestore);

  constructor() { }

  // --- MÉTODOS EXISTENTES (SIN CAMBIOS) ---
getTasks(userId: string): Observable<Tarea[]> {
  if (!userId) return of([]);
  const tareasCollectionRef = collection(this.firestore, `usuarios/${userId}/tareas`);

  const q = query(
    tareasCollectionRef,
    where('eliminada', '!=', true), // <-- AÑADE ESTA LÍNEA
    orderBy('eliminada'), // Ordenar por eliminada para que funcione el where
    orderBy('fechaCreacion', 'desc')
  );

  return collectionData(q, { idField: 'id' }) as Observable<Tarea[]>;
}

async agregarTask(userId: string, tareaData: Partial<Tarea>): Promise<DocumentReference> {
  if (!userId) {
    return Promise.reject(new Error('User ID es requerido.'));
  }

  // El servicio construye el objeto Tarea completo y confiable
  const nuevaTarea: Omit<Tarea, 'id'> = {
    titulo: tareaData.titulo!, // El título es obligatorio
    descripcion: tareaData.descripcion || '',
    prioridad: tareaData.prioridad || 1, // Prioridad media por defecto
    etiquetas: tareaData.etiquetas || [],
    subtareas: tareaData.subtareas || [],
    metaId: tareaData.metaId || null,

    // --- El servicio asigna los valores por defecto ---
    userId: userId,
    fechaCreacion: Timestamp.now(),
    completada: false,
    eliminada: false, // <-- ¡Aquí se establece el estado inicial!
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
        // Cuando creemos el registro por primera vez a través de la tarea principal,
        // podríamos inicializar el mapa de subtareas aquí si fuera necesario.
      };
      return addDoc(registrosRef, nuevoRegistro);
    } else {
      const registroDoc = querySnapshot.docs[0];
      return updateDoc(registroDoc.ref, { completada });
    }
  }

  // --- NUEVO MÉTODO PARA GESTIONAR SUBTAREAS ---

  /**
   * Crea o actualiza el estado de una SUBTAREA específica en su registro diario.
   * @param userId ID del usuario.
   * @param tareaId ID de la tarea padre.
   * @param subtarea La subtarea que se está actualizando (necesitamos su ID).
   * @param completada El nuevo estado de la subtarea (true o false).
   * @param fecha La fecha del registro en formato 'YYYY-MM-DD'.
   */
  async registrarEstadoSubtarea(userId: string, tareaId: string, subtarea: Subtarea, completada: boolean, fecha: string) {
    // 1. Apuntamos a la subcolección de registros del usuario.
    const registrosRef = collection(this.firestore, `usuarios/${userId}/registrosTareas`);
    const q = query(registrosRef, where('fecha', '==', fecha), where('tareaId', '==', tareaId));

    const querySnapshot = await getDocs(q);

    if (!subtarea.id) {
      // No podemos actualizar una subtarea sin ID, esto es una guarda de seguridad.
      return Promise.reject('La subtarea no tiene un ID.');
    }

    if (querySnapshot.empty) {
      // 2. Si no existe un registro para la tarea principal en este día, lo creamos.
      const nuevoRegistro: Omit<RegistroTarea, 'id'> = {
        tareaId,
        fecha,
        completada: false, // La tarea principal no se marca como completada automáticamente.
        timestamp: Timestamp.now(),
        // Creamos el mapa de subtareas y establecemos el estado de la actual.
        estadoSubtareas: {
          [subtarea.id]: completada
        }
      };
      return addDoc(registrosRef, nuevoRegistro);
    } else {
      // 3. Si ya existe un registro, actualizamos solo el campo de la subtarea.
      const registroDoc = querySnapshot.docs[0];
      // Usamos la "notación de punto" para actualizar un campo dentro de un mapa en Firestore.
      // La clave del campo debe estar entre corchetes para que se evalúe la variable.
      const campoAActualizar = `estadoSubtareas.${subtarea.id}`;

      return updateDoc(registroDoc.ref, { [campoAActualizar]: completada });
    }
  }
}
