import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController, ToastController, AlertController, LoadingController } from '@ionic/angular';
import { Observable, Subscription, of, forkJoin, firstValueFrom, BehaviorSubject } from 'rxjs';
import { switchMap, catchError, tap, map, finalize, take } from 'rxjs/operators';
import { User } from '@firebase/auth';
import { Timestamp } from 'firebase/firestore';

import { Habito } from '../../../models/habito.model';
import { RegistroHabito } from '../../../models/registro-habito.model';
import { HabitoService } from '../../../services/habito.service';
import { AuthService } from '../../../services/auth.service';
import { HabitoFormComponent } from 'src/app/components/shared-components/habito-form/habito-form.component';

// NUEVO: Importa Meta y GoalService
import { Meta } from 'src/app/models/meta.model';
import { GoalService } from 'src/app/services/goal.service';

export interface HabitoConEstadoUI extends Habito {
  completadoHoy: boolean;
  registroHoyId?: string;
}

@Component({
  selector: 'app-habits-list',
  templateUrl: './habit-list.page.html',
  styleUrls: ['./habit-list.page.scss'],
  standalone: false,
})
export class HabitsListPage implements OnInit, OnDestroy {

  private _habitosConEstado = new BehaviorSubject<HabitoConEstadoUI[]>([]);
  habitosConEstado$: Observable<HabitoConEstadoUI[]> = this._habitosConEstado.asObservable();

  private authUser: User | null = null;
  private authSubscription: Subscription | undefined;
  private habitosRawSubscription: Subscription | undefined;
  isLoading: boolean = false;
  private loadingElement: HTMLIonLoadingElement | null = null;
  fechaHoyString: string;

  // NUEVO: Observable de metas
  metas$!: Observable<Meta[]>;

  constructor(
    private modalCtrl: ModalController,
    private habitoService: HabitoService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private goalService: GoalService // NUEVO
  ) {
    this.fechaHoyString = this.getFechaHoyString();
  }

  ngOnInit() {
    console.log('[HabitsListPage] ngOnInit');
    this.authSubscription = this.authService.user$.subscribe(user => {
      console.log('[HabitsListPage] Auth state changed', user);
      if (user && user.uid) {
        // NUEVO: Cargar metas del usuario
        this.metas$ = this.goalService.getMetas(user.uid);
        if (!this.authUser || this.authUser.uid !== user.uid) {
          this.authUser = user;
          this.loadHabitosConEstadoHoy(user.uid);
        }
      } else {
        this.authUser = null;
        this._habitosConEstado.next([]);
        this.isLoading = false;
        this.dismissLoading();
        if (this.habitosRawSubscription && !this.habitosRawSubscription.closed) {
          this.habitosRawSubscription.unsubscribe();
        }
        // NUEVO: Limpiar metas si no hay usuario
        this.metas$ = of([]);
      }
    });
  }

  ionViewWillEnter() {
    console.log('[HabitsListPage] ionViewWillEnter');
    const nuevaFechaHoy = this.getFechaHoyString();
    if (this.authUser && this.authUser.uid) {
      if (this.fechaHoyString !== nuevaFechaHoy || !this.habitosRawSubscription || this.habitosRawSubscription.closed) {
        this.fechaHoyString = nuevaFechaHoy;
        console.log('[HabitsListPage] ionViewWillEnter - Día cambió o no hay suscripción. Recargando hábitos con estado de hoy.');
        this.loadHabitosConEstadoHoy(this.authUser.uid);
      } else {
        console.log('[HabitsListPage] ionViewWillEnter - Mismo día y suscripción activa. No se recarga todo.');
      }
    }
  }

