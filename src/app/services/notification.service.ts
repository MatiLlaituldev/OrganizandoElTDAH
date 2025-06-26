import { Injectable } from '@angular/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Habito } from '../models/habito.model';
import { Tarea } from '../models/tarea.model';
import { Meta } from '../models/meta.model';
import { Timestamp } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // Solicita permisos al usuario (llama esto antes de programar notificaciones)
  async requestPermission() {
    await LocalNotifications.requestPermissions();
  }

  // Programa una o varias notificaciones (uso interno)
  async scheduleNotification(options: ScheduleOptions) {
    await LocalNotifications.schedule(options);
  }

  // Cancela notificaciones por id
  async cancelNotification(ids: number[]) {
    await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) });
  }

  // Cancela todas las notificaciones locales
  async cancelAll() {
    await LocalNotifications.cancel({ notifications: [] });
  }

  // Obtiene notificaciones pendientes
  async obtenerNotificacionesPendientes() {
    const result = await LocalNotifications.getPending();
    return result.notifications;
  }

  // Convierte string | Date | Timestamp a Date
  private toDateSafe(value: string | Date | Timestamp | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      return value.toDate();
    }
    return null;
  }

  // -------------------------
  // NOTIFICACIONES DE HÁBITOS
  // -------------------------
  async programarNotificacionHabito(habito: Habito, habitoId: string) {
    if (!habito.recordatoriosActivos || !habito.horaPreferida) return;
    await this.requestPermission();

    const [hour, minute] = habito.horaPreferida.split(':').map(Number);
    const now = new Date();
    const hoy = new Date(now);
    hoy.setHours(hour, minute, 0, 0);

    // Notificación única para hoy si la hora aún no ha pasado
    if (hoy > now) {
      await this.scheduleNotification({
        notifications: [{
          id: Math.floor(Math.random() * 1000000),
          title: '¡Recuerda tu hábito!',
          body: `Hoy toca: ${habito.titulo}`,
          schedule: { at: hoy },
          smallIcon: 'ic_stat_icon_config_sample',
          extra: { tipo: 'habito', id: habitoId }
        }]
      });
    }

    // Notificación repetitiva
    if (habito.frecuenciaTipo === 'diaria') {
      await this.scheduleNotification({
        notifications: [{
          id: Math.floor(Math.random() * 1000000),
          title: '¡Recuerda tu hábito!',
          body: `Hoy toca: ${habito.titulo}`,
          schedule: {
            every: 'day',
            on: { hour, minute },
            repeats: true
          },
          smallIcon: 'ic_stat_icon_config_sample',
          extra: { tipo: 'habito', id: habitoId }
        }]
      });
    } else if (habito.frecuenciaTipo === 'semanal' && habito.diasSemana) {
      for (const dia of habito.diasSemana) {
        const weekday = dia === 0 ? 7 : dia;
        // Notificación única para hoy si corresponde
        if ((now.getDay() === dia || (now.getDay() === 0 && dia === 7)) && hoy > now) {
          await this.scheduleNotification({
            notifications: [{
              id: Math.floor(Math.random() * 1000000),
              title: '¡Recuerda tu hábito!',
              body: `Hoy toca: ${habito.titulo}`,
              schedule: { at: hoy },
              smallIcon: 'ic_stat_icon_config_sample',
              extra: { tipo: 'habito', id: habitoId }
            }]
          });
        }
        // Notificación semanal repetitiva
        await this.scheduleNotification({
          notifications: [{
            id: Math.floor(Math.random() * 1000000),
            title: '¡Recuerda tu hábito!',
            body: `Hoy toca: ${habito.titulo}`,
            schedule: {
              on: { weekday, hour, minute },
              repeats: true
            },
            smallIcon: 'ic_stat_icon_config_sample',
            extra: { tipo: 'habito', id: habitoId }
          }]
        });
      }
    }
  }

  // -------------------------
  // NOTIFICACIONES DE TAREAS
  // -------------------------
  async programarNotificacionTarea(tarea: Tarea, tareaId: string) {
    if (!tarea.fechaRecordatorio) return;
    await this.requestPermission();

    const fecha = this.toDateSafe(tarea.fechaRecordatorio);
    if (!fecha) return;

    const notificationId = Math.floor(Math.random() * 1000000);
    await this.scheduleNotification({
      notifications: [{
        id: notificationId,
        title: `📌 Recordatorio: ${tarea.titulo}`,
        body: tarea.descripcion ? `Descripción: ${tarea.descripcion}` : `¡No olvides realizar esta tarea!`,
        schedule: { at: fecha },
        smallIcon: 'ic_stat_icon_config_sample',
        extra: { tipo: 'tarea', id: tareaId }
      }]
    });
    return notificationId;
  }

  // -------------------------
  // NOTIFICACIÓN DE VENCIMIENTO DE TAREA (un día antes)
  // -------------------------
  async programarNotificacionVencimientoTarea(tarea: Tarea, tareaId: string): Promise<number | undefined> {
    if (!tarea.fechaVencimiento) return undefined;
    await this.requestPermission();

    const fechaVencimiento = this.toDateSafe(tarea.fechaVencimiento);
    if (!fechaVencimiento) return undefined;

    const fechaUnDiaAntes = new Date(fechaVencimiento.getTime() - 24 * 60 * 60 * 1000);
    const notificationIdVencimiento = Math.floor(Math.random() * 1000000);

    await this.scheduleNotification({
      notifications: [{
        id: notificationIdVencimiento,
        title: '⏰ ¡Tarea por vencer!',
        body: tarea.descripcion && tarea.descripcion.trim().length > 0
          ? `Mañana vence: ${tarea.titulo}\nDescripción: ${tarea.descripcion}`
          : `Mañana vence: ${tarea.titulo}. ¡No olvides completarla!`,
        schedule: { at: fechaUnDiaAntes },
        smallIcon: 'ic_stat_icon_config_sample',
        extra: { tipo: 'tarea', id: tareaId }
      }]
    });
    return notificationIdVencimiento;
  }

  // -------------------------
  // NOTIFICACIONES DE BIENESTAR (registro diario de ánimo/energía)
  // -------------------------
