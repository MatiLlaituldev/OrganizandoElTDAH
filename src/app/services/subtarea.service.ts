import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, doc, deleteDoc, query, where, collectionData, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Subtarea } from '../models/subtarea.model';

@Injectable({ providedIn: 'root' })
export class SubtareaService {
  private firestore: Firestore = inject(Firestore);

  getSubtareas(userId: string, tareaId: string): Observable<Subtarea[]> {
    const subtareasRef = collection(this.firestore, `usuarios/${userId}/subtareas`);
    const q = query(subtareasRef, where('tareaId', '==', tareaId));
    return collectionData(q, { idField: 'id' }) as Observable<Subtarea[]>;
  }

  agregarSubtarea(userId: string, subtarea: Omit<Subtarea, 'id'>) {
    const subtareasRef = collection(this.firestore, `usuarios/${userId}/subtareas`);
    return addDoc(subtareasRef, { ...subtarea, fechaCreacion: Timestamp.now() });
  }

  actualizarSubtarea(userId: string, subtareaId: string, data: Partial<Subtarea>) {
    const subtareaDoc = doc(this.firestore, `usuarios/${userId}/subtareas/${subtareaId}`);
    return updateDoc(subtareaDoc, data);
  }

  eliminarSubtarea(userId: string, subtareaId: string) {
    const subtareaDoc = doc(this.firestore, `usuarios/${userId}/subtareas/${subtareaId}`);
    return deleteDoc(subtareaDoc);
  }
    getAllSubtareas(userId: string) {
    const subtareasRef = collection(this.firestore, `usuarios/${userId}/subtareas`);
    return collectionData(subtareasRef, { idField: 'id' }) as Observable<Subtarea[]>;
  }
}
