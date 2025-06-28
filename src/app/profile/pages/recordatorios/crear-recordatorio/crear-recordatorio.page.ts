import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';

import { AuthService } from '../../../../services/auth.service';
import { RecordatorioService } from '../../../../services/recordatorio.service';
import { Recordatorio } from '../../../../models/recordatorio.model';

const CATEGORIAS_RECORDATORIO = {
  personal: { label: 'Personal', emoji: '👤' },
  trabajo: { label: 'Trabajo', emoji: '💼' },
  salud: { label: 'Salud', emoji: '🏥' },
  estudio: { label: 'Estudio', emoji: '📚' },
  ejercicio: { label: 'Ejercicio', emoji: '💪' },
  citas: { label: 'Citas', emoji: '📅' }
};

const PRIORIDADES_RECORDATORIO = {
  baja: { label: 'Baja', emoji: '🟢', color: 'success' },
  media: { label: 'Media', emoji: '🟡', color: 'warning' },
  alta: { label: 'Alta', emoji: '🔴', color: 'danger' }
};

@Component({
  selector: 'app-crear-recordatorio',
  templateUrl: './crear-recordatorio.page.html',
  styleUrls: ['./crear-recordatorio.page.scss'],
  standalone: false
})
export class CrearRecordatorioPage implements OnInit {

  recordatorio: Recordatorio = {
    id: '',
    titulo: '',
    descripcion: '',
    fechaHora: new Date(), // Siempre tipo Date
    categoria: 'personal',
    prioridad: 'media',
    completado: false,
    fechaCreacion: new Date(),
    userId: '',
    notificaciones: []
  };

  notificacionHabilitada = true;
  currentUser: any = null;

  fechaMinima: string = new Date().toISOString();

  categorias = Object.entries(CATEGORIAS_RECORDATORIO);
  prioridades = Object.entries(PRIORIDADES_RECORDATORIO);

  constructor(
    private router: Router,
    private authService: AuthService,
    private recordatorioService: RecordatorioService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.fechaMinima = new Date().toISOString();

    this.authService.user$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.recordatorio.userId = user.uid;
      }
    });

    // Fecha por defecto: mañana a las 9 AM

  }

  get categoriaSeleccionada() {
    return CATEGORIAS_RECORDATORIO[this.recordatorio.categoria as keyof typeof CATEGORIAS_RECORDATORIO];
  }

  get prioridadSeleccionada() {
    return PRIORIDADES_RECORDATORIO[this.recordatorio.prioridad as keyof typeof PRIORIDADES_RECORDATORIO];
  }

  get fechaFormateada(): string {
    if (!this.recordatorio.fechaHora) return '';
    const fecha = this.recordatorio.fechaHora;
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Getter para el input de ion-datetime
  get fechaHoraISO(): string {
    return this.recordatorio.fechaHora ? this.recordatorio.fechaHora.toISOString() : '';
  }

  asignarCategoria(categoria: string) {
    this.recordatorio.categoria = categoria as any;
  }

  asignarPrioridad(prioridad: string) {
    this.recordatorio.prioridad = prioridad as any;
  }

  // Cuando cambia el ion-datetime, convierte el string ISO a Date
  onFechaChange(isoString: string) {
    this.recordatorio.fechaHora = new Date(isoString);
  }

  async guardar() {
    if (!this.recordatorio.titulo?.trim()) {
      this.mostrarError('El título es obligatorio');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Creando recordatorio...'
    });
    await loading.present();

    try {
      await this.recordatorioService.crear(this.recordatorio);

      await loading.dismiss();
      this.mostrarExito('¡Recordatorio creado exitosamente!');
      this.router.navigate(['/recordatorios']);
    } catch (error) {
      await loading.dismiss();
      this.mostrarError('Error al crear el recordatorio');
      console.error('Error:', error);
    }
  }

  volver() {
    this.router.navigate(['/recordatorios']);
  }

  private async mostrarExito(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  private async mostrarError(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }
}
