import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { TaskService } from 'src/app/services/task.service';
import { SubtareaService } from 'src/app/services/subtarea.service';
import { EstadisticasService } from 'src/app/services/estadisticas.service';
import { Tarea } from 'src/app/models/tarea.model';
import { Subtarea } from 'src/app/models/subtarea.model';
import { RegistroTarea } from 'src/app/models/registro-tarea.model';

@Component({
  selector: 'app-task-stats',
  templateUrl: './task-stats.page.html',
  styleUrls: ['./task-stats.page.scss'],
  standalone: false
})
export class TaskStatsPage implements OnInit {
  // Tareas (conteo actual)
  tareasCompletadas = 0;
  tareasPendientes = 0;
  totalTareas = 0;
  chartOptionsTareas: any = {
    series: [0, 0],
    chart: { type: 'donut' },
    labels: ['Completadas', 'Pendientes'],
    colors: ['#007bff', '#ff4136'],
    legend: { position: 'bottom' }
  };

  // Subtareas (conteo actual)
  subtareasCompletadas = 0;
  subtareasPendientes = 0;
  totalSubtareas = 0;
  chartOptionsSubtareas: any = {
    series: [0, 0],
    chart: { type: 'donut' },
    labels: ['Completadas', 'Pendientes'],
    colors: ['#2ecc40', '#ff851b'],
    legend: { position: 'bottom' }
  };

  // Estadísticas históricas de tareas
  registros: RegistroTarea[] = [];
  fechas: string[] = [];
  rango: 'diario' | 'semanal' | 'mensual' = 'semanal';

  completadasPorFecha: number[] = [];
  porcentajeCumplimiento = 0;
  rachaActual = 0;
  promedioPorDia = 0;
  historicoSeries: any[] = [];

  constructor(
    private authService: AuthService,
    private taskService: TaskService,
    private subtareaService: SubtareaService,
    private estadisticasService: EstadisticasService
  ) {}

  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    if (user) {
      // Estadísticas de tareas (conteo actual)
      this.taskService.getTasks(user.uid).subscribe((tareas: Tarea[]) => {
        const tareasActivas = tareas.filter(t => !t.eliminada);
        this.totalTareas = tareasActivas.length;
        this.tareasCompletadas = tareasActivas.filter(t => t.completada).length;
        this.tareasPendientes = this.totalTareas - this.tareasCompletadas;
        this.chartOptionsTareas.series = [this.tareasCompletadas, this.tareasPendientes];
      });

      // Estadísticas de subtareas (conteo actual)
      this.subtareaService.getAllSubtareas(user.uid).subscribe((subtareas: Subtarea[]) => {
        this.totalSubtareas = subtareas.length;
        this.subtareasCompletadas = subtareas.filter(st => st.completada).length;
        this.subtareasPendientes = this.totalSubtareas - this.subtareasCompletadas;
        this.chartOptionsSubtareas.series = [this.subtareasCompletadas, this.subtareasPendientes];
      });

      // Estadísticas históricas de tareas (usando registros)
      // --- DEBUG: Fuerza la semana del 27 en adelante ---
      this.fechas = [
        '2025-06-27',
        '2025-06-28',
        '2025-06-29',
        '2025-06-30',
        '2025-07-01',
        '2025-07-02',
        '2025-07-03'
      ];
      // --- FIN DEBUG ---

      this.taskService.getTodosRegistrosTareas(user.uid).subscribe((registros: RegistroTarea[]) => {
        // Filtra registros solo para las fechas del rango
        this.registros = registros.filter(r => this.fechas.includes(r.fecha));
        this.completadasPorFecha = this.estadisticasService.tareasCompletadasPorFecha(this.registros, this.fechas);
        this.historicoSeries = [
          { name: 'Completadas', data: this.completadasPorFecha }
        ];
        this.porcentajeCumplimiento = this.estadisticasService.porcentajeCumplimientoTareas(this.registros, this.fechas);
        this.rachaActual = this.estadisticasService.rachaActualTareas(this.registros, this.fechas);
        this.promedioPorDia = this.estadisticasService.promedioTareasPorDia(this.registros, this.fechas);
      });
    }
  }
}
