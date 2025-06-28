import { Component, OnInit } from '@angular/core';
import { EstadisticasService } from 'src/app/services/estadisticas.service';
import { GoalService } from 'src/app/services/goal.service';
import { Meta } from 'src/app/models/meta.model';
import { AuthService } from 'src/app/services/auth.service';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis
} from 'ng-apexcharts';

@Component({
  selector: 'app-goal-stats',
  templateUrl: './goal-stats.page.html',
  styleUrls: ['./goal-stats.page.scss'],
  standalone: false
})
export class GoalStatsPage implements OnInit {
  metas: Meta[] = [];
  metasCompletadasMes: number = 0;
  porcentajeMetasCompletadas: number = 0;
  metasActivas: number = 0;

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
    categories: ['Completadas Mes', 'Porcentaje Completadas', 'Activas']
  };
  chartYAxis: ApexYAxis = {
    min: 0
  };

  constructor(
    private estadisticasService: EstadisticasService,
    private goalService: GoalService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      const userId = user?.uid;
      if (!userId) return;

      this.goalService.getMetas(userId).subscribe((metas: Meta[]) => {
        this.metas = metas;
        this.metasCompletadasMes = this.estadisticasService.metasCompletadasEsteMes(metas);
        this.porcentajeMetasCompletadas = this.estadisticasService.porcentajeMetasCompletadas(metas);
        this.metasActivas = this.estadisticasService.metasActivas(metas);

        // Actualizar datos del gráfico
        this.chartSeries = [
          {
            name: 'Estadísticas',
            data: [
              this.metasCompletadasMes,
              this.porcentajeMetasCompletadas,
              this.metasActivas
            ]
          }
        ];
      });
    });
  }
}
