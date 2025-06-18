import { Component, OnInit } from '@angular/core';
import { ModalController, ToastController, AlertController, LoadingController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { Etiqueta } from '../../../models/etiqueta.model';
import { EtiquetaService } from '../../../services/etiqueta.service';
import { EtiquetaFormComponent } from 'src/app/components/shared-components/etiqueta-form/etiqueta-form.component';

import { TaskService } from 'src/app/services/task.service';
import { AuthService } from 'src/app/services/auth.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-gestion-etiquetas',
  templateUrl: './gestion-etiquetas.page.html',
  styleUrls: ['./gestion-etiquetas.page.scss'],
  standalone: false, // FIX: Se elimina 'standalone: true' ya que este componente no es standalone
  // FIX: Se elimina la configuración 'standalone: true' y el array 'imports' si lo hubiera,
  // ya que este componente se declara en su propio NgModule.
})
export class GestionEtiquetasPage implements OnInit {

  etiquetas$!: Observable<Etiqueta[]>;
  private loading: HTMLIonLoadingElement | null = null;

  constructor(
    private etiquetaService: EtiquetaService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private taskService: TaskService,
    private authService: AuthService,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    this.cargarEtiquetas();
  }

  ionViewWillEnter() {
    this.cargarEtiquetas();
  }

  cargarEtiquetas() {
    this.etiquetas$ = this.etiquetaService.getEtiquetas();
  }

  async abrirFormulario(etiqueta?: Etiqueta) {
    const modal = await this.modalCtrl.create({
      component: EtiquetaFormComponent,
      componentProps: { etiqueta }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data && data.huboCambios) {
      this.cargarEtiquetas();
    }
  }

  async confirmarEliminacion(etiqueta: Etiqueta) {
    if (!etiqueta.id) return;

    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que quieres eliminar la etiqueta "${etiqueta.nombre}"? Esta acción no se puede deshacer y se quitará de todas las tareas asociadas.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.eliminarEtiqueta(etiqueta) },
      ],
    });

    await alert.present();
  }

  private async eliminarEtiqueta(etiqueta: Etiqueta) {
    const etiquetaId = etiqueta.id;
    if (!etiquetaId) return;

    await this.presentLoading('Eliminando etiqueta y limpiando tareas...');

    try {
      const user = await this.authService.getCurrentUser();
      if (!user) {
        throw new Error('Usuario no autenticado.');
      }

      // 1. Obtener todas las tareas del usuario
      const todasLasTareas = await this.taskService.getTasks(user.uid).pipe(first()).toPromise();

      // FIX: Comprobar si existen tareas antes de continuar
      if (!todasLasTareas || todasLasTareas.length === 0) {
        // Si no hay tareas, simplemente borramos la etiqueta
        await this.etiquetaService.deleteEtiqueta(etiquetaId);
        await this.dismissLoading();
        this.presentToast('Etiqueta eliminada con éxito.', 'success');
        return;
      }

      // 2. Filtrar solo las tareas que contienen la etiqueta a eliminar
      const tareasParaActualizar = todasLasTareas.filter(t =>
        t.etiquetas?.some(e => e.id === etiquetaId)
      );

      // 3. Preparar las promesas de actualización
      const promesasDeActualizacion = tareasParaActualizar
        .filter(tarea => !!tarea.id) // FIX: Asegurarse de que la tarea tenga un ID
        .map(tarea => {
          // FIX: Comprobar si 'etiquetas' existe antes de filtrar
          const nuevasEtiquetas = tarea.etiquetas ? tarea.etiquetas.filter(e => e.id !== etiquetaId) : [];
          return this.taskService.actualizarTask(user.uid, tarea.id!, { etiquetas: nuevasEtiquetas });
        });

      // 4. Ejecutar todas las promesas en paralelo
      await Promise.all([
        ...promesasDeActualizacion,
        this.etiquetaService.deleteEtiqueta(etiquetaId)
      ]);

      await this.dismissLoading();
      this.presentToast('Etiqueta eliminada y tareas actualizadas.', 'success');

    } catch (error) {
      console.error('Error al eliminar etiqueta y limpiar tareas:', error);
      await this.dismissLoading();
      this.presentToast('Error al eliminar la etiqueta.', 'danger');
    }
  }

  // --- Métodos de utilidad (Toast y Loading) ---
  async presentLoading(message: string) {
    if (this.loading) { await this.loading.dismiss(); }
    this.loading = await this.loadingCtrl.create({ message });
    await this.loading.present();
  }

  async dismissLoading() {
    if (this.loading) {
      await this.loading.dismiss();
      this.loading = null;
    }
  }

  async presentToast(mensaje: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      position: 'bottom',
      color: color,
    });
    toast.present();
  }
}
