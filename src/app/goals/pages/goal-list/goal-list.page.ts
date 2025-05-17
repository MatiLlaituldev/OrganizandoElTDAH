// src/app/goals/pages/goal-list/goal-list.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController, ToastController, AlertController, LoadingController } from '@ionic/angular';
import { Observable, Subscription, of } from 'rxjs';
import { switchMap, catchError, tap, map, finalize } from 'rxjs/operators';
import { User } from '@firebase/auth';
import { Meta, EstadoMeta } from '../../../models/meta.model'; // Ajusta la ruta si es diferente
import { GoalService } from '../../../services/goal.service';   // Ajusta la ruta
import { AuthService } from '../../../services/auth.service'; // Ajusta la ruta
import { GoalFormComponent } from '../../../components/shared-components/goal-form/goal-form.component'; // Ajusta la ruta
import { take } from 'rxjs/operators';
@Component({
  selector: 'app-goal-list',
  templateUrl: './goal-list.page.html',
  styleUrls: ['./goal-list.page.scss'],
  standalone: false
})
export class GoalListPage implements OnInit, OnDestroy {

  metas$: Observable<Meta[]> = of([]);
  private authUser: User | null = null;
  private authSubscription: Subscription | undefined;
  private metasSubscription: Subscription | undefined; // Para manejar la suscripción a las metas

  isLoading: boolean = false;
  private loadingElement: HTMLIonLoadingElement | null = null;

  // Para los segmentos (opcional, pero útil para organizar)
  currentSegment: 'enProgreso' | 'alcanzada' = 'enProgreso';

  constructor(
    private modalCtrl: ModalController,
    private goalService: GoalService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController // Inyectado para los loadings de la página
  ) { }

  ngOnInit() {
    console.log('[GoalListPage] ngOnInit.');
    this.authSubscription = this.authService.user$.subscribe(user => {
      if (user && user.uid) {
        if (!this.authUser || this.authUser.uid !== user.uid) {
          this.authUser = user;
          console.log('[GoalListPage] Usuario autenticado:', user.uid);
          this.subscribeToMetas(user.uid);
        }
      } else {
        this.authUser = null;
        this.metas$ = of([]); // Limpiar metas si no hay usuario
        if (this.metasSubscription) {
          this.metasSubscription.unsubscribe();
        }
        this.isLoading = false;
        this.dismissLoading(); // Asegurarse de cerrar loadings
      }
    });
  }

  ionViewWillEnter() {
    console.log('[GoalListPage] ionViewWillEnter.');
    // Recargar metas si el usuario está logueado y la suscripción no está activa o se cerró
    if (this.authUser && this.authUser.uid) {
      if (!this.metasSubscription || this.metasSubscription.closed) {
        this.subscribeToMetas(this.authUser.uid);
      }
    }
  }

 subscribeToMetas(userId: string) {
  console.log(`[GoalListPage] subscribeToMetas para userId: ${userId}`);
  if (this.isLoading) return; // Evitar múltiples cargas simultáneas
  this.presentLoading('Cargando metas...');
  this.isLoading = true;

  if (this.metasSubscription && !this.metasSubscription.closed) {
    this.metasSubscription.unsubscribe();
  }

  let loadingCerrado = false;

  this.metasSubscription = this.goalService.getMetas(userId).pipe(
    map(metas => this.filterAndSortMetas(metas || [])),
    tap(filteredMetas => {
      console.log('[GoalListPage] Metas recibidas y filtradas:', filteredMetas.length);
      this.metas$ = of(filteredMetas);
      // Cerrar loading solo la primera vez que llegan datos
      if (!loadingCerrado && this.isLoading) {
        this.isLoading = false;
        this.dismissLoading();
        loadingCerrado = true;
      }
    }),
    catchError(error => {
      console.error('[GoalListPage] Error al cargar metas:', error);
      this.presentToast('Error al cargar las metas.', 'danger');
      this.metas$ = of([]);
      if (!loadingCerrado && this.isLoading) {
        this.isLoading = false;
        this.dismissLoading();
        loadingCerrado = true;
      }
      return of([]);
    })
    // NO uses finalize aquí, porque el observable nunca completa en tiempo real
  ).subscribe();
}

  filterAndSortMetas(metas: Meta[]): Meta[] {
    let filtered = metas.filter(meta => meta.estado === this.currentSegment);
    // Ordenar: las más recientes primero para 'enProgreso',
    // las más recientemente alcanzadas para 'alcanzada'
    if (this.currentSegment === 'enProgreso') {
      filtered.sort((a, b) => (b.fechaCreacion.toMillis() - a.fechaCreacion.toMillis()));
    } else if (this.currentSegment === 'alcanzada') {
      filtered.sort((a, b) => {
        const fechaA = a.fechaAlcanzada ? a.fechaAlcanzada.toMillis() : 0;
        const fechaB = b.fechaAlcanzada ? b.fechaAlcanzada.toMillis() : 0;
        return fechaB - fechaA; // Más recientes alcanzadas primero
      });
    }
    return filtered;
  }

  segmentChanged(event: any): void {
    this.currentSegment = event.detail.value;
    console.log('[GoalListPage] Segmento cambiado a', this.currentSegment);
    if (this.authUser?.uid) {
      this.subscribeToMetas(this.authUser.uid); // Recargar y filtrar según el nuevo segmento
    }
  }