  async loadHabitosConEstadoHoy(userId: string) {
    console.log(`[HabitsListPage] loadHabitosConEstadoHoy for userId: ${userId}`);
    if (this.isLoading) return;
    await this.presentLoading('Cargando hábitos...');
    this.isLoading = true;

    if (this.habitosRawSubscription && !this.habitosRawSubscription.closed) {
      this.habitosRawSubscription.unsubscribe();
    }

    this.habitosRawSubscription = this.habitoService.getHabitos(userId).pipe(
      tap(rawHabitos => console.log('[HabitsListPage] getHabitos emitió (crudo):', rawHabitos)),
      switchMap(habitos => {
        if (!habitos || habitos.length === 0) {
          return of([] as HabitoConEstadoUI[]);
        }
        const observablesConEstado = habitos.map(habito =>
          this.habitoService.getRegistrosDeUnHabito(userId, habito.id!).pipe(
            map(registros => {
              const registroHoy = registros.find(r => r.fecha === this.fechaHoyString && r.completado);
              return { ...habito, completadoHoy: !!registroHoy, registroHoyId: registroHoy?.id } as HabitoConEstadoUI;
            }),
            take(1),
            catchError(err => {
              console.error(`[HabitsListPage] Error obteniendo registros para hábito ${habito.id}:`, err);
              return of({ ...habito, completadoHoy: false, registroHoyId: undefined } as HabitoConEstadoUI);
            })
          )
        );
        return forkJoin(observablesConEstado);
      }),
      tap(habitosConEstado => {
        console.log('[HabitsListPage] tap (después de switchMap) - Hábitos con estado procesados:', habitosConEstado);
        this._habitosConEstado.next(habitosConEstado);
        this.isLoading = false;
        this.dismissLoading();
      }),
      finalize(() => {
        console.log('[HabitsListPage] finalize: Flujo principal de carga de hábitos.');
        if (this.isLoading) {
            this.isLoading = false;
            this.dismissLoading();
        }
      }),
      catchError(error => {
        console.error('[HabitsListPage] catchError (principal): Error al cargar hábitos:', error);
        this.presentToast('Error al cargar los hábitos.', 'danger');
        this._habitosConEstado.next([]);
        this.isLoading = false;
        this.dismissLoading();
        return of([] as HabitoConEstadoUI[]);
      })
    ).subscribe();
  }

  async refreshHabitosEstadoHoy() {
    if (!this.authUser?.uid) return;
    const userId = this.authUser.uid;
    const currentHabitos = this._habitosConEstado.value;

    if (!currentHabitos || currentHabitos.length === 0) return;

    await this.presentLoading('Actualizando estado...');
    this.isLoading = true;
    try {
        const observablesActualizados = currentHabitos.map(habito =>
            this.habitoService.getRegistrosDeUnHabito(userId, habito.id!).pipe(
                map(registros => {
                    const registroHoy = registros.find(r => r.fecha === this.fechaHoyString && r.completado);
                    return { ...habito, completadoHoy: !!registroHoy, registroHoyId: registroHoy?.id };
                }),
                take(1),
                catchError(err => {
                  console.error(`[HabitsListPage] Error en refresh obteniendo registros para hábito ${habito.id}:`, err);
                  return of({ ...habito, completadoHoy: false, registroHoyId: undefined });
                })
            )
        );
        const habitosActualizados = await firstValueFrom(forkJoin(observablesActualizados));
        this._habitosConEstado.next(habitosActualizados);
    } catch (error) {
        console.error('[HabitsListPage] Error en refreshHabitosEstadoHoy:', error);
        this.presentToast('Error al actualizar el estado de los hábitos.', 'danger');
    } finally {
        this.isLoading = false;
        this.dismissLoading();
    }
  }

