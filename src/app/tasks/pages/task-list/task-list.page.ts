import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ModalController, ToastController, AlertController } from '@ionic/angular';
import { Observable, Subscription, of, BehaviorSubject } from 'rxjs';
import { Tarea, Subtarea } from 'src/app/models/tarea.model'; // Subtarea importada
import { AuthService } from 'src/app/services/auth.service';
import { TaskService } from 'src/app/services/task.service';
import { TaskFormComponent } from 'src/app/components/shared-components/task-form/task-form.component';

import { Etiqueta } from 'src/app/models/etiqueta.model';
import { EtiquetaService } from 'src/app/services/etiqueta.service';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { RegistroTarea } from 'src/app/models/registro-tarea.model';
import { switchMap, tap } from 'rxjs/operators';

// --- AÑADIDO ---
// ViewModel que combina la Tarea con su Registro del día para facilitar su uso en la vista.
export interface TareaViewModel extends Tarea {
  registro?: RegistroTarea;
}

interface Day {
  date: Date;
  letter: string;
  dayOfMonth: number;
}

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.page.html',
  styleUrls: ['./task-list.page.scss'],
  standalone: false,
})
export class TaskListPage implements OnInit, OnDestroy {

  // --- Propiedades de Datos ---
  todasLasTareas: Tarea[] = [];
  tareasMostradas: TareaViewModel[] = []; // <-- MODIFICADO para usar el ViewModel
  registrosDelDia: RegistroTarea[] = [];
  etiquetas$!: Observable<Etiqueta[]>;

  // --- Propiedades de Estado de la UI ---
  segmentoActual: 'pendientes' | 'completadas' = 'pendientes';
  etiquetaFiltroSeleccionada: string = 'todas';
  weekDays: Day[] = [];
  selectedDate$ = new BehaviorSubject<Date>(new Date());
  isLoading: boolean = true;
  private subscriptions = new Subscription();

  @ViewChild('filterContainer') filterContainer!: ElementRef;

  constructor(
    private authService: AuthService,
    private taskService: TaskService,
    private etiquetaService: EtiquetaService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.initializeWeekDays();
    this.etiquetas$ = this.etiquetaService.getEtiquetas();

    const userSub = this.authService.user$.pipe(
      tap(() => this.isLoading = true),
      switchMap(user => user ? of(user) : of(null))
    ).subscribe(user => {
      if (user) {
        const tasksSub = this.taskService.getTasks(user.uid).subscribe(tareas => {
          this.todasLasTareas = tareas;
          this.aplicarFiltros();
        });
        this.subscriptions.add(tasksSub);

        const dateSub = this.selectedDate$.pipe(
          switchMap(date => this.taskService.getRegistrosPorDia(user.uid, this.formatDate(date)))
        ).subscribe(registros => {
          this.registrosDelDia = registros;
          this.aplicarFiltros();
          this.isLoading = false;
        });
        this.subscriptions.add(dateSub);
      } else {
        this.todasLasTareas = [];
        this.registrosDelDia = [];
        this.aplicarFiltros();
        this.isLoading = false;
      }
    });
    this.subscriptions.add(userSub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  // --- REEMPLAZADO ---
  // Lógica de filtrado actualizada para trabajar con TareaViewModel.
  aplicarFiltros() {
    // 1. Transformar Tareas a TareaViewModels, combinando con su registro diario
    const tareasConRegistro: TareaViewModel[] = this.todasLasTareas.map(tarea => ({
      ...tarea,
      registro: this.getRegistroParaTarea(tarea)
    }));

    // 2. Filtrar por día y segmento
    let tareasDelDia = tareasConRegistro.filter(t => this.esTareaDelDiaSeleccionado(t));
    let tareasPorSegmento = tareasDelDia.filter(t => {
      const completadaHoy = this.estaCompletadaHoy(t);
      return this.segmentoActual === 'pendientes' ? !completadaHoy : completadaHoy;
    });

    // 3. Filtrar por etiqueta
    let tareasFiltradas;
    if (this.etiquetaFiltroSeleccionada === 'todas') {
      tareasFiltradas = tareasPorSegmento;
    } else {
      tareasFiltradas = tareasPorSegmento.filter(tarea =>
        tarea.etiquetas?.some(etiqueta => etiqueta.id === this.etiquetaFiltroSeleccionada)
      );
    }

    // 4. ORDENAR el resultado final
    tareasFiltradas.sort((a, b) => {
      const prioridadA = a.prioridad || 0;
      const prioridadB = b.prioridad || 0;
      if (prioridadA !== prioridadB) {
        return prioridadB - prioridadA;
      }
      const fechaA = a.fechaCreacion.toMillis();
      const fechaB = b.fechaCreacion.toMillis();
      return fechaB - fechaA;
    });

    this.tareasMostradas = tareasFiltradas;
  }

  // --- MÉTODOS DE LÓGICA DE TAREAS ---
  esTareaDelDiaSeleccionado(tarea: Tarea): boolean {
    if (tarea.recurrencia === 'diaria') return true;
    const diaSeleccionado = new Date(this.selectedDate$.value);
    diaSeleccionado.setHours(0, 0, 0, 0);

    const fechaCreacion = this.getDisplayDateForPipe(tarea.fechaCreacion);
    if (fechaCreacion) fechaCreacion.setHours(0, 0, 0, 0);

    const fechaVencimiento = this.getDisplayDateForPipe(tarea.fechaVencimiento);
    if (fechaVencimiento) fechaVencimiento.setHours(23, 59, 59, 999);

    if (!fechaVencimiento && fechaCreacion) {
      return fechaCreacion.getTime() === diaSeleccionado.getTime();
    } else if (fechaCreacion && fechaVencimiento) {
      return diaSeleccionado >= fechaCreacion && diaSeleccionado <= fechaVencimiento;
    }
    return false;
  }

  // --- MODIFICADO --- para usar TareaViewModel
  estaCompletadaHoy(tarea: TareaViewModel): boolean {
    if (tarea.recurrencia === 'diaria') {
      return !!tarea.registro?.completada;
    }
    return tarea.completada;
  }

  async toggleCompletada(tarea: Tarea, event: any) {
    const completada = event.detail.checked;
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser || !tarea.id) return;
    if (tarea.recurrencia === 'diaria') {
      const fechaFormato = this.formatDate(this.selectedDate$.value);
      this.taskService.registrarEstadoTareaDiaria(currentUser.uid, tarea.id, fechaFormato, completada);
    } else {
      this.taskService.actualizarTask(currentUser.uid, tarea.id, { completada });
    }
  }

  // --- AÑADIDO ---
  // Método para gestionar el click en el checkbox de una subtarea.
  async toggleSubtareaCompletada(tarea: TareaViewModel, subtarea: Subtarea, event: any) {
    const completada = event.detail.checked;
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser || !tarea.id || !subtarea.id) return;

    const fechaFormato = this.formatDate(this.selectedDate$.value);
    this.taskService.registrarEstadoSubtarea(currentUser.uid, tarea.id, subtarea, completada, fechaFormato);
    // La vista se actualizará automáticamente gracias a la suscripción a los registros.
  }

