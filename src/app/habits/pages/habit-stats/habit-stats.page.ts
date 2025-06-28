import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { HabitoService } from 'src/app/services/habito.service';
import { EstadisticasService } from 'src/app/services/estadisticas.service';
import { RegistroHabito } from 'src/app/models/registro-habito.model';
import { Habito } from 'src/app/models/habito.model';

@Component({
  selector: 'app-habit-stats',
  templateUrl: './habit-stats.page.html',
  styleUrls: ['./habit-stats.page.scss'],
  standalone: false
})
export class HabitStatsPage implements OnInit {
  registros: RegistroHabito[] = [];
  habitos: Habito[] = [];
  fechas: string[] = [];
  rango: 'diario' | 'semanal' | 'mensual' = 'semanal';

  completadosPorFecha: number[] = [];
  porcentajeCumplimiento = 0;
  promedioPorDia = 0;
  historicoSeries: any[] = [];

  constructor(
    private authService: AuthService,
    private habitoService: HabitoService,
    public estadisticasService: EstadisticasService
  ) {}

  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    if (user) {
      this.fechas = this.estadisticasService.getFechasRango(this.rango);

      // Traer todos los registros de hábitos del usuario
      this.habitoService.getTodosRegistrosHabitos(user.uid).subscribe((registros: RegistroHabito[]) => {
        this.registros = registros.filter(r => this.fechas.includes(r.fecha));
        this.completadosPorFecha = this.estadisticasService.habitosCompletadosPorFecha(this.registros, this.fechas);
        this.historicoSeries = [
          { name: 'Completados', data: this.completadosPorFecha }
        ];
        this.porcentajeCumplimiento = this.estadisticasService.porcentajeCumplimientoHabitos(this.registros, this.fechas);
        this.promedioPorDia = this.estadisticasService.promedioHabitosPorDia(this.registros, this.fechas);

        // Traer todos los hábitos del usuario y calcular la racha actual para cada uno
        this.habitoService.getHabitos(user.uid).subscribe((habitos: Habito[]) => {
          this.habitos = habitos.map(habito => {
            const racha = habito.id
              ? this.estadisticasService.rachaActualHabito(
                  this.registros,
                  this.fechas,
                  habito.id
                )
              : 0;
            return { ...habito, rachaActual: racha };
          });
        });
      });
    }
  }

  // Calcula el progreso de un hábito para la barra de progreso
  progresoHabito(habito: Habito): number {
    if (!habito.metaRacha) return 0;
    return Math.min((habito.rachaActual || 0) / habito.metaRacha, 1);
  }
}
