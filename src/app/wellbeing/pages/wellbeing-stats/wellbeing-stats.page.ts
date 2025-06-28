import { Component, OnInit } from '@angular/core';
import { EstadisticasService } from 'src/app/services/estadisticas.service';
import { EstadoAnimoEnergia } from 'src/app/models/estado-animo-energia.model';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexTitleSubtitle, ApexYAxis } from 'ng-apexcharts';

@Component({
  selector: 'app-wellbeing-stats',
  templateUrl: './wellbeing-stats.page.html',
  styleUrls: ['./wellbeing-stats.page.scss'],
  standalone: false
})
export class WellbeingStatsPage implements OnInit {

  // Opciones para mostrar textos y emojis
  opcionesAnimo = [
    { valor: 5, texto: 'Feliz', emoji: '😊' },
    { valor: 4, texto: 'Contento', emoji: '🙂' },
    { valor: 3, texto: 'Neutral', emoji: '😐' },
    { valor: 2, texto: 'Ansioso', emoji: '😟' },
    { valor: 1, texto: 'Muy Mal', emoji: '😩' }
  ];

  opcionesEnergia = [
    { valor: 3, texto: 'Alta', emoji: '⚡️' },
    { valor: 2, texto: 'Media', emoji: '🔋' },
    { valor: 1, texto: 'Baja', emoji: '🔌' }
  ];

  getTextoAnimo(valor: number): string {
    return this.opcionesAnimo.find(op => op.valor === valor)?.texto || 'Desconocido';
  }
  getEmojiAnimo(valor: number): string {
    return this.opcionesAnimo.find(op => op.valor === valor)?.emoji || '';
  }
  getTextoEnergia(valor: number): string {
    return this.opcionesEnergia.find(op => op.valor === valor)?.texto || 'Desconocido';
  }
  getEmojiEnergia(valor: number): string {
    return this.opcionesEnergia.find(op => op.valor === valor)?.emoji || '';
  }

  registros: EstadoAnimoEnergia[] = [];
  fechas: string[] = [];
  series: ApexAxisChartSeries = [];
  chartOptions: ApexChart = {
    type: 'line',
    height: 350
  };
  xaxis: ApexXAxis = {};
  yaxis: ApexYAxis = {
    min: 1,
    max: 5,
    tickAmount: 4,
    labels: {
      formatter: (val: number) => Math.round(val).toString()
    }
  };
  title: ApexTitleSubtitle = {
    text: 'Estado de Ánimo Diario'
  };

  promedioAnimo: number = 0;
  mejorDia: EstadoAnimoEnergia | null = null;
  peorDia: EstadoAnimoEnergia | null = null;

  promedioEnergia: number = 0;
  mejorEnergia: EstadoAnimoEnergia | null = null;
  peorEnergia: EstadoAnimoEnergia | null = null;

  constructor(
    private estadisticasService: EstadisticasService,
    private firestore: Firestore,
    private auth: Auth
  ) { }

  ngOnInit() {
    this.cargarRegistros();
  }

  async cargarRegistros() {
    const user = this.auth.currentUser;
    const userId = user?.uid;
    console.log('userId usado:', userId);

    if (!userId) {
      console.warn('No hay usuario autenticado, no se puede cargar registros.');
      return;
    }

    // Generar fechas de la última semana (YYYY-MM-DD)
    const hoy = new Date();
    const fechasSemana: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);
      fechasSemana.push(fecha.toISOString().slice(0, 10));
    }
    this.fechas = fechasSemana;

    const col = collection(this.firestore, `usuarios/${userId}/estadosAnimoEnergia`);
    collectionData(col, { idField: 'id' }).pipe(
      map((docs: any[]) => docs as EstadoAnimoEnergia[])
    ).subscribe(registros => {
      console.log('Registros recibidos de Firestore:', registros);

      this.registros = registros.sort((a, b) => a.fecha.localeCompare(b.fecha));

      // Para cada fecha de la semana, busca el registro o pon null
      const data = this.fechas.map(fecha => {
        const reg = this.registros.find(r => r.fecha === fecha);
        return reg ? reg.estadoAnimo : null;
      });

      // Energía para la semana (opcional: puedes hacer otra gráfica)
      const dataEnergia = this.fechas.map(fecha => {
        const reg = this.registros.find(r => r.fecha === fecha);
        return reg ? reg.nivelEnergia : null;
      });

      // Debug
      console.log('Fechas (semana):', this.fechas);
      console.log('Data para gráfica ánimo:', data);
      console.log('Data para gráfica energía:', dataEnergia);

      this.series = [
        {
          name: 'Ánimo',
          data: data
        }
        // Si quieres agregar energía como otra serie, descomenta:
        // ,{ name: 'Energía', data: dataEnergia }
      ];

      this.xaxis = {
        categories: this.fechas
      };

      // Estadísticas adicionales
      this.promedioAnimo = this.estadisticasService.promedioAnimoTotal(this.registros, this.fechas);
      this.mejorDia = this.estadisticasService.mejorDiaAnimo(this.registros);
      this.peorDia = this.estadisticasService.peorDiaAnimo(this.registros);

      // Estadísticas de energía
      this.promedioEnergia = this.registros.length
        ? +(this.registros.reduce((acc, r) => acc + r.nivelEnergia, 0) / this.registros.length).toFixed(2)
        : 0;
      this.mejorEnergia = this.registros.length
        ? this.registros.reduce((prev, curr) => (curr.nivelEnergia > prev.nivelEnergia ? curr : prev))
        : null;
      this.peorEnergia = this.registros.length
        ? this.registros.reduce((prev, curr) => (curr.nivelEnergia < prev.nivelEnergia ? curr : prev))
        : null;
    });
  }
}
