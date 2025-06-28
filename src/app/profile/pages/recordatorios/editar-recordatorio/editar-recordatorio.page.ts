import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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
  selector: 'app-editar-recordatorio',
  templateUrl: './editar-recordatorio.page.html',
  styleUrls: ['./editar-recordatorio.page.scss'],
  standalone: false
})
export class EditarRecordatorioPage implements OnInit {

  recordatorio: Recordatorio = {
    id: '',
    titulo: '',
    descripcion: '',
    fechaHora: new Date(),
    categoria: 'personal',
    prioridad: 'media',
    completado: false,
    fechaCreacion: new Date(),
    userId: '',
    notificaciones: []
  };

  recordatorioId: string = '';
  cargando = false;
  currentUser: any = null;
  categorias = Object.entries(CATEGORIAS_RECORDATORIO);
  prioridades = Object.entries(PRIORIDADES_RECORDATORIO);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private recordatorioService: RecordatorioService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    // Obtener ID del recordatorio desde la URL
    this.recordatorioId = this.route.snapshot.paramMap.get('id') || '';

    this.authService.user$.subscribe(user => {
      this.currentUser = user;
      if (user && this.recordatorioId) {
        this.cargarRecordatorio();
      }
    });
  }

  // Cargar recordatorio existente
  async cargarRecordatorio() {
    this.cargando = true;
    const loading = await this.loadingController.create({
      message: 'Cargando recordatorio...'
    });
    await loading.present();

    try {
      this.recordatorioService.obtenerRecordatorio(this.recordatorioId).subscribe(
        recordatorio => {
          if (recordatorio) {
            // Convertir fechas de Firestore a Date
            this.recordatorio = {
              ...recordatorio,
              fechaHora: this.toDate(recordatorio.fechaHora),
              fechaCreacion: this.toDate(recordatorio.fechaCreacion)
            };
          } else {
            this.mostrarError('Recordatorio no encontrado');
            this.router.navigate(['/recordatorios']);
          }
          this.cargando = false;
          loading.dismiss();
        },
        error => {
          console.error('Error al cargar recordatorio:', error);
          this.mostrarError('Error al cargar el recordatorio');
          this.router.navigate(['/recordatorios']);
          this.cargando = false;
          loading.dismiss();
        }
      );
    } catch (error) {
      this.cargando = false;
      await loading.dismiss();
      this.mostrarError('Error al cargar el recordatorio');
      this.router.navigate(['/recordatorios']);
    }
  }

  // Convertir cualquier fecha a Date
  private toDate(fecha: any): Date {
    if (!fecha) return new Date();
    if (fecha instanceof Date) return fecha;

    // Casting explícito para evitar error de TypeScript
    const fechaAny = fecha as any;

    if (fechaAny && typeof fechaAny.toDate === 'function') {
      return fechaAny.toDate(); // Firestore Timestamp
    }
    if (fechaAny && fechaAny.seconds) {
      return new Date(fechaAny.seconds * 1000); // Firestore Timestamp manual
    }
    return new Date(fecha);
  }

  // Getters para la UI
  get categoriaSeleccionada() {
    return CATEGORIAS_RECORDATORIO[this.recordatorio.categoria as keyof typeof CATEGORIAS_RECORDATORIO];
  }

  get prioridadSeleccionada() {
    return PRIORIDADES_RECORDATORIO[this.recordatorio.prioridad as keyof typeof PRIORIDADES_RECORDATORIO];
  }

  get fechaFormateada(): string {
    if (!this.recordatorio.fechaHora) return '';
    try {
      const fecha = this.toDate(this.recordatorio.fechaHora);
      return fecha.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha no válida';
    }
  }

  // Getter para input datetime-local - CORREGIDO
  get fechaHoraISO(): string {
    if (!this.recordatorio.fechaHora) return '';

    try {
      const fecha = this.toDate(this.recordatorio.fechaHora);
      return fecha.toISOString().slice(0, 16);
    } catch (error) {
      console.error('Error al convertir fecha:', error);
      return new Date().toISOString().slice(0, 16);
    }
  }

  // Setter para input datetime-local
  set fechaHoraISO(value: string) {
    if (value) {
      this.recordatorio.fechaHora = new Date(value);
    }
  }

  // Métodos de UI
  asignarCategoria(categoria: string) {
    this.recordatorio.categoria = categoria as any;
  }

  asignarPrioridad(prioridad: string) {
    this.recordatorio.prioridad = prioridad as any;
  }

  // Guardar cambios
  async guardar() {
    if (!this.validarFormulario()) return;

    const loading = await this.loadingController.create({
      message: 'Guardando cambios...'
    });
    await loading.present();

    try {
      await this.recordatorioService.actualizar(this.recordatorioId, this.recordatorio);
      await loading.dismiss();
      this.mostrarExito('✅ Recordatorio actualizado exitosamente!');
      this.router.navigate(['/recordatorios']);
    } catch (error) {
      await loading.dismiss();
      this.mostrarError('Error al actualizar el recordatorio');
      console.error('Error:', error);
    }
  }

  // Validación del formulario
  private validarFormulario(): boolean {
    if (!this.recordatorio.titulo?.trim()) {
      this.mostrarError('El título es obligatorio');
      return false;
    }

    if (!this.recordatorio.fechaHora) {
      this.mostrarError('La fecha y hora son obligatorias');
      return false;
    }

    return true;
  }

  // Confirmar eliminación
  async confirmarEliminacion() {
    const alert = await this.alertController.create({
      header: '🗑️ Eliminar Recordatorio',
      message: '¿Estás seguro de que quieres eliminar este recordatorio?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.eliminarRecordatorio();
          }
        }
      ]
    });

    await alert.present();
  }

  // Eliminar recordatorio
  async eliminarRecordatorio() {
    const loading = await this.loadingController.create({
      message: 'Eliminando recordatorio...'
    });
    await loading.present();

    try {
      await this.recordatorioService.eliminar(this.recordatorioId);
      await loading.dismiss();
      this.mostrarExito('🗑️ Recordatorio eliminado exitosamente');
      this.router.navigate(['/recordatorios']);
    } catch (error) {
      await loading.dismiss();
      this.mostrarError('Error al eliminar el recordatorio');
      console.error('Error al eliminar:', error);
    }
  }

  // Volver a la lista
  volver() {
    this.router.navigate(['/recordatorios']);
  }

  // Mostrar mensajes
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
