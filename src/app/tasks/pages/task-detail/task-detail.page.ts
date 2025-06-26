import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TaskService } from 'src/app/services/task.service';
import { SubtareaService } from 'src/app/services/subtarea.service';
import { Tarea } from 'src/app/models/tarea.model';
import { Subtarea } from 'src/app/models/subtarea.model';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.page.html',
  styleUrls: ['./task-detail.page.scss'],
  standalone: false
})
export class TaskDetailPage implements OnInit {
  tareaId: string = '';
  tarea?: Tarea;
  subtareas: Subtarea[] = [];
  userId: string = '';
  nuevoTitulo: string = '';

  constructor(
    private route: ActivatedRoute,
    private taskService: TaskService,
    private subtareaService: SubtareaService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.tareaId = this.route.snapshot.paramMap.get('id') || '';
    const user = await this.authService.getCurrentUser();
    this.userId = user?.uid || '';

    // Cargar la tarea principal
    this.taskService.getTaskById(this.userId, this.tareaId).subscribe(t => this.tarea = t);

    // Cargar las subtareas
    this.subtareaService.getSubtareas(this.userId, this.tareaId).subscribe(sts => this.subtareas = sts);
  }

  agregarSubtarea() {
    if (!this.nuevoTitulo.trim()) return;
    this.subtareaService.agregarSubtarea(this.userId, {
      tareaId: this.tareaId,
      titulo: this.nuevoTitulo,
      completada: false
      // No pongas fechaCreacion aquí, el service lo setea automáticamente
    });
    this.nuevoTitulo = '';
  }

  eliminarSubtarea(subtareaId: string) {
    this.subtareaService.eliminarSubtarea(this.userId, subtareaId);
  }
  actualizarEstadoSubtarea(subtarea: Subtarea) {
  if (!subtarea.id) return;
  this.subtareaService.actualizarSubtarea(this.userId, subtarea.id, { completada: subtarea.completada });
}
}
