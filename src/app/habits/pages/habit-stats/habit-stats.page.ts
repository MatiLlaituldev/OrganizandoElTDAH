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

      // Traer todos los hábitos del usuario
      this.habitoService.getHabitos(user.uid).subscribe((habitos: Habito[]) => {
        this.habitos = habitos;
      });

      // Traer todos los registros de hábitos del usuario
      this.habitoService.getTodosRegistrosHabitos(user.uid).subscribe((registros: RegistroHabito[]) => {
        this.registros = registros.filter(r => this.fechas.includes(r.fecha));
        this.completadosPorFecha = this.estadisticasService.habitosCompletadosPorFecha(this.registros, this.fechas);
        this.historicoSeries = [
          { name: 'Completados', data: this.completadosPorFecha }
        ];
        this.porcentajeCumplimiento = this.estadisticasService.porcentajeCumplimientoHabitos(this.registros, this.fechas);
        this.promedioPorDia = this.estadisticasService.promedioHabitosPorDia(this.registros, this.fechas);
      });
    }
  }
}
