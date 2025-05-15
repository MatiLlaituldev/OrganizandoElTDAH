// src/app/tasks/pages/task-list/task-list.page.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController, ToastController, AlertController, LoadingController } from '@ionic/angular';
import { Observable, Subscription, of } from 'rxjs';
import { switchMap, catchError, tap, map, finalize } from 'rxjs/operators';

import { Tarea } from '../../../models/tarea.model';
import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '@firebase/auth';
import { Timestamp } from 'firebase/firestore';

import { TaskFormComponent } from '../../../components/shared-components/task-form/task-form.component';

// Interface para la estructura de los días en la barra
interface DayDisplay {
  letter: string; // L, M, X, J, V, S, D
  dayOfWeek: number; // 0 (Dom) - 6 (Sab)
  dayOfMonth: number; // 1 - 31
  isCurrentMonth: boolean; // Para posible estilo si el día es de mes anterior/siguiente en la vista semanal
  fullDate: Date; // Objeto Date completo
}

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.page.html',
  styleUrls: ['./task-list.page.scss'],
  standalone: false,
})
export class TaskListPage implements OnInit, OnDestroy {

  tasks$: Observable<Tarea[]> = of([]);
  private authUser: User | null = null;
  private authSubscription: Subscription | undefined;
  private tasksRawSubscription: Subscription | undefined;
  isLoading: boolean = false;
  private loadingElement: HTMLIonLoadingElement | null = null;

  // --- Propiedades para la barra de días ---
  public weekDays: DayDisplay[] = []; // Array para mostrar los días de la semana
  public selectedDayFullDate!: Date; // Día completo seleccionado por el usuario

  // --- Propiedades para los segmentos Pendientes/Completadas ---
  public currentSegment: string = 'pendientes'; // Segmento actual