  esVencida(tarea: TareaViewModel): boolean {
    if (this.estaCompletadaHoy(tarea) || !tarea.fechaVencimiento) return false;
    const ahora = new Date();
    const fechaVencimiento = this.getDisplayDateForPipe(tarea.fechaVencimiento);
    return fechaVencimiento ? fechaVencimiento < ahora : false;
  }

  // --- MÉTODOS DE UI QUE ACTIVAN CAMBIOS (Sin cambios) ---
  async segmentChanged(event: any) {
    this.segmentoActual = event.detail.value;
    this.aplicarFiltros();
  }

  seleccionarFiltroEtiqueta(idDeEtiqueta: string, event?: MouseEvent) {
    this.etiquetaFiltroSeleccionada = idDeEtiqueta;
    this.aplicarFiltros();
    if (event) {
      const clickedChip = event.currentTarget as HTMLElement;
      clickedChip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  selectDay(day: Day) {
    this.isLoading = true;
    this.selectedDate$.next(day.date);
  }

  // --- MÉTODOS AUXILIARES ---

  // --- AÑADIDOS ---
  getRegistroParaTarea(tarea: Tarea): RegistroTarea | undefined {
    if (!tarea.id) return undefined;
    return this.registrosDelDia.find(r => r.tareaId === tarea.id);
  }

  estaSubtareaCompletada(subtarea: Subtarea, registro: RegistroTarea | undefined): boolean {
    if (!registro || !registro.estadoSubtareas || !subtarea.id) {
      return false;
    }
    return !!registro.estadoSubtareas[subtarea.id];
  }

  calcularProgreso(tarea: TareaViewModel): number {
    if (!tarea.subtareas || tarea.subtareas.length === 0) {
      return 0;
    }
    const completadas = tarea.subtareas.filter(st => this.estaSubtareaCompletada(st, tarea.registro)).length;
    return completadas / tarea.subtareas.length;
  }
  // --- FIN DE AÑADIDOS ---


  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  initializeWeekDays() {
    this.weekDays = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      this.weekDays.push({
        date: date,
        letter: date.toLocaleDateString('es-ES', { weekday: 'narrow' }).toUpperCase(),
        dayOfMonth: date.getDate()
      });
    }
  }

  isDaySelected(day: Day): boolean {
    return day.date.toDateString() === this.selectedDate$.value.toDateString();
  }

  async handleRefresh(event: any) {
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  trackTareaById(index: number, tarea: TareaViewModel): string { return tarea.id!; }

  getDisplayDateForPipe(fecha: any): Date | null {
    if (fecha instanceof Timestamp) return fecha.toDate();
    return null;
  }

  async abrirModalTarea(tarea?: Tarea) {
    const modal = await this.modalCtrl.create({
      component: TaskFormComponent,
      componentProps: { tarea: tarea }
    });
    await modal.present();
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

  async eliminarTarea(tarea: Tarea) {
    const currentUser = await this.authService.getCurrentUser();
    if (currentUser && tarea.id) {
      this.taskService.eliminarTask(currentUser.uid, tarea.id)
        .then(() => this.presentToast('Tarea eliminada.', 'success'))
        .catch(err => this.presentToast('Error al eliminar la tarea.', 'danger'));
    }
  }

  async presentToast(mensaje: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      position: 'bottom',
      color: color,
    });
    await toast.present();
  }
  getPriorityClass(prioridad?: number): string {
    switch (prioridad) {
      case 3: return 'priority-high';
      case 2: return 'priority-medium';
      case 1: return 'priority-low';
      default: return '';
    }
  }
}
