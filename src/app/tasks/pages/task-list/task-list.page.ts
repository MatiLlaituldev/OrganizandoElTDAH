// src/app/tasks/pages/task-list/task-list.page.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController, ToastController, AlertController, LoadingController } from '@ionic/angular';
import { Observable, Subscription, of } from 'rxjs';
import { switchMap, catchError, tap, map, finalize } from 'rxjs/operators';

import { Tarea } from '../../../models/tarea.model';
import { TaskService } from '../../../services/task.service'; // Clase TaskService en tarea.service.ts
import { AuthService } from '../../../services/auth.service';
import { User } from '@firebase/auth';
import { Timestamp } from 'firebase/firestore';

import { TaskFormComponent } from '../../../components/shared-components/task-form/task-form.component';

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
  currentSegment: string = 'pendientes';
  private loadingElement: HTMLIonLoadingElement | null = null;

  constructor(
    private modalCtrl: ModalController,
    private taskService: TaskService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    console.log('[TaskListPage] ngOnInit: Iniciando componente.');
    this.authSubscription = this.authService.user$.subscribe(user => {
      console.log('[TaskListPage] authService.user$ emitió:', user);
      if (user && user.uid) {
        if (!this.authUser || this.authUser.uid !== user.uid) {
          this.authUser = user;
          console.log('[TaskListPage] Usuario autenticado (o cambiado):', user.uid, '. Llamando a subscribeToTasks.');
          this.subscribeToTasks(user.uid);
        }
      } else {
        console.log('[TaskListPage] No hay usuario autenticado o UID es nulo.');
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
        console.log('[TaskListPage] ionViewWillEnter - No hay suscripción activa a tareas o está cerrada. Resuscribiendo...');
        this.subscribeToTasks(this.authUser.uid);
      }
    }
  }

  async subscribeToTasks(userId: string) {
    console.log(`[TaskListPage] subscribeToTasks: Iniciando para userId: ${userId}`);
    if (this.isLoading) {
      console.log('[TaskListPage] subscribeToTasks: Ya hay una carga en progreso, omitiendo nueva llamada.');
      return;
    }
    await this.presentLoading('Cargando tareas...'); // Muestra el loading
    this.isLoading = true;

    if (this.tasksRawSubscription && !this.tasksRawSubscription.closed) {
      this.tasksRawSubscription.unsubscribe();
    }

    this.tasksRawSubscription = this.taskService.getTasks(userId).pipe(
      tap(rawTasks => {
        console.log('[TaskListPage] taskService.getTasks emitió (datos crudos):', rawTasks);
        if (!rawTasks) console.warn('[TaskListPage] taskService.getTasks emitió undefined/null como datos crudos.');
      }),
      map(tasks => {
        if (!tasks) return [];
        console.log('[TaskListPage] map: Aplicando filterAndSortTasks...');
        const result = this.filterAndSortTasks(tasks);
        console.log('[TaskListPage] map: Resultado de filterAndSortTasks:', result);
        return result;
      }),
      tap(filteredTasks => { // <--- LÓGICA DE LOADING AQUÍ para cada emisión
        console.log('[TaskListPage] tap (después de map): Tareas procesadas. isLoading = false, dismissLoading().', filteredTasks);
        this.isLoading = false;
        this.dismissLoading(); // Cierra el loading después de procesar la emisión
      }),
      catchError(error => {
        console.error('[TaskListPage] catchError: Error al cargar tareas:', error);
        this.presentToast('Error al cargar las tareas.', 'danger');
        this.isLoading = false; // Asegurar que isLoading se ponga a false en error
        this.dismissLoading(); // Asegurar que se cierre el loading en error
        return of([]);
      }),
      finalize(() => { // Finalize se ejecuta cuando el observable fuente completa o hay error, o desuscripción
        console.log('[TaskListPage] finalize: El observable de tareas ha finalizado (o error/desuscripción).');
        // Si por alguna razón isLoading sigue true, intentamos cerrarlo.
        if (this.isLoading) {
            console.warn('[TaskListPage] finalize: isLoading todavía era true. Forzando dismissLoading.');
            this.isLoading = false;
            this.dismissLoading();
        }
      })
    ).subscribe({
        next: filteredAndSortedTasks => {
          console.log('[TaskListPage] subscribe.next: Asignando tareas a tasks$.');
          this.tasks$ = of(filteredAndSortedTasks);
        },
        error: err => {
            console.error('[TaskListPage] subscribe.error: Error no manejado por catchError:', err);
            // isLoading y dismissLoading ya deberían haberse manejado en catchError o finalize
        }
    });
  }

  filterAndSortTasks(tasks: Tarea[]): Tarea[] {
    let filteredTasks: Tarea[];
    console.log('[TaskListPage] filterAndSortTasks - Segmento actual:', this.currentSegment, 'Tareas recibidas:', tasks);
    if (!tasks) return [];

    // Log para cada tarea y su estado 'completada'
    tasks.forEach((task, index) => {
      console.log(`[TaskListPage] filterAndSortTasks - Tarea[${index}]: ${task.titulo}, Completada: ${task.completada}`);
    });

    if (this.currentSegment === 'pendientes') {
      filteredTasks = tasks.filter(task => !task.completada);
      filteredTasks.sort((a, b) => {
        const prioridadA = a.prioridad ?? 3;
        const prioridadB = b.prioridad ?? 3;
        if (prioridadA !== prioridadB) return prioridadA - prioridadB;
        const timeA = a.fechaCreacion instanceof Timestamp ? a.fechaCreacion.toMillis() : Date.now();
        const timeB = b.fechaCreacion instanceof Timestamp ? b.fechaCreacion.toMillis() : Date.now();
        return timeA - timeB;
      });
    } else {
      filteredTasks = tasks.filter(task => task.completada);
      filteredTasks.sort((a, b) => {
        const timeA = a.fechaCompletada instanceof Timestamp ? a.fechaCompletada.toMillis() : 0;
        const timeB = b.fechaCompletada instanceof Timestamp ? b.fechaCompletada.toMillis() : 0;
        return timeB - timeA;
      });
    }
    console.log('[TaskListPage] filterAndSortTasks - Tareas después de filtrar y ordenar:', filteredTasks);
    return filteredTasks;
  }

  segmentChanged(event: any) {
    this.currentSegment = event.detail.value;
    console.log('[TaskListPage] segmentChanged a', this.currentSegment);
    if (this.authUser?.uid) {
      this.subscribeToTasks(this.authUser.uid);
    }
  }

  async presentLoading(message: string = 'Cargando...') {
    console.log(`[TaskListPage] presentLoading: Intentando mostrar loading con mensaje "${message}"`);
    if (this.loadingElement) {
      console.log('[TaskListPage] presentLoading: Ya existe un loadingElement, descartando el anterior.');
      try { await this.loadingElement.dismiss(); } catch (e) {}
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
    console.log('[TaskListPage] dismissLoading: Intentando cerrar loading.');
    if (this.loadingElement) {
      try {
        await this.loadingElement.dismiss();
        console.log('[TaskListPage] dismissLoading: Loading cerrado.');
      } catch (error) {
        // Puede que ya se haya cerrado, no es crítico
      } finally {
        this.loadingElement = null;
      }
    } else {
      // Intenta cerrar cualquier loading global si no hay una instancia específica
      try {
        const currentGlobalLoading = await this.loadingCtrl.getTop();
        if (currentGlobalLoading) {
          await this.loadingCtrl.dismiss();
          console.log('[TaskListPage] dismissLoading: Loading global cerrado.');
        } else {
          console.log('[TaskListPage] dismissLoading: No había loadingElement ni loading global para cerrar.');
        }
      } catch(e) { /* Silenciar */ }
    }
  }

  ngOnDestroy() {
    console.log('[TaskListPage] ngOnDestroy: Desuscribiendo y limpiando.');
    if (this.authSubscription && !this.authSubscription.closed) {
      this.authSubscription.unsubscribe();
    }
    if (this.tasksRawSubscription && !this.tasksRawSubscription.closed) {
      this.tasksRawSubscription.unsubscribe();
    }
    this.dismissLoading();
  }

  // MÉTODOS NO MODIFICADOS PERO NECESARIOS PARA EL TEMPLATE
  async abrirModalTarea(tarea?: Tarea) {
    const modal = await this.modalCtrl.create({
      component: TaskFormComponent, componentProps: { tarea: tarea ? { ...tarea } : undefined },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data && (data.creada || data.actualizada)) {
      this.presentToast(data.creada ? 'Tarea creada.' : 'Tarea actualizada.', 'success', 1500);
    }
  }
  async toggleCompletada(tarea: Tarea, event: Event) {
    event.stopPropagation();
    if (!this.authUser?.uid || !tarea.id) return;
    const nuevoEstado = !tarea.completada; const tareaId = tarea.id;
    try {
      await this.taskService.actualizarEstadoCompletadaTask(this.authUser.uid, tareaId, nuevoEstado);
      this.presentToast(`Tarea marcada como ${nuevoEstado ? 'completada' : 'pendiente'}.`, 'success', 1500);
    } catch (error) { this.presentToast('Error al actualizar la tarea.', 'danger'); }
  }
  async confirmarEliminar(tarea: Tarea, event: Event) {
    event.stopPropagation();
    if (!this.authUser?.uid || !tarea.id) return;
    const tareaId = tarea.id;
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación', message: `¿Estás seguro de que quieres eliminar la tarea "${tarea.titulo}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'secondary-button' },
        { text: 'Eliminar', cssClass: 'danger-button',
          handler: async () => {
            try {
              await this.taskService.eliminarTask(this.authUser!.uid, tareaId);
              this.presentToast('Tarea eliminada exitosamente.', 'success', 1500);
            } catch (error) { this.presentToast('Error al eliminar la tarea.', 'danger'); }
          },
        },
      ], cssClass: 'custom-alert'
    });
    await alert.present();
  }
  async handleRefresh(event: any) {
    console.log('[TaskListPage] handleRefresh');
    if (this.authUser?.uid) {
      this.subscribeToTasks(this.authUser.uid).finally(() => { // finally no existe en promesas, se usa en pipe
        if (event && event.target && typeof event.target.complete === 'function') {
          event.target.complete();
        }
        console.log('[TaskListPage] Refresh completado y refresher cerrado.');
      });
    } else {
      if (event && event.target && typeof event.target.complete === 'function') {
        event.target.complete();
      }
    }
  }
  trackTareaById(index: number, tarea: Tarea): string | undefined { return tarea.id; }
  async presentToast(mensaje: string, color: 'success' | 'warning' | 'danger' | 'light' | 'dark' = 'dark', duracion: number = 2000) {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: duracion, color: color, position: 'bottom', cssClass: 'custom-toast' });
    toast.present();
  }
}
