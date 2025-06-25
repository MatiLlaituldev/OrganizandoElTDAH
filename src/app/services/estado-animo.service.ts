import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentReference,
  collectionData,
  doc,
  getDocs,
  limit,
  setDoc
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { EstadoAnimoEnergia } from '../models/estado-animo-energia.model';

@Injectable({
  providedIn: 'root'
})
export class EstadoAnimoService {

  constructor(private firestore: Firestore) { }

  private getFechaString(date: Date): string {
    const anio = date.getFullYear();
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const dia = date.getDate().toString().padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private async findRegistroPorFecha(userId: string, fechaStr: string): Promise<DocumentReference | null> {
    const registrosCollectionRef = collection(this.firestore, `usuarios/${userId}/estadosAnimoEnergia`);
    const q = query(
      registrosCollectionRef,
      where('fecha', '==', fechaStr),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].ref;
    }
    return null;
  }

  async guardarRegistroDelDia(userId: string, registroEntrada: Partial<EstadoAnimoEnergia>): Promise<void> {
    if (!userId) {
      console.error('[EstadoAnimoService] guardarRegistroDelDia: User ID es requerido.');
      return Promise.reject(new Error('User ID es requerido.'));
    }

    const fechaHoy = new Date();
    const fechaHoyStr = this.getFechaString(fechaHoy);

    // Objeto base con los datos que SIEMPRE queremos guardar/actualizar
    const datosBase: Partial<EstadoAnimoEnergia> = {
      fechaRegistro: Timestamp.now(),
      fecha: fechaHoyStr,
      estadoAnimo: registroEntrada.estadoAnimo !== undefined ? registroEntrada.estadoAnimo : 3,
      nivelEnergia: registroEntrada.nivelEnergia !== undefined ? registroEntrada.nivelEnergia : 2,
      notas: registroEntrada.notas || '',
      // Campos de notificación, siempre presentes aunque sean false/null
      recordatorioActivo: registroEntrada.recordatorioActivo ?? false,
      horaRecordatorio: registroEntrada.horaRecordatorio ?? null,
      notificationId: registroEntrada.notificationId // <-- acepta undefined o number o null según tu modelo
    };

    const registrosCollectionRef = collection(this.firestore, `usuarios/${userId}/estadosAnimoEnergia`);
    const q = query(
      registrosCollectionRef,
      where('fecha', '==', fechaHoyStr),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Si existe, usa set con merge para actualizar/agregar campos nuevos
      const docRef = querySnapshot.docs[0].ref;
      // @ts-ignore
      return setDoc(docRef, datosBase, { merge: true });
    } else {
      // Si no existe, crea el documento con todos los campos
      await addDoc(registrosCollectionRef, datosBase);
      return;
    }
  }

  getRegistroDelDia(userId: string, fecha: Date): Observable<EstadoAnimoEnergia | null> {
    if (!userId) {
      console.error('[EstadoAnimoService] getRegistroDelDia: User ID es requerido.');
      return of(null);
    }
    const fechaStr = this.getFechaString(fecha);
    const registrosCollectionRef = collection(this.firestore, `usuarios/${userId}/estadosAnimoEnergia`);
    const q = query(
      registrosCollectionRef,
      where('fecha', '==', fechaStr),
      limit(1)
    );

    return collectionData(q, { idField: 'id' }).pipe(
      map(registros => (registros.length > 0 ? registros[0] as EstadoAnimoEnergia : null)),
      take(1)
    );
  }

  getRegistrosPorRango(userId: string, fechaInicio: Date, fechaFin: Date): Observable<EstadoAnimoEnergia[]> {
    if (!userId) {
      console.error('[EstadoAnimoService] getRegistrosPorRango: User ID es requerido.');
      return of([]);
    }

    const fechaInicioStr = this.getFechaString(fechaInicio);
    const fechaFinStr = this.getFechaString(fechaFin);

    const registrosCollectionRef = collection(this.firestore, `usuarios/${userId}/estadosAnimoEnergia`);
    const q = query(
      registrosCollectionRef,
      where('fecha', '>=', fechaInicioStr),
      where('fecha', '<=', fechaFinStr),
      orderBy('fecha', 'asc')
    );

    return collectionData(q, { idField: 'id' }) as Observable<EstadoAnimoEnergia[]>;
  }
}