async programarNotificacionBienestar(userId: string, hora: string): Promise<number> {
  await this.requestPermission();
  const [hour, minute] = hora.split(':').map(Number);
  const notificationId = Math.floor(Math.random() * 1000000);

  const now = new Date();
  const hoy = new Date(now);
  hoy.setHours(hour, minute, 0, 0);

  // Notificación única para hoy si la hora aún no ha pasado
  if (hoy > now) {
    await this.scheduleNotification({
      notifications: [{
        id: Math.floor(Math.random() * 1000000),
        title: '¿Cómo te sientes hoy?',
        body: 'No olvides registrar tu estado de ánimo y energía.',
        schedule: { at: hoy },
        smallIcon: 'ic_stat_icon_config_sample',
        extra: { tipo: 'bienestar', userId }
      }]
    });
  }

  // Notificación repetitiva diaria
  await this.scheduleNotification({
    notifications: [{
      id: notificationId,
      title: '¿Cómo te sientes hoy?',
      body: 'No olvides registrar tu estado de ánimo y energía.',
      schedule: {
        every: 'day',
        on: { hour, minute },
        repeats: true
      },
      smallIcon: 'ic_stat_icon_config_sample',
      extra: { tipo: 'bienestar', userId }
    }]
  });

  return notificationId;
}
  // -------------------------
  // NOTIFICACIÓN DE VENCIMIENTO DE META (un día antes)
  // -------------------------
  async programarNotificacionVencimientoMeta(meta: Meta, metaId: string): Promise<number | undefined> {
    if (!meta.fechaVencimiento) return undefined;
    await this.requestPermission();

    const fechaVencimiento = this.toDateSafe(meta.fechaVencimiento);
    if (!fechaVencimiento) return undefined;

    const fechaUnDiaAntes = new Date(fechaVencimiento.getTime() - 24 * 60 * 60 * 1000);
    const notificationId = Math.floor(Math.random() * 1000000);

    await this.scheduleNotification({
      notifications: [{
        id: notificationId,
        title: '¡Meta por vencer!',
        body: `Tu meta "${meta.titulo}" está por vencer. ¡Revisa tu progreso!`,
        schedule: { at: fechaUnDiaAntes },
        smallIcon: 'ic_stat_icon_config_sample',
        extra: { tipo: 'meta', id: metaId }
      }]
    });
    return notificationId;
  }
    async programarNotificacionMetaPrueba(meta: Meta, metaId: string) {
    const notificationId = Math.floor(Math.random() * 1000000);
    const fechaPrueba = new Date(Date.now() + 10000); // 10 segundos después

    await this.scheduleNotification({
      notifications: [{
        id: notificationId,
        title: '¡Así se verá tu notificación de meta!',
        body: `Cuando tu meta "${meta.titulo}" esté por vencer, recibirás una notificación como esta.`,
        schedule: { at: fechaPrueba },
        smallIcon: 'ic_stat_icon_config_sample',
        extra: { tipo: 'meta-prueba', id: metaId }
      }]
    });
  }
}
