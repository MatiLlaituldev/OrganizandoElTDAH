import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { EstadisticasService } from 'src/app/services/estadisticas.service';
import { InformeMensual } from 'src/app/models/informe-mensual.model';
import { RegistroTarea } from 'src/app/models/registro-tarea.model';
import { RegistroHabito } from 'src/app/models/registro-habito.model';
import { Meta } from 'src/app/models/meta.model';
import { EstadoAnimoEnergia } from 'src/app/models/estado-animo-energia.model';
import { TaskService } from 'src/app/services/task.service';
import { HabitoService } from 'src/app/services/habito.service';
import { GoalService } from 'src/app/services/goal.service';
import { EstadoAnimoService } from 'src/app/services/estado-animo.service';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis
} from 'ng-apexcharts';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-informe-mensual',
  templateUrl: './informe-mensual.page.html',
  styleUrls: ['./informe-mensual.page.scss'],
  standalone: false
})
export class InformeMensualPage implements OnInit {
  informeActual?: InformeMensual;
  cargando = true;
  userId?: string;
  errorCarga = false;

  // Configuración del gráfico
  chartSeries: ApexAxisChartSeries = [
    {
      name: 'Estadísticas',
      data: []
    }
  ];
  chartOptions: ApexChart = {
    type: 'bar',
    height: 300
  };
  chartXAxis: ApexXAxis = {
    categories: [
      'Tareas %',
      'Hábitos %',
      'Metas %',
      'Ánimo',
      'Energía'
    ]
  };
  chartYAxis: ApexYAxis = {
    min: 0,
    max: 100
  };

  constructor(
    private authService: AuthService,
    private estadisticasService: EstadisticasService,
    private taskService: TaskService,
    private habitoService: HabitoService,
    private goalService: GoalService,
    private estadoAnimoService: EstadoAnimoService
  ) {}

  ngOnInit() {
    console.log('ngOnInit ejecutado');
    this.authService.user$.subscribe(user => {
      console.log('user$ emitido:', user);
      this.userId = user?.uid;
      if (!this.userId) {
        this.cargando = false;
        this.errorCarga = true;
        console.error('No hay usuario autenticado');
        return;
      }

      const hoy = new Date();
      const anio = hoy.getFullYear();
      const mes = hoy.getMonth();

      // Solo calculamos el informe, sin leer ni guardar en la base
      this.cargarDatosYCalcularInforme(anio, mes);
    });
  }

  async cargarDatosYCalcularInforme(anio: number, mes: number) {
    this.cargando = true;
    console.log('Iniciando carga de datos para informe mensual...');
    try {
      const [tareas, habitos, metas, estados] = await Promise.all([
        firstValueFrom(this.taskService.getTodosRegistrosTareas(this.userId!)),
        firstValueFrom(this.habitoService.getTodosRegistrosHabitos(this.userId!)),
        firstValueFrom(this.goalService.getMetas(this.userId!)),
        firstValueFrom(this.estadoAnimoService.getRegistrosPorRango(
          this.userId!,
          new Date(anio, mes, 1),
          new Date(anio, mes + 1, 0)
        ))
      ]);
      console.log('Tareas:', tareas);
      console.log('Hábitos:', habitos);
      console.log('Metas:', metas);
      console.log('Estados:', estados);

      this.informeActual = this.estadisticasService.calcularInformeMensual(
        this.userId!, anio, mes,
        tareas as RegistroTarea[],
        habitos as RegistroHabito[],
        metas as Meta[],
        estados as EstadoAnimoEnergia[]
      );
      console.log('Informe generado SOLO con estadisticasService:', this.informeActual);

      this.cargando = false;
      this.errorCarga = false;
      this.chartSeries = [
        {
          name: 'Estadísticas',
          data: [
            this.informeActual.porcentajeTareas,
            this.informeActual.porcentajeHabitos,
            this.informeActual.porcentajeMetas,
            this.informeActual.promedioAnimo * 20,
            this.informeActual.promedioEnergia * 20
          ]
        }
      ];
    } catch (err) {
      console.error('Error al cargar datos para informe mensual:', err);
      this.cargando = false;
      this.errorCarga = true;
    }
  }
}
