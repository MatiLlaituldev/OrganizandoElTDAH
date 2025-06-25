import { Injectable } from '@angular/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // Solicita permisos al usuario (llama esto al iniciar la app)
  async requestPermission() {
    await LocalNotifications.requestPermissions();
  }

  // Programa una o varias notificaciones
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
}
