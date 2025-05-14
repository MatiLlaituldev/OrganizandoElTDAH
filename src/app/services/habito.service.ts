// src/app/services/habito.service.ts

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
  CollectionReference // Importar CollectionReference
} from '@angular/fire/firestore';
import { Observable, of, firstValueFrom } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { Habito } from '../models/habito.model'; // Asegúrate que la ruta sea correcta
import { RegistroHabito } from '../models/registro-habito.model'; // Asegúrate que la ruta sea correcta

@Injectable({
  providedIn: 'root'
})
export class HabitoService {

  constructor(private firestore: Firestore) { }

  // Obtener todos los hábitos de un usuario, ordenados por título
  getHabitos(userId: string): Observable<Habito[]> {
    if (!userId) {
      console.warn('[HabitoService] getHabitos: No se proporcionó userId.');
      return of([]);
    }
    console.log(`[HabitoService] getHabitos: Solicitando hábitos para userId: ${userId}`);
    // Tipar la CollectionReference aquí
    const habitosCollectionRef = collection(this.firestore, `usuarios/${userId}/habitos`) as CollectionReference<Habito>;
    const q = query(habitosCollectionRef, orderBy('titulo', 'asc'));
    // collectionData ahora inferirá correctamente el tipo de 'q' porque habitosCollectionRef está tipada
    return collectionData(q, { idField: 'id' });
  }

  // Obtener un hábito específico por su ID
  getHabitoById(userId: string, habitoId: string): Observable<Habito | undefined> {
    if (!userId || !habitoId) {
      return of(undefined);
    }
    // Tipar DocumentReference aquí
    const habitoDocRef = doc(this.firestore, `usuarios/${userId}/habitos/${habitoId}`) as DocumentReference<Habito>;
    return docData(habitoDocRef, { idField: 'id' });
  }

  // Agregar un nuevo hábito para un usuario
  async agregarHabito(userId: string, habitoData: Habito): Promise<DocumentReference<Habito>> {
    if (!userId) {
      return Promise.reject(new Error('User ID es requerido para agregar un hábito.'));
    }
    // Asegurar que fechaInicio es un Timestamp de Firestore
    if (habitoData.fechaInicio && !(habitoData.fechaInicio instanceof Timestamp)) {
        habitoData.fechaInicio = Timestamp.fromDate(new Date(habitoData.fechaInicio as any));
    } else if (!habitoData.fechaInicio) { // Si no se provee, poner la actual
        habitoData.fechaInicio = Timestamp.now();
    }

    const habitosCollectionRef = collection(this.firestore, `usuarios/${userId}/habitos`) as CollectionReference<Habito>;
    // No es necesario 'as any' si habitoData es del tipo correcto y la referencia de colección está tipada
    return addDoc(habitosCollectionRef, habitoData);
  }

  // Actualizar un hábito existente
  async actualizarHabito(userId: string, habitoId: string, habitoData: Partial<Habito>): Promise<void> {
    if (!userId || !habitoId) {
      return Promise.reject(new Error('User ID y Habito ID son requeridos para actualizar un hábito.'));
    }
    // Asegurar que cualquier fecha que se actualice sea Timestamp si se provee
    if (habitoData.fechaInicio && !(habitoData.fechaInicio instanceof Timestamp)) {
        habitoData.fechaInicio = Timestamp.fromDate(new Date(habitoData.fechaInicio as any));
    }

    const habitoDocRef = doc(this.firestore, `usuarios/${userId}/habitos/${habitoId}`) as DocumentReference<Habito>;
    // Para updateDoc, el segundo argumento es Partial<Habito>.
    // Si TypeScript se queja de tipos anidados (como un Timestamp dentro de Partial<Habito>),
    // podrías necesitar castear habitoData a 'any' o ser más específico con los tipos.
    // Por ahora, lo dejamos sin 'as any' para ver si TypeScript lo infiere bien.
    return updateDoc(habitoDocRef, habitoData);
  }

  // Eliminar un hábito
  async eliminarHabito(userId: string, habitoId: string): Promise<void> {
    if (!userId || !habitoId) {
      return Promise.reject(new Error('User ID y Habito ID son requeridos para eliminar un hábito.'));
    }
    // TODO: Implementar lógica para eliminar registrosHabitos asociados si es un requisito.
    const habitoDocRef = doc(this.firestore, `usuarios/${userId}/habitos/${habitoId}`);
    return deleteDoc(habitoDocRef);
  }

  // --- Métodos para Registro de Cumplimiento de Hábitos (RF14) ---

