import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';
import { Tarea } from 'src/app/models/tarea.model';
import { AuthService } from 'src/app/services/auth.service';
import { TaskService } from 'src/app/services/task.service';
import { TaskFormComponent } from 'src/app/components/shared-components/task-form/task-form.component';

import { Etiqueta } from 'src/app/models/etiqueta.model';
import { EtiquetaService } from 'src/app/services/etiqueta.service';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

// Definición del tipo para los días de la semana
interface Day {
  date: Date;
  letter: string;
  dayOfMonth: number;
}

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.page.html',
  styleUrls: ['./task-list.page.scss'],
  standalone: false // Asegúrate de que este componente no es standalone
})
export class TaskListPage implements OnInit, OnDestroy {

  // --- Propiedades para Tareas ---
  todasLasTareasDelSegmento: Tarea[] = [];
  tareasMostradas: Tarea[] = [];
  segmentoActual: 'pendientes' | 'completadas' = 'pendientes';

  // --- Propiedades para Etiquetas y Filtros ---
  etiquetas$!: Observable<Etiqueta[]>;
  etiquetaFiltroSeleccionada: string = 'todas';

  // --- Propiedades que faltaban (UI y calendario) ---
  weekDays: Day[] = [];
  selectedDate: Date = new Date();
  isLoading: boolean = false;

  // --- Subscripciones y otros ---
  private subscriptions = new Subscription();
  public loading: HTMLIonLoadingElement | null = null;

  constructor(
    private authService: AuthService,
    private taskService: TaskService,
    private etiquetaService: EtiquetaService,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.initializeWeekDays();
    this.etiquetas$ = this.etiquetaService.getEtiquetas();

    const userSub = this.authService.user$.subscribe(user => {
      if (user) {
        this.subscribeToTasks(user);
      } else {
        this.todasLasTareasDelSegmento = [];
        this.tareasMostradas = [];
      }
    });
    this.subscriptions.add(userSub);
  }

  ionViewWillEnter() {}

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  subscribeToTasks(user: User) {
    this.isLoading = true;
    const taskSub = this.taskService.getTasks(user.uid)
      .subscribe({
        next: (tareasDesdeFirebase) => {
          if (this.segmentoActual === 'pendientes') {
            this.todasLasTareasDelSegmento = tareasDesdeFirebase.filter(t => !t.completada);
          } else {
            this.todasLasTareasDelSegmento = tareasDesdeFirebase.filter(t => t.completada);
          }
          this.aplicarFiltroDeEtiqueta();
          this.isLoading = false;
        },
        error: (err) => {
          console.error("Error al obtener tareas:", err);
          this.presentToast('Error al cargar las tareas.', 'danger');
          this.isLoading = false;
        }
      });
    this.subscriptions.add(taskSub);
  }

  async segmentChanged(event: any) {
    this.segmentoActual = event.detail.value;
    this.etiquetaFiltroSeleccionada = 'todas';
    const user = await this.authService.getCurrentUser();
    if(user) {
      this.subscribeToTasks(user);
    }
  }

  // FIX: Cambiar nombre del método para que coincida con el HTML
  seleccionarFiltroEtiqueta(idDeEtiqueta: string) {
    this.etiquetaFiltroSeleccionada = idDeEtiqueta;
    this.aplicarFiltroDeEtiqueta();
  }

  aplicarFiltroDeEtiqueta() {
    if (this.etiquetaFiltroSeleccionada === 'todas') {
      this.tareasMostradas = [...this.todasLasTareasDelSegmento];
    } else {
      this.tareasMostradas = this.todasLasTareasDelSegmento.filter(tarea =>
        tarea.etiquetas?.some(etiqueta => etiqueta.id === this.etiquetaFiltroSeleccionada)
      );
    }
  }

  initializeWeekDays() {
    this.weekDays = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        this.weekDays.push({
            date: date,
            letter: date.toLocaleDateString('es-ES', { weekday: 'narrow' }),
            dayOfMonth: date.getDate()
        });
    }
  }

  isDaySelected(day: Day): boolean {
    return day.date.toDateString() === this.selectedDate.toDateString();
  }

  selectDay(day: Day) {
      this.selectedDate = day.date;
  }

  async handleRefresh(event: any) {
    const user = await this.authService.getCurrentUser();
    if(user) {
      this.subscribeToTasks(user);
    }
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  trackTareaById(index: number, tarea: Tarea): string {
    return tarea.id!;
  }

  getDisplayDateForPipe(fecha: any): Date | null {
    if (fecha instanceof Timestamp) {
      return fecha.toDate();
    }
    return null;
  }

  async confirmarEliminar(tarea: Tarea, event: MouseEvent) {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que quieres eliminar la tarea "${tarea.titulo}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.eliminarTarea(tarea) }
      ]
    });
    await alert.present();
  }

  async abrirModalTarea(tarea?: Tarea) {
    const modal = await this.modalCtrl.create({
      component: TaskFormComponent,
      componentProps: { tarea: tarea }
    });
    await modal.present();
  }

  async toggleCompletada(tarea: Tarea, event: any) {
    const completada = event.detail.checked;
    const currentUser = await this.authService.getCurrentUser();
    if (currentUser && tarea.id) {
      this.taskService.actualizarTask(currentUser.uid, tarea.id, { completada })
        .catch(err => this.presentToast('Error al actualizar la tarea.', 'danger'));
    }
  }

  async eliminarTarea(tarea: Tarea) {
     const currentUser = await this.authService.getCurrentUser();
     if(currentUser && tarea.id){
       this.taskService.eliminarTask(currentUser.uid, tarea.id)
       .then(() => this.presentToast('Tarea eliminada.', 'success'))
       .catch(err => this.presentToast('Error al eliminar la tarea.', 'danger'))
     }
  }

  async presentToast(mensaje: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }
}