  constructor(
    private modalCtrl: ModalController,
    private taskService: TaskService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {
    this.initializeWeekDays(); // Inicializar los días de la semana
    // selectedDayFullDate se inicializa en initializeWeekDays al día de hoy
  }

  initializeWeekDays() {
    this.weekDays = [];
    const today = new Date();
    this.selectedDayFullDate = new Date(today); // Día seleccionado inicialmente es hoy

    // Encontrar el inicio de la semana actual (Lunes)
    let current = new Date(today);
    const dayOfWeek = current.getDay(); // 0 (Dom) - 6 (Sab)
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Si es Domingo (0), restar 6 días. Si es Lunes (1), diff es 0.
    current.setDate(today.getDate() + diffToMonday);

    const dayLetters = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; // Domingo es 0

    for (let i = 0; i < 7; i++) {
      const dateForDay = new Date(current);
      this.weekDays.push({
        letter: dayLetters[dateForDay.getDay()],
        dayOfWeek: dateForDay.getDay(),
        dayOfMonth: dateForDay.getDate(),
        isCurrentMonth: dateForDay.getMonth() === today.getMonth(),
        fullDate: dateForDay,
      });
      current.setDate(current.getDate() + 1);
    }
    console.log('[TaskListPage] Week days initialized:', this.weekDays);
  }


  ngOnInit() {
    console.log('[TaskListPage] ngOnInit.');
    this.authSubscription = this.authService.user$.subscribe(user => {
      if (user && user.uid) {
        if (!this.authUser || this.authUser.uid !== user.uid) {
          this.authUser = user;
          console.log('[TaskListPage] Usuario autenticado:', user.uid);
          this.subscribeToTasks(user.uid);
        }
      } else {
        this.authUser = null;
        this.tasks$ = of([]);
        this.isLoading = false;
        this.dismissLoading();
        if (this.tasksRawSubscription && !this.tasksRawSubscription.closed) {
          this.tasksRawSubscription.unsubscribe();
        }
      }
    });
  }

  ionViewWillEnter() {
    console.log('[TaskListPage] ionViewWillEnter.');
    if (this.authUser && this.authUser.uid) {
      if (!this.tasksRawSubscription || this.tasksRawSubscription.closed) {
        this.subscribeToTasks(this.authUser.uid);
      }
    }
  }

  async subscribeToTasks(userId: string) {
    console.log(`[TaskListPage] subscribeToTasks para userId: ${userId}, segmento: ${this.currentSegment}`);
    if (this.isLoading) return;
    await this.presentLoading('Cargando tareas...');
    this.isLoading = true;

    if (this.tasksRawSubscription && !this.tasksRawSubscription.closed) {
      this.tasksRawSubscription.unsubscribe();
    }

    this.tasksRawSubscription = this.taskService.getTasks(userId).pipe(
      map(tasks => this.filterAndSortTasks(tasks || [])),
      tap(() => {
        this.isLoading = false;
        this.dismissLoading();
      }),
      catchError(error => {
        console.error('[TaskListPage] Error al cargar tareas:', error);
        this.presentToast('Error al cargar las tareas.', 'danger');
        this.isLoading = false;
        this.dismissLoading();
        return of([]);
      }),
      finalize(() => {
         if (this.isLoading) {
           this.isLoading = false;
           this.dismissLoading();
         }
      })
    ).subscribe(filteredAndSortedTasks => {
      this.tasks$ = of(filteredAndSortedTasks);
    });
  }

  filterAndSortTasks(tasks: Tarea[]): Tarea[] {
    console.log(`[TaskListPage] filterAndSortTasks - Segmento: ${this.currentSegment}, Tareas recibidas: ${tasks.length}`);
    let filteredTasks: Tarea[];

    if (this.currentSegment === 'pendientes') {
      filteredTasks = tasks.filter(task => !task.completada);
      filteredTasks.sort((a, b) => {
        const prioridadA = a.prioridad ?? 3;
        const prioridadB = b.prioridad ?? 3;
        if (prioridadA !== prioridadB) return prioridadA - prioridadB;
        const timeA = a.fechaCreacion instanceof Timestamp ? a.fechaCreacion.toMillis() : (a.fechaCreacion ? new Date(a.fechaCreacion as any).getTime() : Date.now());
        const timeB = b.fechaCreacion instanceof Timestamp ? b.fechaCreacion.toMillis() : (b.fechaCreacion ? new Date(b.fechaCreacion as any).getTime() : Date.now());
        return timeA - timeB; // Más antiguas primero
      });
    } else { // 'completadas'
      filteredTasks = tasks.filter(task => task.completada);
      filteredTasks.sort((a, b) => {
        const timeA = a.fechaCompletada instanceof Timestamp ? a.fechaCompletada.toMillis() : (a.fechaCompletada ? new Date(a.fechaCompletada as any).getTime() : 0);
        const timeB = b.fechaCompletada instanceof Timestamp ? b.fechaCompletada.toMillis() : (b.fechaCompletada ? new Date(b.fechaCompletada as any).getTime() : 0);
        return timeB - timeA; // Más recientes primero
      });
    }
    console.log(`[TaskListPage] Tareas después de filtrar y ordenar (${this.currentSegment}): ${filteredTasks.length}`);
    return filteredTasks;
  }

  // Para resaltar el día seleccionado en la barra de días
  isDaySelected(day: DayDisplay): boolean {
    return this.selectedDayFullDate.getFullYear() === day.fullDate.getFullYear() &&
           this.selectedDayFullDate.getMonth() === day.fullDate.getMonth() &&
           this.selectedDayFullDate.getDate() === day.fullDate.getDate();
  }

  // Cuando el usuario selecciona un día en la barra
  selectDay(day: DayDisplay): void {
    this.selectedDayFullDate = new Date(day.fullDate);
    console.log(`[TaskListPage] Día seleccionado: ${this.selectedDayFullDate.toDateString()}`);
    // Por ahora, la selección de día es solo visual y no afecta el filtrado de tareas.
    // Si quisiéramos que afecte, aquí se llamaría a subscribeToTasks o se modificaría un filtro.
  }

  // Cuando cambia el segmento (Pendientes/Completadas)
  segmentChanged(event: any): void {
    this.currentSegment = event.detail.value;
    console.log('[TaskListPage] Segmento cambiado a', this.currentSegment);
    if (this.authUser?.uid) {
      // Re-obtener y re-filtrar tareas según el nuevo segmento
      this.subscribeToTasks(this.authUser.uid);
    }
  }

  public getDisplayDateForPipe(fechaVencimiento: any): Date | string | number | null {
    if (!fechaVencimiento) return null;
    if (fechaVencimiento instanceof Timestamp) return fechaVencimiento.toDate();
    if (fechaVencimiento instanceof Date || typeof fechaVencimiento === 'string' || typeof fechaVencimiento === 'number') {
      return fechaVencimiento;
    }
    try {
      const d = new Date(fechaVencimiento);
      if (!isNaN(d.getTime())) return d;
    } catch (e) { /* silent */ }
    return null;
  }

  async presentLoading(message: string = 'Cargando...') {
    // ... (código sin cambios)
    console.log(`[TaskListPage] presentLoading: Intentando mostrar loading con mensaje "${message}"`);
    if (this.loadingElement && (await this.loadingCtrl.getTop()) === this.loadingElement) {
      console.log('[TaskListPage] presentLoading: Ya existe un loadingElement activo, descartando el anterior.');
      try { await this.loadingElement.dismiss(); } catch (e) { /* ignore */ }
      this.loadingElement = null;
    }
    this.loadingElement = await this.loadingCtrl.create({
      message,
      spinner: 'crescent',
      translucent: true,
      cssClass: 'custom-loading'
    });
    await this.loadingElement.present();
    console.log('[TaskListPage] presentLoading: Loading presentado.');
  }

  async dismissLoading() {
    // ... (código sin cambios)
    console.log('[TaskListPage] dismissLoading: Intentando cerrar loading.');
    if (this.loadingElement && (await this.loadingCtrl.getTop()) === this.loadingElement) {
      try {
        await this.loadingElement.dismiss();
        console.log('[TaskListPage] dismissLoading: Loading específico cerrado.');
      } catch (error) {
        console.warn('[TaskListPage] dismissLoading: Error al cerrar loadingElement específico:', error);
      } finally {
        this.loadingElement = null;
      }
    } else if (!this.loadingElement) {
        const currentGlobalLoading = await this.loadingCtrl.getTop();
        if (currentGlobalLoading) {
            try {
                await currentGlobalLoading.dismiss();
                console.log('[TaskListPage] dismissLoading: Loading global (inesperado) cerrado.');
            } catch(e) { console.warn('[TaskListPage] dismissLoading: Error al cerrar loading global:', e); }
        } else {
            console.log('[TaskListPage] dismissLoading: No había loadingElement ni loading global para cerrar.');
        }
    } else {
        console.log('[TaskListPage] dismissLoading: loadingElement existe pero no es el superior. No se cierra.');
    }
  }

  ngOnDestroy() {
    // ... (código sin cambios)
    console.log('[TaskListPage] ngOnDestroy: Desuscribiendo y limpiando.');
    if (this.authSubscription && !this.authSubscription.closed) {
      this.authSubscription.unsubscribe();
    }
    if (this.tasksRawSubscription && !this.tasksRawSubscription.closed) {
      this.tasksRawSubscription.unsubscribe();
    }
    this.dismissLoading();
  }

  async abrirModalTarea(tarea?: Tarea) {
    // ... (código sin cambios)
    const modal = await this.modalCtrl.create({
      component: TaskFormComponent,
      componentProps: {
        tarea: tarea ? { ...tarea } : undefined
      },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data && (data.creada || data.actualizada)) {
      this.presentToast(data.creada ? 'Tarea creada.' : 'Tarea actualizada.', 'success', 1500);
    }
  }

  async toggleCompletada(tarea: Tarea, event: Event) {
    // ... (código sin cambios)
    event.stopPropagation();
    if (!this.authUser?.uid || !tarea.id) {
      console.warn('[TaskListPage] toggleCompletada: No authUser or tarea.id');
      return;
    }
    const nuevoEstado = !tarea.completada;
    const tareaId = tarea.id;
    try {
      await this.taskService.actualizarEstadoCompletadaTask(this.authUser.uid, tareaId, nuevoEstado);
      this.presentToast(`Tarea marcada como ${nuevoEstado ? 'completada' : 'pendiente'}.`, 'success', 1500);
    } catch (error) {
      console.error('[TaskListPage] Error al actualizar estado de tarea:', error);
      this.presentToast('Error al actualizar la tarea.', 'danger');
    }
  }

  async confirmarEliminar(tarea: Tarea, event: Event) {
    // ... (código sin cambios)
    event.stopPropagation();
    if (!this.authUser?.uid || !tarea.id) {
      console.warn('[TaskListPage] confirmarEliminar: No authUser or tarea.id');
      return;
    }
    const tareaId = tarea.id;
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que quieres eliminar la tarea "${tarea.titulo}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'secondary-button' },
        {
          text: 'Eliminar',
          cssClass: 'danger-button',
          handler: async () => {
            try {
              await this.taskService.eliminarTask(this.authUser!.uid, tareaId);
              this.presentToast('Tarea eliminada exitosamente.', 'success', 1500);
            } catch (error) {
              console.error('[TaskListPage] Error al eliminar tarea:', error);
              this.presentToast('Error al eliminar la tarea.', 'danger');
            }
          },
        },
      ],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  async handleRefresh(event: any) {
    // ... (código sin cambios)
    console.log('[TaskListPage] handleRefresh disparado.');
    if (this.authUser?.uid) {
      try {
        await this.subscribeToTasks(this.authUser.uid); // Asegúrate que subscribeToTasks es async o devuelve Promesa
      } catch (error) {
        console.error('[TaskListPage] Error durante handleRefresh:', error);
      } finally {
        if (event && event.target && typeof event.target.complete === 'function') {
          event.target.complete();
          console.log('[TaskListPage] Refresher completado y cerrado.');
        }
      }
    } else {
      console.log('[TaskListPage] handleRefresh: No hay usuario autenticado.');
      if (event && event.target && typeof event.target.complete === 'function') {
        event.target.complete();
      }
    }
  }

  trackTareaById(index: number, tarea: Tarea): string | undefined {
    // ... (código sin cambios)
    return tarea.id;
  }

  async presentToast(
    mensaje: string,
    color: 'success' | 'warning' | 'danger' | 'light' | 'dark' = 'dark',
    duracion: number = 2000
  ) {
    // ... (código sin cambios)
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: duracion,
      color: color,
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    toast.present();
  }
}
