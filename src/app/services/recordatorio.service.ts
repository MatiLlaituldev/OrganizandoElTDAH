import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, updateDoc, deleteDoc, getDocs } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import {
  Recordatorio,
  NotificacionConfig,
  CATEGORIAS_RECORDATORIO,
  PRIORIDADES_RECORDATORIO,
  RecordatorioHelper
} from '../models/recordatorio.model';

@Injectable({
  providedIn: 'root'
})
export class RecordatorioService {
  private firestore = inject(Firestore);

  constructor(
    private authService: AuthService
  ) {}

  // 🔄 Normaliza cualquier tipo de fecha a Date
  private toDate(fecha: any): Date {
    if (fecha instanceof Date) return fecha;
    if (fecha && typeof fecha.toDate === 'function') return fecha.toDate(); // Firestore Timestamp
    return new Date(fecha); // string o número
  }

  // 📝 CREAR RECORDATORIO CON NOTIFICACIONES
  async crear(recordatorio: Recordatorio): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    recordatorio.userId = user.uid;
    recordatorio.fechaCreacion = new Date();

    // Guardar en Firestore
    const ref = collection(this.firestore, `usuarios/${user.uid}/recordatorios`);
    await addDoc(ref, recordatorio);
  }

  // 📖 OBTENER TODOS LOS RECORDATORIOS
  obtenerRecordatorios(): Observable<Recordatorio[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) return of([]);
        const ref = collection(this.firestore, `usuarios/${user.uid}/recordatorios`);
        return collectionData(ref, { idField: 'id' }) as Observable<Recordatorio[]>;
      })
    );
  }

  // 📖 OBTENER RECORDATORIO POR ID
  obtenerRecordatorio(recordatorioId: string): Observable<Recordatorio | null> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) return of(null);
        const ref = doc(this.firestore, `usuarios/${user.uid}/recordatorios/${recordatorioId}`);
        return docData(ref, { idField: 'id' }) as Observable<Recordatorio>;
      })
    );
  }

  // ✏️ ACTUALIZAR RECORDATORIO
  async actualizar(recordatorioId: string, cambios: Partial<Recordatorio>): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');
    cambios.fechaModificacion = new Date();
    const ref = doc(this.firestore, `usuarios/${user.uid}/recordatorios/${recordatorioId}`);
    await updateDoc(ref, cambios);
  }

  // 🗑️ ELIMINAR RECORDATORIO
  async eliminar(recordatorioId: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');
    const ref = doc(this.firestore, `usuarios/${user.uid}/recordatorios/${recordatorioId}`);
    await deleteDoc(ref);
  }

  // ✅ MARCAR COMO COMPLETADO
  async marcarCompletado(recordatorioId: string, completado: boolean): Promise<void> {
    await this.actualizar(recordatorioId, { completado });
  }

  // 📊 OBTENER ESTADÍSTICAS
  async obtenerEstadisticas(): Promise<{total: number, completados: number, pendientes: number, vencidos: number}> {
    const user = await this.authService.getCurrentUser();
    if (!user) return { total: 0, completados: 0, pendientes: 0, vencidos: 0 };

    const ref = collection(this.firestore, `usuarios/${user.uid}/recordatorios`);
    const snapshot = await getDocs(ref);
    const recordatorios = snapshot.docs.map(doc => doc.data() as Recordatorio);

    const ahora = new Date();
    const vencidos = recordatorios.filter(r =>
      !r.completado && this.toDate(r.fechaHora) < ahora
    ).length;

    return {
      total: recordatorios.length,
      completados: recordatorios.filter(r => r.completado).length,
      pendientes: recordatorios.filter(r => !r.completado).length,
      vencidos
    };
  }

  // 📅 OBTENER RECORDATORIOS DE HOY
  obtenerRecordatoriosHoy(): Observable<Recordatorio[]> {
    return this.obtenerRecordatorios().pipe(
      map(recordatorios => recordatorios.filter(r =>
        RecordatorioHelper.esHoy(this.toDate(r.fechaHora)) && !r.completado
      ))
    );
  }

  // 📅 OBTENER RECORDATORIOS PRÓXIMOS (7 días)
  obtenerRecordatoriosProximos(): Observable<Recordatorio[]> {
    return this.obtenerRecordatorios().pipe(
      map(recordatorios => {
        const ahora = new Date();
        const proximosSieteDias = new Date();
        proximosSieteDias.setDate(ahora.getDate() + 7);

        return recordatorios.filter(r => {
          const fecha = this.toDate(r.fechaHora);
          return fecha > ahora && fecha <= proximosSieteDias && !r.completado;
        }).sort((a, b) => this.toDate(a.fechaHora).getTime() - this.toDate(b.fechaHora).getTime());
      })
    );
  }

  // 📅 OBTENER RECORDATORIOS VENCIDOS
  obtenerRecordatoriosVencidos(): Observable<Recordatorio[]> {
    return this.obtenerRecordatorios().pipe(
      map(recordatorios => {
        const ahora = new Date();
        return recordatorios.filter(r =>
          !r.completado && this.toDate(r.fechaHora) < ahora
        ).sort((a, b) => this.toDate(b.fechaHora).getTime() - this.toDate(a.fechaHora).getTime());
      })
    );
  }

  // 🔍 BUSCAR RECORDATORIOS
  buscarRecordatorios(termino: string): Observable<Recordatorio[]> {
    return this.obtenerRecordatorios().pipe(
      map(recordatorios => {
        const terminoLower = termino.toLowerCase();
        return recordatorios.filter(r =>
          r.titulo.toLowerCase().includes(terminoLower) ||
          r.descripcion?.toLowerCase().includes(terminoLower) ||
          r.etiquetas?.some(tag => tag.toLowerCase().includes(terminoLower))
        );
      })
    );
  }

  // 🏷️ OBTENER RECORDATORIOS POR CATEGORÍA
  obtenerRecordatoriosPorCategoria(categoria: keyof typeof CATEGORIAS_RECORDATORIO): Observable<Recordatorio[]> {
    return this.obtenerRecordatorios().pipe(
      map(recordatorios => recordatorios.filter(r => r.categoria === categoria))
    );
  }

  // 🚩 OBTENER RECORDATORIOS POR PRIORIDAD
  obtenerRecordatoriosPorPrioridad(prioridad: keyof typeof PRIORIDADES_RECORDATORIO): Observable<Recordatorio[]> {
    return this.obtenerRecordatorios().pipe(
      map(recordatorios => recordatorios.filter(r => r.prioridad === prioridad))
    );
  }

  // 📋 DUPLICAR RECORDATORIO
  async duplicar(recordatorioId: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    const ref = doc(this.firestore, `usuarios/${user.uid}/recordatorios/${recordatorioId}`);
    const originalSnap = await docData(ref, { idField: 'id' }).toPromise();
    const original = originalSnap as Recordatorio;

    if (!original || !original.titulo || !original.fechaHora || !original.categoria || !original.prioridad) {
      throw new Error('Recordatorio no encontrado o incompleto');
    }

    const duplicado: Recordatorio = {
      id: undefined,
      userId: user.uid,
      titulo: `${original.titulo} (Copia)`,
      descripcion: original.descripcion || '',
      fechaHora: original.fechaHora,
      categoria: original.categoria,
      prioridad: original.prioridad,
      completado: false,
      fechaCreacion: new Date(),
      fechaModificacion: undefined,
      notificaciones: original.notificaciones?.map((n: NotificacionConfig) => ({
        ...n,
        id: undefined,
        enviado: false,
        fechaEnvio: undefined
      })) || [],
      repetir: original.repetir,
      etiquetas: original.etiquetas,
      notas: original.notas
    };

    const newRef = collection(this.firestore, `usuarios/${user.uid}/recordatorios`);
    await addDoc(newRef, duplicado);
  }

  // 📊 OBTENER ESTADÍSTICAS POR CATEGORÍA
  async obtenerEstadisticasPorCategoria(): Promise<{[key: string]: number}> {
    const user = await this.authService.getCurrentUser();
    if (!user) return {};

    const ref = collection(this.firestore, `usuarios/${user.uid}/recordatorios`);
    const snapshot = await getDocs(ref);
    const recordatorios = snapshot.docs.map(doc => doc.data() as Recordatorio);

    const stats: {[key: string]: number} = {};

    Object.keys(CATEGORIAS_RECORDATORIO).forEach(categoria => {
      stats[categoria] = recordatorios.filter(r => r.categoria === categoria).length;
    });

    return stats;
  }

  // 🔄 PROCESAR RECORDATORIOS REPETITIVOS
  async procesarRepeticiones(): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) return;

    const ref = collection(this.firestore, `usuarios/${user.uid}/recordatorios`);
    const snapshot = await getDocs(ref);

    const recordatoriosRepetitivos = snapshot.docs
      .map((doc: any) => doc.data() as Recordatorio)
      .filter(r => r.repetir && r.repetir.tipo !== 'nunca' && r.completado) || [];

    for (const recordatorio of recordatoriosRepetitivos) {
      if (recordatorio.repetir) {
        console.log('Procesando repetición para:', recordatorio.titulo);
        // Lógica para crear la siguiente instancia del recordatorio
      }
    }
  }
}