  // Registrar el cumplimiento de un hábito para una fecha específica
  async registrarCumplimientoHabito(userId: string, habitoId: string, fechaString: string /* YYYY-MM-DD */): Promise<DocumentReference<RegistroHabito> | void> {
    if (!userId || !habitoId || !fechaString) {
      return Promise.reject(new Error('User ID, Habito ID y Fecha son requeridos.'));
    }

    // Tipar la CollectionReference aquí
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
      console.log(`[HabitoService] Ya existe un registro para el hábito ${habitoId} en la fecha ${fechaString}. No se creará uno nuevo.`);
      return Promise.resolve();
    }

    const registroData: RegistroHabito = {
      habitoId: habitoId,
      fecha: fechaString,
      completado: true,
      timestampRegistro: Timestamp.now()
      // 'id' no se incluye aquí, Firestore lo genera
    };

    // La CollectionReference ya está tipada, no es necesario 'as any'
    const docRef = await addDoc(registrosHabitosCollectionRef, registroData);
    await this.actualizarRachaHabito(userId, habitoId);
    return docRef; // docRef ya será de tipo DocumentReference<RegistroHabito>
  }

  // Obtener todos los registros de un hábito específico
  getRegistrosDeUnHabito(userId: string, habitoId: string): Observable<RegistroHabito[]> {
    if (!userId || !habitoId) {
      return of([]);
    }
    // Tipar la CollectionReference aquí
    const registrosCollectionRef = collection(this.firestore, `usuarios/${userId}/registrosHabitos`) as CollectionReference<RegistroHabito>;
    const q = query(
      registrosCollectionRef,
      where('habitoId', '==', habitoId),
      orderBy('fecha', 'desc')
    );
    return collectionData(q, { idField: 'id' });
  }

  // Lógica para actualizar la racha de un hábito
  async actualizarRachaHabito(userId: string, habitoId: string): Promise<void> {
    const registros$ = this.getRegistrosDeUnHabito(userId, habitoId);
    const registros = await firstValueFrom(registros$);

    if (!registros || registros.length === 0) {
      await this.actualizarHabito(userId, habitoId, { rachaActual: 0 });
      return;
    }

    registros.sort((a, b) => b.fecha.localeCompare(a.fecha)); // Fecha más reciente primero

    let rachaActual = 0;
    const habitoActualObservable = this.getHabitoById(userId, habitoId);
    const habitoActual = await firstValueFrom(habitoActualObservable);
    let mejorRacha = habitoActual?.mejorRacha || 0;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparaciones de fecha
    let fechaAnteriorConsideradaParaRacha = hoy;

    for (let i = 0; i < registros.length; i++) {
      const registro = registros[i];
      const partesFecha = registro.fecha.split('-');
      const fechaRegistro = new Date(Number(partesFecha[0]), Number(partesFecha[1]) - 1, Number(partesFecha[2]));
      fechaRegistro.setHours(0,0,0,0); // Normalizar a medianoche

      if (i === 0) { // El registro más reciente
        // Si es hoy o ayer y está completado
        if (this.esHoyOAyer(fechaRegistro, hoy) && registro.completado) {
          rachaActual = 1;
          fechaAnteriorConsideradaParaRacha = fechaRegistro;
        } else {
          // Si el registro más reciente no es hoy o ayer, o no está completado, la racha se rompe.
          break;
        }
      } else {
        // Comprobar si el día anterior al registro 'fechaAnteriorConsideradaParaRacha' es igual a 'fechaRegistro'
        const diaEsperado = new Date(fechaAnteriorConsideradaParaRacha);
        diaEsperado.setDate(diaEsperado.getDate() - 1);

        if (this.sonMismaFecha(fechaRegistro, diaEsperado) && registro.completado) {
          rachaActual++;
          fechaAnteriorConsideradaParaRacha = fechaRegistro;
        } else {
          break; // Se rompió la racha
        }
      }
    }

    if (rachaActual > mejorRacha) {
      mejorRacha = rachaActual;
    }

    console.log(`[HabitoService] Actualizando racha para hábito ${habitoId}: Actual ${rachaActual}, Mejor ${mejorRacha}`);
    await this.actualizarHabito(userId, habitoId, { rachaActual, mejorRacha });
  }

  private sonMismaFecha(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  private esHoyOAyer(fechaRegistro: Date, fechaHoy: Date): boolean {
    if (this.sonMismaFecha(fechaRegistro, fechaHoy)) return true; // Es hoy
    const ayer = new Date(fechaHoy);
    ayer.setDate(ayer.getDate() - 1); // Establece a ayer
    return this.sonMismaFecha(fechaRegistro, ayer); // Es ayer
  }
}
