import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, AlertController, ToastController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Recordatorio } from '../../../models/recordatorio.model';
import { RecordatorioService } from '../../../services/recordatorio.service';
import { AuthService } from '../../../services/auth.service';

// 🔥 CONSTANTES LOCALES
const CATEGORIAS_RECORDATORIO = {
  personal: { label: 'Personal', emoji: '👤', icon: 'person' },
  trabajo: { label: 'Trabajo', emoji: '💼', icon: 'briefcase' },
  salud: { label: 'Salud', emoji: '🏥', icon: 'medical' },
  estudio: { label: 'Estudio', emoji: '📚', icon: 'library' },
  ejercicio: { label: 'Ejercicio', emoji: '💪', icon: 'fitness' },
  citas: { label: 'Citas', emoji: '📅', icon: 'calendar' }
};

const PRIORIDADES_RECORDATORIO = {
  baja: { label: 'Baja', emoji: '🟢', color: 'success' },
  media: { label: 'Media', emoji: '🟡', color: 'warning' },
  alta: { label: 'Alta', emoji: '🔴', color: 'danger' }
};

@Component({
  selector: 'app-recordatorios',
  templateUrl: './recordatorios.page.html',
  styleUrls: ['./recordatorios.page.scss'],
  standalone: false
})
export class RecordatoriosPage implements OnInit, OnDestroy {
  recordatorios: Recordatorio[] = [];
  recordatoriosHoy: Recordatorio[] = [];
  recordatoriosProximos: Recordatorio[] = [];
  currentUser: any;

  private subscriptions: Subscription[] = [];

  // Para la UI
  vistaActual: 'todos' | 'hoy' | 'proximos' = 'todos';
  cargando = true;

