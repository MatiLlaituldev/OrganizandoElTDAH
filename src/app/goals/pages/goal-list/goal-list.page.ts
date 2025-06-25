import { Component, OnInit } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { Meta } from '../../../models/meta.model';
import { Tarea } from '../../../models/tarea.model';
import { Habito } from '../../../models/habito.model';
import { GoalService } from '../../../services/goal.service';
import { TaskService } from '../../../services/task.service';
import { HabitoService } from '../../../services/habito.service';
import { GoalFormComponent } from '../../../components/shared-components/goal-form/goal-form.component';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-goal-list',
  templateUrl: './goal-list.page.html',
  styleUrls: ['./goal-list.page.scss'],
  standalone: false
})
export class GoalListPage implements OnInit {
  metas$!: Observable<Meta[]>;
  tareas$!: Observable<Tarea[]>;
  habitos$!: Observable<Habito[]>;
  isLoading = true;
  userId: string = '';

  constructor(
    private goalService: GoalService,
    private taskService: TaskService,
    private habitoService: HabitoService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.isLoading = true;
    const user = await this.authService.getCurrentUser();
    if (!user?.uid) return;
    this.userId = user.uid;
    this.metas$ = this.goalService.getMetas(this.userId);
    this.tareas$ = this.taskService.getTasks(this.userId);
    this.habitos$ = this.habitoService.getHabitos(this.userId);
    this.metas$.subscribe(() => this.isLoading = false);
  }

  async abrirModalMeta() {
    const modal = await this.modalCtrl.create({
      component: GoalFormComponent
    });
    await modal.present();
    await modal.onWillDismiss();
    await this.cargarDatos();
  }

  verDetalleMeta(meta: Meta) {
    if (meta.id) {
      this.router.navigate(['/goal-detail', meta.id]);
    }
  }

  getProgresoMeta(meta: Meta, tareas: Tarea[], habitos: Habito[]): number {
    // Implementa tu lógica de progreso aquí
    return 0;
  }

  getResumenMeta(meta: Meta, tareas: Tarea[], habitos: Habito[]): string {
    // Implementa tu lógica de resumen aquí
    return '';
  }

  async eliminarMeta(meta: Meta) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar meta',
      message: `¿Seguro que quieres eliminar la meta "<b>${meta.titulo}</b>"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            if (this.userId && meta.id) {
              await this.goalService.eliminarMeta(this.userId, meta.id);
              await this.cargarDatos();
            }
          }
        }
      ]
    });
    await alert.present();
  }
  async editarMeta(meta: Meta) {
  const modal = await this.modalCtrl.create({
    component: GoalFormComponent,
    componentProps: { meta }
  });
  await modal.present();
  const { data } = await modal.onWillDismiss();
  if (data?.actualizada) {
    this.cargarDatos(); // O refresca la lista de metas si tienes otro método
  }
}

  async handleRefresh(event: any) {
    await this.cargarDatos();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
  getTaskCountForMeta(meta: Meta, allTasks: Tarea[]): number {
  if (!allTasks) return 0;
  return allTasks.filter(t => t.metaId === meta.id).length;
}

getHabitCountForMeta(meta: Meta, allHabits: Habito[]): number {
  if (!allHabits) return 0;
  return allHabits.filter(h => h.metaId === meta.id).length;
}
}