  async abrirModalMeta(meta?: Meta) {
    if (!this.authUser) {
        this.presentToast('Debes iniciar sesión para gestionar metas.', 'warning');
        return;
    }
    const modal = await this.modalCtrl.create({
      component: GoalFormComponent, // El componente de formulario que creaste
      componentProps: {
        meta: meta ? { ...meta } : undefined // Pasa la meta si es edición, o undefined si es nueva
      },
      // Opcional: breakpoints para que el modal no ocupe toda la pantalla en dispositivos grandes
      // breakpoints: [0, 0.6, 0.8],
      // initialBreakpoint: 0.8,
      // backdropBreakpoint: 0, // Para cerrar el modal al tocar fuera en ciertos breakpoints
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && (data.creada || data.actualizada) && this.authUser?.uid) {
      this.presentToast(data.creada ? 'Meta creada exitosamente.' : 'Meta actualizada exitosamente.', 'success', 1500);
      // No es necesario llamar a subscribeToMetas aquí si el observable de getMetas() ya está activo
      // y Firestore propaga los cambios automáticamente. Si no, o para forzar una recarga:
      // this.subscribeToMetas(this.authUser.uid);
    }
  }

  async confirmarEliminar(meta: Meta, event: Event) {
    event.stopPropagation(); // Evita que se dispare el click del item
    if (!this.authUser?.uid || !meta.id) {
      this.presentToast('No se pudo identificar la meta o el usuario.', 'danger');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que quieres eliminar la meta "${meta.titulo}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'secondary-button' },
        {
          text: 'Eliminar',
          cssClass: 'danger-button',
          handler: async () => {
            await this.presentLoading('Eliminando meta...');
            try {
              await this.goalService.eliminarMeta(this.authUser!.uid, meta.id!);
              this.presentToast('Meta eliminada.', 'success', 1500);
              // La lista se actualizará automáticamente por la suscripción a getMetas()
            } catch (error) {
              console.error('[GoalListPage] Error al eliminar meta:', error);
              this.presentToast('Error al eliminar la meta.', 'danger');
            } finally {
              await this.dismissLoading();
            }
          },
        },
      ],
      cssClass: 'custom-alert' // Si tienes estilos personalizados
    });
    await alert.present();
  }

  async toggleEstadoMeta(meta: Meta, event: Event) {
    event.stopPropagation();
    if (!this.authUser?.uid || !meta.id) return;

    const nuevoEstado: EstadoMeta = meta.estado === 'alcanzada' ? 'enProgreso' : 'alcanzada';
    const mensajeLoading = nuevoEstado === 'alcanzada' ? 'Marcando como alcanzada...' : 'Marcando en progreso...';

    await this.presentLoading(mensajeLoading);
    try {
      await this.goalService.actualizarEstadoMeta(this.authUser.uid, meta.id, nuevoEstado);
      this.presentToast(
        `Meta "${meta.titulo}" marcada como ${nuevoEstado === 'alcanzada' ? 'alcanzada' : 'en progreso'}.`,
        'success'
      );
    } catch (error) {
      console.error('Error al actualizar estado de la meta:', error);
      this.presentToast('Error al cambiar el estado de la meta.', 'danger');
    } finally {
      await this.dismissLoading();
    }
  }

  // --- Helpers de UI ---
  async presentToast(
    mensaje: string,
    color: 'success' | 'warning' | 'danger' | 'light' | 'dark' = 'dark',
    duracion: number = 2500
  ) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: duracion,
      color: color,
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    toast.present();
  }

  async presentLoading(message: string) {
    if (this.loadingElement) {
        try { await this.loadingElement.dismiss(); } catch(e) {}
        this.loadingElement = null;
    }
    this.loadingElement = await this.loadingCtrl.create({ message, spinner: 'crescent', translucent: true });
    await this.loadingElement.present();
  }

  async dismissLoading() {
    if (this.loadingElement) {
      try { await this.loadingElement.dismiss(); } catch (e) {}
      this.loadingElement = null;
    } else {
      try {
        const topLoading = await this.loadingCtrl.getTop();
        if (topLoading) await topLoading.dismiss();
      } catch(e) {}
    }
  }

  handleRefresh(event: any) {
    console.log('[GoalListPage] handleRefresh disparado.');
    if (this.authUser?.uid) {
      this.subscribeToMetas(this.authUser.uid); // Esto ya maneja el loading
      // El refresher se completará en el finalize de subscribeToMetas
      if (event && event.target && typeof event.target.complete === 'function') {
        // No llames a complete() aquí, deja que finalize() lo haga o tendrás doble cierre.
        // Se podría pasar el 'event.target' a subscribeToMetas para que lo complete.
        // Por simplicidad, la UI del refresher se cerrará cuando el loading desaparezca.
        // Para un control más fino, pasar el `event` al `finalize`.
        const sub = this.metas$.pipe(take(1)).subscribe(() => { // Espera la primera emisión post-refresh
          if (event && event.target && typeof event.target.complete === 'function') {
            event.target.complete();
          }
        });
        // Asegurarse de desuscribir para evitar memory leaks
        if (this.metasSubscription) this.metasSubscription.add(sub); else sub.unsubscribe();

      }
    } else {
      if (event && event.target && typeof event.target.complete === 'function') {
        event.target.complete();
      }
    }
  }

  // Para el trackBy en el *ngFor
  trackMetaById(index: number, meta: Meta): string | undefined {
    return meta.id;
  }

  ngOnDestroy() {
    console.log('[GoalListPage] ngOnDestroy: Desuscribiendo.');
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.metasSubscription) {
      this.metasSubscription.unsubscribe();
    }
    this.dismissLoading(); // Asegurarse de cerrar loadings al destruir
  }
}