  getFechaHoyString(): string {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const dia = hoy.getDate().toString().padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  async abrirModalHabito(habito?: HabitoConEstadoUI) {
    const modal = await this.modalCtrl.create({
      component: HabitoFormComponent,
      componentProps: { habito: habito ? { ...habito } : undefined }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data && (data.creada || data.actualizada)) {
      this.presentToast(data.creada ? 'Hábito creado.' : 'Hábito actualizado.', 'success', 1500);
      if (this.authUser?.uid) this.loadHabitosConEstadoHoy(this.authUser.uid);
    }
  }

  async toggleCompletadoHoy(habito: HabitoConEstadoUI, event: Event) {
    event.stopPropagation();
    if (!this.authUser?.uid || !habito.id) return;
    if (habito.completadoHoy) {
      this.presentToast('¡Este hábito ya fue registrado hoy!', 'light');
      return;
    }
    await this.presentLoading('Registrando...');
    this.isLoading = true;
    try {
      await this.habitoService.registrarCumplimientoHabito(this.authUser.uid, habito.id, this.fechaHoyString);
      this.presentToast(`¡Hábito "${habito.titulo}" registrado!`, 'success');
      const currentHabitos = this._habitosConEstado.value;
      const habitoIndex = currentHabitos.findIndex(h => h.id === habito.id);
      if (habitoIndex > -1) {
        const habitoActualizado = { ...currentHabitos[habitoIndex], completadoHoy: true };
        const nuevosHabitos = [...currentHabitos];
        nuevosHabitos[habitoIndex] = habitoActualizado;
        this._habitosConEstado.next(nuevosHabitos);
      }
    } catch (error) {
      this.presentToast('Error al registrar el hábito.', 'danger');
    } finally {
      this.isLoading = false;
      this.dismissLoading();
    }
  }

  async confirmarEliminar(habito: HabitoConEstadoUI, event: Event) {
    event.stopPropagation();
    if (!this.authUser?.uid || !habito.id) return;
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que quieres eliminar el hábito "${habito.titulo}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', cssClass: 'danger-button',
          handler: async () => {
            await this.presentLoading('Eliminando...');
            this.isLoading = true;
            try {
              await this.habitoService.eliminarHabito(this.authUser!.uid, habito.id!);
              this.presentToast('Hábito eliminado.', 'success');
            } catch (error) {
              this.presentToast('Error al eliminar el hábito.', 'danger');
            } finally {
              this.isLoading = false;
              this.dismissLoading();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async handleRefresh(event: any) {
    console.log('[HabitsListPage] handleRefresh');
    if (this.authUser?.uid) {
      try {
        await this.loadHabitosConEstadoHoy(this.authUser.uid);
      } finally {
        if (event && event.target && typeof event.target.complete === 'function') {
          event.target.complete();
        }
        console.log('[HabitsListPage] Refresh completado y refresher cerrado.');
      }
    } else {
      if (event && event.target && typeof event.target.complete === 'function') {
        event.target.complete();
      }
    }
  }

  trackHabitoById(index: number, habito: HabitoConEstadoUI): string | undefined {
    return habito.id;
  }

  async presentLoading(message: string = 'Cargando...') {
    if (this.loadingElement) {
        try { await this.loadingElement.dismiss(); } catch(e) {}
        this.loadingElement = null;
    }
    this.loadingElement = await this.loadingCtrl.create({ message, spinner: 'crescent', translucent: true, cssClass: 'custom-loading' });
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

  async presentToast(mensaje: string, color: 'success' | 'warning' | 'danger' | 'light' | 'dark' = 'dark', duracion: number = 2000) {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: duracion, color: color, position: 'bottom', cssClass: 'custom-toast' });
    toast.present();
  }

  // NUEVO: Método para obtener el título de la meta asociada
  getMetaTitulo(metaId: string | null | undefined, metas: Meta[] | null | undefined): string | null {
    if (!metaId || !metas) return null;
    const meta = metas.find(m => m.id === metaId);
    return meta ? meta.titulo : null;
  }

  ngOnDestroy() {
    console.log('[HabitsListPage] ngOnDestroy');
    if (this.authSubscription && !this.authSubscription.closed) this.authSubscription.unsubscribe();
    if (this.habitosRawSubscription && !this.habitosRawSubscription.closed) {
      this.habitosRawSubscription.unsubscribe();
    }
    this.dismissLoading();
  }
}
