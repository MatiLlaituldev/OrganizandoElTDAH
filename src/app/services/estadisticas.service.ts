import { Injectable } from '@angular/core';
import { RegistroTarea } from '../models/registro-tarea.model';
import { RegistroHabito } from '../models/registro-habito.model';
import { Habito } from '../models/habito.model';

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
}