  constructor(
    private recordatorioService: RecordatorioService,
    private authService: AuthService,
    private router: Router,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    // Obtener usuario actual
    const userSub = this.authService.user$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.cargarRecordatorios();
      }
    });
    this.subscriptions.push(userSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  cargarRecordatorios() {
    if (!this.currentUser?.uid) return;

    // 🔥 ARREGLAR: Sin parámetros (usa user$ interno)
    const sub1 = this.recordatorioService.obtenerRecordatorios()
      .subscribe((recordatorios: Recordatorio[]) => {
        this.recordatorios = recordatorios;
        this.recordatoriosHoy = this.filtrarRecordatoriosHoy(recordatorios);
        this.recordatoriosProximos = this.filtrarRecordatoriosProximos(recordatorios);
        this.cargando = false;
      });

    this.subscriptions.push(sub1);
  }

  // 🔥 MÉTODO AUXILIAR para normalizar fechas
  private toDate(fecha: any): Date {
    if (fecha instanceof Date) return fecha;
    if (fecha && typeof fecha.toDate === 'function') return fecha.toDate(); // Firestore Timestamp
    return new Date(fecha); // string o número
  }

  // 🔥 MÉTODOS DE FILTRADO LOCAL
  private filtrarRecordatoriosHoy(recordatorios: Recordatorio[]): Recordatorio[] {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

    return recordatorios.filter(r => {
      const fechaRecordatorio = this.toDate(r.fechaHora);
      return fechaRecordatorio >= inicioHoy && fechaRecordatorio <= finHoy && !r.completado;
    });
  }

  private filtrarRecordatoriosProximos(recordatorios: Recordatorio[]): Recordatorio[] {
    const hoy = new Date();
    const proximosSieteDias = new Date();
    proximosSieteDias.setDate(hoy.getDate() + 7);

    return recordatorios.filter(r => {
      const fechaRecordatorio = this.toDate(r.fechaHora);
      return fechaRecordatorio > hoy && fechaRecordatorio <= proximosSieteDias && !r.completado;
    }).sort((a, b) => this.toDate(a.fechaHora).getTime() - this.toDate(b.fechaHora).getTime());
  }

  // Cambiar vista
  cambiarVista(event: any) {
    this.vistaActual = event.detail.value;
  }

  // Obtener recordatorios según vista actual
  get recordatoriosActuales(): Recordatorio[] {
    switch (this.vistaActual) {
      case 'hoy': return this.recordatoriosHoy;
      case 'proximos': return this.recordatoriosProximos;
      default: return this.recordatorios.filter(r => !r.completado);
    }
  }

  // Getter para estadísticas
  get totalRecordatorios(): number {
    return this.recordatorios.length;
  }

  get recordatoriosCompletados(): number {
    return this.recordatorios.filter(r => r.completado).length;
  }

  get recordatoriosPendientes(): number {
    return this.recordatorios.filter(r => !r.completado).length;
  }

  // Crear nuevo recordatorio
  crearRecordatorio() {
    this.router.navigate(['/recordatorios/crear']);
  }

  // Editar recordatorio
 editarRecordatorio(id: string) {
  this.router.navigate(['/recordatorios/editar', id]);
}

  // 🔥 COMPLETAR RECORDATORIO CORREGIDO
  async completarRecordatorio(recordatorio: Recordatorio) {
    if (!recordatorio.id) return;

    const loading = await this.loadingCtrl.create({
      message: 'Completando...'
    });
    await loading.present();

    try {
      await this.recordatorioService.marcarCompletado(recordatorio.id, !recordatorio.completado);

      const toast = await this.toastCtrl.create({
        message: recordatorio.completado ? '↩️ Marcado como pendiente' : '✅ Recordatorio completado',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error al completar:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error al completar recordatorio',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  // Mostrar opciones del recordatorio
  async mostrarOpciones(recordatorio: Recordatorio) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: recordatorio.titulo,
      buttons: [
        {
          text: 'Editar',
          icon: 'create-outline',
          handler: () => this.editarRecordatorio(recordatorio.id!)
        },
        {
          text: recordatorio.completado ? 'Marcar pendiente' : 'Completar',
          icon: recordatorio.completado ? 'radio-button-off-outline' : 'checkmark-circle-outline',
          handler: () => this.completarRecordatorio(recordatorio)
        },
        {
          text: 'Eliminar',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => this.confirmarEliminacion(recordatorio)
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  // Confirmar eliminación
  async confirmarEliminacion(recordatorio: Recordatorio) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar "${recordatorio.titulo}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.eliminarRecordatorio(recordatorio.id!)
        }
      ]
    });
    await alert.present();
  }

  // 🔥 ELIMINAR RECORDATORIO CORREGIDO
  async eliminarRecordatorio(id: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Eliminando...'
    });
    await loading.present();

    try {
      await this.recordatorioService.eliminar(id);

      const toast = await this.toastCtrl.create({
        message: '🗑️ Recordatorio eliminado',
        duration: 2000,
        color: 'medium'
      });
      await toast.present();
    } catch (error) {
      console.error('Error al eliminar:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error al eliminar recordatorio',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  // 🔥 HELPERS PARA LA UI
  formatearFecha(fecha: any): string {
    const fechaObj = this.toDate(fecha);
    const ahora = new Date();
    const diferencia = fechaObj.getTime() - ahora.getTime();
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (dias === 0) {
      if (horas === 0) return 'Ahora';
      return horas > 0 ? `En ${horas}h` : `Hace ${Math.abs(horas)}h`;
    } else if (dias === 1) {
      return 'Mañana';
    } else if (dias === -1) {
      return 'Ayer';
    } else if (dias > 0) {
      return `En ${dias} días`;
    } else {
      return `Hace ${Math.abs(dias)} días`;
    }
  }

  obtenerColorTiempo(fecha: any): string {
    const fechaObj = this.toDate(fecha);
    const ahora = new Date();
    const diferencia = fechaObj.getTime() - ahora.getTime();
    const horas = diferencia / (1000 * 60 * 60);

    if (horas < 0) return 'danger'; // Pasado
    if (horas < 2) return 'warning'; // Próximo (menos de 2h)
    if (horas < 24) return 'primary'; // Hoy
    return 'medium'; // Futuro
  }

  obtenerIconoCategoria(categoria: string): string {
    return CATEGORIAS_RECORDATORIO[categoria as keyof typeof CATEGORIAS_RECORDATORIO]?.icon || 'calendar-outline';
  }

  obtenerColorPrioridad(prioridad: string): string {
    return PRIORIDADES_RECORDATORIO[prioridad as keyof typeof PRIORIDADES_RECORDATORIO]?.color || 'medium';
  }

  obtenerEmojiCategoria(categoria: string): string {
    return CATEGORIAS_RECORDATORIO[categoria as keyof typeof CATEGORIAS_RECORDATORIO]?.emoji || '📅';
  }

  obtenerEmojiPrioridad(prioridad: string): string {
    return PRIORIDADES_RECORDATORIO[prioridad as keyof typeof PRIORIDADES_RECORDATORIO]?.emoji || '⚪';
  }

  // Refresh
  async refrescar(event: any) {
    this.cargarRecordatorios();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}
