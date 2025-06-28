import { Injectable } from '@angular/core';
import { RegistroTarea } from '../models/registro-tarea.model';
import { RegistroHabito } from '../models/registro-habito.model';
import { Habito } from '../models/habito.model';
import { EstadoAnimoEnergia } from '../models/estado-animo-energia.model';
import { Meta } from '../models/meta.model';
import { InformeMensual } from '../models/informe-mensual.model';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {
  // ---------- TAREAS ----------
  tareasCompletadasPorFecha(registros: RegistroTarea[], fechas: string[]): number[] {
    return fechas.map(fecha =>
      registros.filter(r => r.fecha === fecha && r.completada).length
    );
  }

  porcentajeCumplimientoTareas(registros: RegistroTarea[], fechas: string[]): number {
    const total = registros.filter(r => fechas.includes(r.fecha)).length;
    const completadas = registros.filter(r => fechas.includes(r.fecha) && r.completada).length;
    return total > 0 ? Math.round((completadas / total) * 100) : 0;
  }

  rachaActualTareas(registros: RegistroTarea[], fechas: string[]): number {
    let racha = 0;
    for (let i = fechas.length - 1; i >= 0; i--) {
      const completadasHoy = registros.filter(r => r.fecha === fechas[i] && r.completada).length;
      if (completadasHoy > 0) {
        racha++;
      } else {
        break;
      }
    }
    return racha;
  }

  promedioTareasPorDia(registros: RegistroTarea[], fechas: string[]): number {
    const completadasPorDia = fechas.map(fecha =>
      registros.filter(r => r.fecha === fecha && r.completada).length
    );
    const suma = completadasPorDia.reduce((a, b) => a + b, 0);
    return fechas.length > 0 ? +(suma / fechas.length).toFixed(2) : 0;
  }

  // ---------- HÁBITOS ----------
  habitosCompletadosPorFecha(registros: RegistroHabito[], fechas: string[]): number[] {
    return fechas.map(fecha =>
      registros.filter(r => r.fecha === fecha && r.completado).length
    );
  }

  porcentajeCumplimientoHabitos(registros: RegistroHabito[], fechas: string[]): number {
    const total = registros.filter(r => fechas.includes(r.fecha)).length;
    const completados = registros.filter(r => fechas.includes(r.fecha) && r.completado).length;
    return total > 0 ? Math.round((completados / total) * 100) : 0;
  }

  rachaActualHabito(registros: RegistroHabito[], fechas: string[], habitoId: string): number {
    let racha = 0;
    for (let i = fechas.length - 1; i >= 0; i--) {
      const completadoHoy = registros.find(r => r.fecha === fechas[i] && r.habitoId === habitoId && r.completado);
      if (completadoHoy) {
        racha++;
      } else {
        break;
      }
    }
    return racha;
  }

  promedioHabitosPorDia(registros: RegistroHabito[], fechas: string[]): number {
    const completadosPorDia = fechas.map(fecha =>
      registros.filter(r => r.fecha === fecha && r.completado).length
    );
    const suma = completadosPorDia.reduce((a, b) => a + b, 0);
    return fechas.length > 0 ? +(suma / fechas.length).toFixed(2) : 0;
  }

  progresoMetaHabito(habito: Habito): number {
    if (!habito.rachaActual || !habito.metaRacha) return 0;
    return Math.min(habito.rachaActual / habito.metaRacha, 1);
  }

  // ---------- ESTADO DE ÁNIMO Y ENERGÍA ----------

  promedioAnimoPorFecha(registros: EstadoAnimoEnergia[], fechas: string[]): number[] {
    return fechas.map(fecha => {
      const registrosDia = registros.filter(r => r.fecha === fecha);
      if (registrosDia.length === 0) return 0;
      const suma = registrosDia.reduce((acc, r) => acc + r.estadoAnimo, 0);
      return +(suma / registrosDia.length).toFixed(2);
    });
  }

  promedioAnimoTotal(registros: EstadoAnimoEnergia[], fechas: string[]): number {
    const registrosFiltrados = registros.filter(r => fechas.includes(r.fecha));
    if (registrosFiltrados.length === 0) return 0;
    const suma = registrosFiltrados.reduce((acc, r) => acc + r.estadoAnimo, 0);
    return +(suma / registrosFiltrados.length).toFixed(2);
  }

  promedioEnergiaTotal(registros: EstadoAnimoEnergia[], fechas: string[]): number {
    const registrosFiltrados = registros.filter(r => fechas.includes(r.fecha));
    if (registrosFiltrados.length === 0) return 0;
    const suma = registrosFiltrados.reduce((acc, r) => acc + r.nivelEnergia, 0);
    return +(suma / registrosFiltrados.length).toFixed(2);
  }

  mejorDiaAnimo(registros: EstadoAnimoEnergia[]): EstadoAnimoEnergia | null {
    if (registros.length === 0) return null;
    return registros.reduce((prev, curr) => (curr.estadoAnimo > prev.estadoAnimo ? curr : prev));
  }

  peorDiaAnimo(registros: EstadoAnimoEnergia[]): EstadoAnimoEnergia | null {
    if (registros.length === 0) return null;
    return registros.reduce((prev, curr) => (curr.estadoAnimo < prev.estadoAnimo ? curr : prev));
  }

  cantidadDiasPorNivelAnimo(registros: EstadoAnimoEnergia[], niveles: number[]): number[] {
    return niveles.map(nivel =>
      registros.filter(r => r.estadoAnimo === nivel).length
    );
  }

  porcentajeDiasAnimoPositivo(registros: EstadoAnimoEnergia[], umbral: number = 3): number {
    if (registros.length === 0) return 0;
    const positivos = registros.filter(r => r.estadoAnimo > umbral).length;
    return Math.round((positivos / registros.length) * 100);
  }

  rachaDiasAnimoAlto(registros: EstadoAnimoEnergia[], fechas: string[], umbral: number = 3): number {
    let racha = 0;
    for (let i = fechas.length - 1; i >= 0; i--) {
      const registro = registros.find(r => r.fecha === fechas[i]);
      if (registro && registro.estadoAnimo > umbral) {
        racha++;
      } else {
        break;
      }
    }
    return racha;
  }

  // ---------- FECHAS UTILIDAD ----------
  getFechasRango(tipo: 'diario' | 'semanal' | 'mensual'): string[] {
    const hoy = new Date();
    let fechas: string[] = [];
    if (tipo === 'diario') {
      fechas = [this.formatFecha(hoy)];
    } else if (tipo === 'semanal') {
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() - i);
        fechas.push(this.formatFecha(fecha));
      }
    } else if (tipo === 'mensual') {
      for (let i = 29; i >= 0; i--) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() - i);
        fechas.push(this.formatFecha(fecha));
      }
    }
    return fechas;
  }

  private formatFecha(date: Date): string {
    // Devuelve 'YYYY-MM-DD'
    return date.toISOString().slice(0, 10);
  }

  // ---------- METAS ----------

  metasCompletadasEsteMes(metas: Meta[]): number {
    const now = new Date();
    return metas.filter(m =>
      m.estado === 'alcanzada' &&
      m.fechaAlcanzada &&
      this.getMonth(m.fechaAlcanzada) === now.getMonth() &&
      this.getYear(m.fechaAlcanzada) === now.getFullYear()
    ).length;
  }

  porcentajeMetasCompletadas(metas: Meta[]): number {
    if (metas.length === 0) return 0;
    const completadas = metas.filter(m => m.estado === 'alcanzada').length;
    return Math.round((completadas / metas.length) * 100);
  }

  metasActivas(metas: Meta[]): number {
    return metas.filter(m => m.estado === 'enProgreso').length;
  }

  private getMonth(fecha: any): number {
    if (fecha && typeof fecha.toDate === 'function') {
      return fecha.toDate().getMonth();
    }
    return new Date(fecha).getMonth();
  }

  private getYear(fecha: any): number {
    if (fecha && typeof fecha.toDate === 'function') {
      return fecha.toDate().getFullYear();
    }
    return new Date(fecha).getFullYear();
  }

  // ---------- INFORME MENSUAL GENERAL ----------

  calcularInformeMensual(
    userId: string,
    anio: number,
    mes: number,
    tareas: RegistroTarea[],
    habitos: RegistroHabito[],
    metas: Meta[],
    estados: EstadoAnimoEnergia[]
  ): InformeMensual {
    const fechasMes = this.getFechasDelMes(anio, mes);

    // TAREAS
    const tareasMes = tareas.filter(t => fechasMes.includes(t.fecha));
    const tareasCompletadas = tareasMes.filter(t => t.completada).length;
    const totalTareas = tareasMes.length;
    const porcentajeTareas = totalTareas > 0
      ? Math.round((tareasCompletadas / totalTareas) * 100)
      : 0;

    // HÁBITOS
    const habitosMes = habitos.filter(h => fechasMes.includes(h.fecha));
    const habitosCompletados = habitosMes.filter(h => h.completado).length;
    const totalHabitos = habitosMes.length;
    const porcentajeHabitos = totalHabitos > 0
      ? Math.round((habitosCompletados / totalHabitos) * 100)
      : 0;

    // METAS
    const metasCompletadas = metas.filter(m => m.estado === 'alcanzada').length;
    const totalMetas = metas.length;
    const porcentajeMetas = totalMetas > 0
      ? Math.round((metasCompletadas / totalMetas) * 100)
      : 0;

    // ÁNIMO Y ENERGÍA
    const estadosMes = estados.filter(e => fechasMes.includes(e.fecha));
    const promedioAnimo = estadosMes.length > 0
      ? +(estadosMes.reduce((acc, e) => acc + e.estadoAnimo, 0) / estadosMes.length).toFixed(2)
      : 0;
    const promedioEnergia = estadosMes.length > 0
      ? +(estadosMes.reduce((acc, e) => acc + e.nivelEnergia, 0) / estadosMes.length).toFixed(2)
      : 0;

    return {
      userId,
      anio,
      mes,
      tareasCompletadas,
      totalTareas,
      porcentajeTareas,
      habitosCompletados,
      totalHabitos,
      porcentajeHabitos,
      metasCompletadas,
      totalMetas,
      porcentajeMetas,
      promedioAnimo,
      promedioEnergia,
      fechaCreacion: Timestamp.now()
    };
  }

  /**
   * Devuelve un array de fechas (YYYY-MM-DD) para el mes y año indicados.
   */
  getFechasDelMes(anio: number, mes: number): string[] {
    const fechas: string[] = [];
    const date = new Date(anio, mes, 1);
    while (date.getMonth() === mes) {
      fechas.push(this.formatFecha(new Date(date)));
      date.setDate(date.getDate() + 1);
    }
    return fechas;
  }}
