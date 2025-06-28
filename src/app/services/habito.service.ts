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
  where,
  Timestamp,
  docData,
  CollectionReference
} from '@angular/fire/firestore';
import { Observable, of, firstValueFrom } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { Habito } from '../models/habito.model';
import { RegistroHabito } from '../models/registro-habito.model';

@Injectable({
  providedIn: 'root'
})
export class HabitoService {

  constructor(private firestore: Firestore) { }

  // Obtener todos los hábitos de un usuario
  getHabitos(userId: string): Observable<Habito[]> {
    if (!userId) {
      return of([]);
    }
    const habitosCollectionRef = collection(this.firestore, `usuarios/${userId}/habitos`) as CollectionReference<Habito>;
    const q = query(habitosCollectionRef, orderBy('titulo', 'asc'));
    return collectionData(q, { idField: 'id' });
  }

  // Obtener un hábito por su ID
  getHabitoById(userId: string, habitoId: string): Observable<Habito | undefined> {
    if (!userId || !habitoId) {
      return of(undefined);
    }
    const habitoDocRef = doc(this.firestore, `usuarios/${userId}/habitos/${habitoId}`) as DocumentReference<Habito>;
    return docData(habitoDocRef, { idField: 'id' });
  }

  // Agregar un nuevo hábito
  async agregarHabito(userId: string, habitoData: Habito): Promise<DocumentReference<Habito>> {
    if (!userId) {
      return Promise.reject(new Error('User ID es requerido para agregar un hábito.'));
    }
    if (habitoData.fechaInicio && !(habitoData.fechaInicio instanceof Timestamp)) {
        habitoData.fechaInicio = Timestamp.fromDate(new Date(habitoData.fechaInicio as any));
    } else if (!habitoData.fechaInicio) {
        habitoData.fechaInicio = Timestamp.now();
    }
    const habitosCollectionRef = collection(this.firestore, `usuarios/${userId}/habitos`) as CollectionReference<Habito>;
    return addDoc(habitosCollectionRef, habitoData);
  }

  // Actualizar un hábito existente
  async actualizarHabito(userId: string, habitoId: string, habitoData: Partial<Habito>): Promise<void> {
    if (!userId || !habitoId) {
      return Promise.reject(new Error('User ID y Habito ID son requeridos para actualizar un hábito.'));
    }
    if (habitoData.fechaInicio && !(habitoData.fechaInicio instanceof Timestamp)) {
        habitoData.fechaInicio = Timestamp.fromDate(new Date(habitoData.fechaInicio as any));
    }
    const habitoDocRef = doc(this.firestore, `usuarios/${userId}/habitos/${habitoId}`) as DocumentReference<Habito>;
    return updateDoc(habitoDocRef, habitoData);
  }

  // Eliminar un hábito
  async eliminarHabito(userId: string, habitoId: string): Promise<void> {
    if (!userId || !habitoId) {
      return Promise.reject(new Error('User ID y Habito ID son requeridos para eliminar un hábito.'));
    }
    const habitoDocRef = doc(this.firestore, `usuarios/${userId}/habitos/${habitoId}`);
    return deleteDoc(habitoDocRef);
  }

  // Registrar el cumplimiento de un hábito en una fecha
  async registrarCumplimientoHabito(userId: string, habitoId: string, fechaString: string): Promise<DocumentReference<RegistroHabito> | void> {
    if (!userId || !habitoId || !fechaString) {
      return Promise.reject(new Error('User ID, Habito ID y Fecha son requeridos.'));
    }
    const registrosHabitosCollectionRef = collection(this.firestore, `usuarios/${userId}/registrosHabitos`) as CollectionReference<RegistroHabito>;
    const registrosExistentesQuery = query(
      registrosHabitosCollectionRef,
      where('habitoId', '==', habitoId),
      where('fecha', '==', fechaString)
    );
    const observableRegistros = collectionData(registrosExistentesQuery, { idField: 'id' });
    const snapshot = await firstValueFrom(
        observableRegistros.pipe(
            take(1)
        )
    );
    if (snapshot && snapshot.length > 0) {
      return Promise.resolve();
    }
    const registroData: RegistroHabito = {
      habitoId: habitoId,
      fecha: fechaString,
      completado: true,
      timestampRegistro: Timestamp.now()
    };
    const docRef = await addDoc(registrosHabitosCollectionRef, registroData);
    await this.actualizarRachaHabito(userId, habitoId);
    return docRef;
  }

