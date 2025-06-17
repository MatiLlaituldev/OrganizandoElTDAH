import { Component, OnInit } from '@angular/core';
import { ModalController, ToastController, AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { Etiqueta } from '../../../models/etiqueta.model';
import { EtiquetaService } from '../../../services/etiqueta.service';
import { EtiquetaFormComponent } from 'src/app/components/shared-components/etiqueta-form/etiqueta-form.component';

@Component({
  selector: 'app-gestion-etiquetas',
  templateUrl: './gestion-etiquetas.page.html',
  styleUrls: ['./gestion-etiquetas.page.scss'],
  standalone: false
})
export class GestionEtiquetasPage implements OnInit {

  etiquetas$!: Observable<Etiqueta[]>;

  constructor(
    private etiquetaService: EtiquetaService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.cargarEtiquetas();
  }

  ionViewWillEnter() {
    // Se asegura de recargar las etiquetas cada vez que se entra a la página
    this.cargarEtiquetas();
  }

  cargarEtiquetas() {
    this.etiquetas$ = this.etiquetaService.getEtiquetas();
  }

  async abrirFormulario(etiqueta?: Etiqueta) {
    const modal = await this.modalCtrl.create({
      component: EtiquetaFormComponent,
      componentProps: {
        etiqueta: etiqueta // Pasa la etiqueta si estamos editando, si no, es undefined
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    // Si el formulario nos avisó que hubo cambios, recargamos la lista
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
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.eliminarEtiqueta(etiqueta);
          },
        },
      ],
    });

    await alert.present();
  }

  private async eliminarEtiqueta(etiqueta: Etiqueta) {
    if (!etiqueta.id) return;
    try {
      await this.etiquetaService.deleteEtiqueta(etiqueta.id);
      // Opcional pero recomendado: Llamar a un método en TaskService para quitar la etiqueta
      // de todas las tareas que la contengan.
      // await this.taskService.quitarEtiquetaDeTareas(etiqueta.id);
      this.presentToast('Etiqueta eliminada con éxito.', 'success');
    } catch (error) {
      console.error('Error al eliminar etiqueta:', error);
      this.presentToast('Error al eliminar la etiqueta.', 'danger');
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
