import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController, ToastController, AlertController, LoadingController } from '@ionic/angular';
import { Observable, Subscription, of } from 'rxjs';
import { switchMap, catchError, tap, map } from 'rxjs/operators';
import { User } from '@firebase/auth';
import { Meta, EstadoMeta } from '../../../models/meta.model';
import { GoalService } from '../../../services/goal.service';
import { AuthService } from '../../../services/auth.service';
import { GoalFormComponent } from '../../../components/shared-components/goal-form/goal-form.component';
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
  private metasSubscription: Subscription | undefined;

  isLoading: boolean = false;
  private loadingElement: HTMLIonLoadingElement | null = null;

  currentSegment: 'enProgreso' | 'alcanzada' = 'enProgreso';

  constructor(
    private modalCtrl: ModalController,
    private goalService: GoalService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    this.authSubscription = this.authService.user$.subscribe(user => {
      if (user && user.uid) {
        if (!this.authUser || this.authUser.uid !== user.uid) {
          this.authUser = user;
          this.subscribeToMetas(user.uid);
        }
      } else {
        this.authUser = null;
        this.metas$ = of([]);
        if (this.metasSubscription) {
          this.metasSubscription.unsubscribe();
        }
        this.isLoading = false;
        this.dismissLoading();
      }
    });
  }

  ionViewWillEnter() {
    if (this.authUser && this.authUser.uid) {
      if (!this.metasSubscription || this.metasSubscription.closed) {
        this.subscribeToMetas(this.authUser.uid);
      }
    }
  }

  subscribeToMetas(userId: string) {
    if (this.isLoading) return;
    this.presentLoading('Cargando metas...');
    this.isLoading = true;

    if (this.metasSubscription && !this.metasSubscription.closed) {
      this.metasSubscription.unsubscribe();
    }

    let loadingCerrado = false;

    this.metasSubscription = this.goalService.getMetas(userId).pipe(
      map(metas => this.filterAndSortMetas(metas || [])),
      tap(filteredMetas => {
        this.metas$ = of(filteredMetas);
        if (!loadingCerrado && this.isLoading) {
          this.isLoading = false;
          this.dismissLoading();
          loadingCerrado = true;
        }
      }),
      catchError(error => {
        this.presentToast('Error al cargar las metas.', 'danger');
        this.metas$ = of([]);
        if (!loadingCerrado && this.isLoading) {
          this.isLoading = false;
          this.dismissLoading();
          loadingCerrado = true;
        }
        return of([]);
      })
    ).subscribe();
  }

  filterAndSortMetas(metas: Meta[]): Meta[] {
    let filtered = metas.filter(meta => meta.estado === this.currentSegment);
    if (this.currentSegment === 'enProgreso') {
      filtered.sort((a, b) => (b.fechaCreacion.toMillis() - a.fechaCreacion.toMillis()));
    } else if (this.currentSegment === 'alcanzada') {
      filtered.sort((a, b) => {
        const fechaA = a.fechaAlcanzada ? a.fechaAlcanzada.toMillis() : 0;
        const fechaB = b.fechaAlcanzada ? b.fechaAlcanzada.toMillis() : 0;
        return fechaB - fechaA;
      });
    }
    return filtered;
  }

  segmentChanged(event: any): void {
    this.currentSegment = event.detail.value;
    if (this.authUser?.uid) {
      this.subscribeToMetas(this.authUser.uid);
    }
  }

  async abrirModalMeta(meta?: Meta) {
    if (!this.authUser) {
      this.presentToast('Debes iniciar sesión para gestionar metas.', 'warning');
      return;
    }
    const modal = await this.modalCtrl.create({
      component: GoalFormComponent,
      componentProps: {
        meta: meta ? { ...meta } : undefined
      },
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && (data.creada || data.actualizada) && this.authUser?.uid) {
      this.presentToast(data.creada ? 'Meta creada exitosamente.' : 'Meta actualizada exitosamente.', 'success', 1500);
    }
  }

  async confirmarEliminar(meta: Meta, event: Event) {
    event.stopPropagation();
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
            } catch (error) {
              this.presentToast('Error al eliminar la meta.', 'danger');
            } finally {
              await this.dismissLoading();
            }
          },
        },
      ],
      cssClass: 'custom-alert'
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
      this.presentToast('Error al cambiar el estado de la meta.', 'danger');
    } finally {
      await this.dismissLoading();
    }
  }

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
      try { await this.loadingElement.dismiss(); } catch (e) {}
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
      } catch (e) {}
    }
  }

  handleRefresh(event: any) {
    if (this.authUser?.uid) {
      this.subscribeToMetas(this.authUser.uid);
      const sub = this.metas$.pipe(take(1)).subscribe(() => {
        if (event && event.target && typeof event.target.complete === 'function') {
          event.target.complete();
        }
      });
      if (this.metasSubscription) this.metasSubscription.add(sub); else sub.unsubscribe();
    } else {
      if (event && event.target && typeof event.target.complete === 'function') {
        event.target.complete();
      }
    }
  }

  trackMetaById(index: number, meta: Meta): string | undefined {
    return meta.id;
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.metasSubscription) {
      this.metasSubscription.unsubscribe();
    }
    this.dismissLoading();
  }
  getProgresoMeta(meta: Meta): number {
  // Si tu modelo Meta tiene tareas/hábitos asociadas, calcula el progreso real aquí
  return 0.5; // 50% de ejemplo
}

// Devuelve un resumen simulado (luego lo puedes mejorar)
getResumenMeta(meta: Meta): string {
  // Ejemplo: "3/5 tareas completadas, 2/4 hábitos al día de hoy"
  return 'Progreso: 50% (ejemplo)';
}

// Navega al detalle de la meta (puedes implementar la navegación real después)
verDetalleMeta(meta: Meta) {
  this.presentToast('Función de detalle de meta aún no implementada.', 'warning');
}
}