  // Obtener todos los registros de cumplimiento de un hábito
  getRegistrosDeUnHabito(userId: string, habitoId: string): Observable<RegistroHabito[]> {
    if (!userId || !habitoId) {
      return of([]);
    }
    const registrosCollectionRef = collection(this.firestore, `usuarios/${userId}/registrosHabitos`) as CollectionReference<RegistroHabito>;
    const q = query(
      registrosCollectionRef,
      where('habitoId', '==', habitoId),
      orderBy('fecha', 'desc')
    );
    return collectionData(q, { idField: 'id' });
  }

  // Obtener todos los registros de hábitos de un usuario
  getTodosRegistrosHabitos(userId: string): Observable<RegistroHabito[]> {
    if (!userId) {
      return of([]);
    }
    const registrosCollectionRef = collection(this.firestore, `usuarios/${userId}/registrosHabitos`) as CollectionReference<RegistroHabito>;
    const q = query(registrosCollectionRef, orderBy('fecha', 'desc'));
    return collectionData(q, { idField: 'id' });
  }

  // Actualizar la racha actual y mejor racha de un hábito
  async actualizarRachaHabito(userId: string, habitoId: string): Promise<void> {
    const registros$ = this.getRegistrosDeUnHabito(userId, habitoId);
    const registros = await firstValueFrom(registros$);
    if (!registros || registros.length === 0) {
      await this.actualizarHabito(userId, habitoId, { rachaActual: 0 });
      return;
    }
    registros.sort((a, b) => b.fecha.localeCompare(a.fecha));
    let rachaActual = 0;
    const habitoActualObservable = this.getHabitoById(userId, habitoId);
    const habitoActual = await firstValueFrom(habitoActualObservable);
    let mejorRacha = habitoActual?.mejorRacha || 0;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    let fechaAnteriorConsideradaParaRacha = hoy;
    for (let i = 0; i < registros.length; i++) {
      const registro = registros[i];
      const partesFecha = registro.fecha.split('-');
      const fechaRegistro = new Date(Number(partesFecha[0]), Number(partesFecha[1]) - 1, Number(partesFecha[2]));
      fechaRegistro.setHours(0,0,0,0);
      if (i === 0) {
        if (this.esHoyOAyer(fechaRegistro, hoy) && registro.completado) {
          rachaActual = 1;
          fechaAnteriorConsideradaParaRacha = fechaRegistro;
        } else {
          break;
        }
      } else {
        const diaEsperado = new Date(fechaAnteriorConsideradaParaRacha);
        diaEsperado.setDate(diaEsperado.getDate() - 1);
        if (this.sonMismaFecha(fechaRegistro, diaEsperado) && registro.completado) {
          rachaActual++;
          fechaAnteriorConsideradaParaRacha = fechaRegistro;
        } else {
          break;
        }
      }
    }
    if (rachaActual > mejorRacha) {
      mejorRacha = rachaActual;
    }
    await this.actualizarHabito(userId, habitoId, { rachaActual, mejorRacha });
  }

  // Comparar si dos fechas son iguales (año, mes, día)
  private sonMismaFecha(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  // Verifica si la fecha es hoy o ayer
  private esHoyOAyer(fechaRegistro: Date, fechaHoy: Date): boolean {
    if (this.sonMismaFecha(fechaRegistro, fechaHoy)) return true;
    const ayer = new Date(fechaHoy);
    ayer.setDate(ayer.getDate() - 1);
    return this.sonMismaFecha(fechaRegistro, ayer);
  }
}
