import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Meta } from 'src/app/models/meta.model';
import { Tarea } from 'src/app/models/tarea.model';
import { GoalService } from 'src/app/services/goal.service';
import { AuthService } from 'src/app/services/auth.service';
import { TaskService } from 'src/app/services/task.service';
import { Observable, of } from 'rxjs';
import { switchMap, map, take } from 'rxjs/operators';
import { Habito } from 'src/app/models/habito.model';
import { HabitoService } from 'src/app/services/habito.service';
import { ModalController } from '@ionic/angular';
import { TaskFormComponent } from 'src/app/components/shared-components/task-form/task-form.component';
import { HabitoFormComponent } from 'src/app/components/shared-components/habito-form/habito-form.component';

@Component({
  selector: 'app-goal-detail',
  templateUrl: './goal-detail.page.html',
  styleUrls: ['./goal-detail.page.scss'],
  standalone: false
})
export class GoalDetailPage implements OnInit {

  metaId: string | null = null;
  meta$: Observable<Meta | null> = of(null);
  tareas$: Observable<Tarea[]> = of([]);
  habitos$: Observable<Habito[]> = of([]);

  constructor(
    private route: ActivatedRoute,
    private goalService: GoalService,
    private authService: AuthService,
    private taskService: TaskService,
    private habitoService: HabitoService,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.metaId = this.route.snapshot.paramMap.get('id');
    this.meta$ = this.authService.user$.pipe(
      switchMap(user => {
        if (user && this.metaId) {
          this.tareas$ = this.taskService.getTasks(user.uid).pipe(
            map((tareas: Tarea[]) => tareas.filter((t: Tarea) => t.metaId === this.metaId))
          );
          this.habitos$ = this.habitoService.getHabitos(user.uid).pipe(
            map((habitos: Habito[]) => habitos.filter((h: Habito) => h.metaId === this.metaId))
          );
          return this.goalService.getMetaById(this.metaId, user.uid);
        }
        return of(null);
      })
    );
  }

  async abrirModalTarea(tarea?: Tarea) {
    const modal = await this.modalCtrl.create({
      component: TaskFormComponent,
      componentProps: {
        metaId: this.metaId,
        tarea: tarea ? { ...tarea } : undefined
      }
    });
    await modal.present();
  }

  async abrirModalHabito(habito?: Habito) {
    const modal = await this.modalCtrl.create({
      component: HabitoFormComponent,
      componentProps: {
        metaId: this.metaId,
        habito: habito ? { ...habito } : undefined
      }
    });
    await modal.present();
  }

  async eliminarTarea(tarea: Tarea) {
    const user = await this.authService.user$.pipe(take(1)).toPromise();
    if (user && tarea.id) {
      await this.taskService.eliminarTask(user.uid, tarea.id);
    }
  }

  async eliminarHabito(habito: Habito) {
    const user = await this.authService.user$.pipe(take(1)).toPromise();
    if (user && habito.id) {
      await this.habitoService.eliminarHabito(user.uid, habito.id);
    }
  }
  getProgresoHabito(habito: Habito): number {
  const meta = habito.metaRacha ?? 21; // Usa la meta personalizada o 21 por defecto
  if (!habito.rachaActual) return 0;
  return Math.min(habito.rachaActual / meta, 1);
}
getProgresoMeta(tareas: Tarea[], habitos: Habito[]): number {
  const totalTareas = tareas.length;
  const tareasCompletadas = tareas.filter(t => t.completada).length;
  const totalHabitos = habitos.length;
  const habitosCompletados = habitos.filter(h => this.getProgresoHabito(h) >= 1).length;

  const total = totalTareas + totalHabitos;
  const completados = tareasCompletadas + habitosCompletados;

  return total > 0 ? completados / total : 0;
}
}
