import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { EstadoAnimoService } from '../services/estado-animo.service';
import { EstadoAnimoEnergia } from '../models/estado-animo-energia.model';
import { LoadingController, ToastController } from '@ionic/angular';
import { User } from '@firebase/auth';
import { Subscription, firstValueFrom, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

interface OpcionSeleccion {
  valor: number;
  texto: string;
  emoji?: string;
  color?: string;
}

@Component({
  selector: 'app-wellbeing',
  templateUrl: './wellbeing.page.html',
  styleUrls: ['./wellbeing.page.scss'],
  standalone  : false
})
export class WellbeingPage implements OnInit, OnDestroy {

  wellbeingForm!: FormGroup;
  currentUser: User | null = null;
  private authSubscription: Subscription = new Subscription();
  private registroActualId: string | null | undefined = null;

  vistaActual: string = 'registrar';
  historialAnimo$: Observable<EstadoAnimoEnergia[]> = of([]);

  opcionesAnimo: OpcionSeleccion[] = [
    { valor: 5, texto: 'Feliz', emoji: '😊', color: 'success' },
    { valor: 4, texto: 'Contento', emoji: '🙂', color: 'primary' },
    { valor: 3, texto: 'Neutral', emoji: '😐', color: 'medium' },
    { valor: 2, texto: 'Ansioso', emoji: '😟', color: 'warning' },
    { valor: 1, texto: 'Muy Mal', emoji: '😩', color: 'danger' }
  ];

  opcionesEnergia: OpcionSeleccion[] = [
    { valor: 3, texto: 'Alta', emoji: '⚡️', color: 'success' },
    { valor: 2, texto: 'Media', emoji: '🔋', color: 'primary' },
    { valor: 1, texto: 'Baja', emoji: '🔌', color: 'danger' }
  ];

  private loadingElement: HTMLIonLoadingElement | null = null;

  // --- Notificaciones de bienestar ---
  recordatorioActivo = false;
  horaRecordatorio: string | null = '';
  minHora = '2025-01-01T06:00';
  maxHora = '2025-01-01T23:00';
  notificationId?: number | null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private estadoAnimoService: EstadoAnimoService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private notificationService: NotificationService
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.authSubscription.add(
      this.authService.user$.subscribe(user => {
        this.currentUser = user;
        if (user) {
          if (this.vistaActual === 'registrar') {
            this.cargarRegistroDelDia();
          } else {
            this.cargarHistorialAnimo();
          }
        } else {
          this.initForm();
          this.registroActualId = null;
          this.historialAnimo$ = of([]);
        }
      })
    );
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.loadingElement) {
      this.loadingElement.dismiss().catch(() => {});
      this.loadingElement = null;
    }
  }

  segmentChanged(event: any) {
    this.vistaActual = event.detail.value;
    if (this.vistaActual === 'historial') {
      this.cargarHistorialAnimo();
    } else if (this.vistaActual === 'registrar' && this.currentUser) {
      this.cargarRegistroDelDia();
    }
  }

  initForm(data?: Partial<EstadoAnimoEnergia> | null) {
    this.wellbeingForm = this.fb.group({
      estadoAnimo: [data?.estadoAnimo ?? 3, Validators.required],
      nivelEnergia: [data?.nivelEnergia ?? 2, Validators.required],
      notas: [data?.notas ?? '']
    });
    this.registroActualId = data?.id;

    // Si el registro existe pero no tiene los campos, inicialízalos
    this.recordatorioActivo = data?.recordatorioActivo ?? false;
    this.horaRecordatorio = data?.horaRecordatorio ?? '';
    this.notificationId = data?.notificationId ?? null;
  }

  async cargarRegistroDelDia() {
    if (!this.currentUser?.uid) {
      this.initForm();
      return;
    }
    await this.presentLoading('Cargando tu día...');
    try {
      const registro = await firstValueFrom(
        this.estadoAnimoService.getRegistroDelDia(this.currentUser.uid, new Date()).pipe(
          catchError(err => {
            this.presentToast('Error al obtener el registro de hoy.', 'danger');
            return of(null);
          })
        )
      );
      this.initForm(registro);
    } catch (error) {
      this.presentToast('No se pudo cargar la información de hoy.', 'danger');
      this.initForm();
    } finally {
      await this.dismissLoading();
    }
  }

  cargarHistorialAnimo() {
    if (!this.currentUser?.uid) {
      this.historialAnimo$ = of([]);
      return;
    }
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);

    this.historialAnimo$ = this.estadoAnimoService.getRegistrosPorRango(
      this.currentUser.uid,
      hace30Dias,
      hoy
    ).pipe(
      map(registros => registros.sort((a, b) => b.fecha.localeCompare(a.fecha))),
      catchError(err => {
        this.presentToast('Error al cargar el historial.', 'danger');
        return of([]);
      })
    );
  }

  async guardarRegistro() {
    if (!this.currentUser?.uid) {
      this.presentToast('Debes iniciar sesión para guardar.', 'warning');
      return;
    }
    if (!this.wellbeingForm || this.wellbeingForm.invalid) {
      this.presentToast('Por favor, selecciona tu ánimo y energía.', 'warning');
      this.wellbeingForm?.markAllAsTouched();
      return;
    }

    await this.presentLoading(this.registroActualId ? 'Actualizando...' : 'Guardando...');
    const formValues = this.wellbeingForm.value;
    // Siempre incluye los campos de notificación
    const datosParaGuardar: Partial<EstadoAnimoEnergia> = {
      estadoAnimo: formValues.estadoAnimo,
      nivelEnergia: formValues.nivelEnergia,
      notas: formValues.notas,
      recordatorioActivo: this.recordatorioActivo,
      horaRecordatorio: this.horaRecordatorio ? this.horaRecordatorio : null,
      notificationId: this.notificationId ?? null
    };

    // --- Lógica de notificaciones de bienestar (similar a hábitos) ---
    if (this.recordatorioActivo && this.horaRecordatorio) {
      // Extraer solo la hora en formato HH:mm si viene en formato ISO
      let hora = this.horaRecordatorio;
      if (typeof hora === 'string' && hora.includes('T')) {
        hora = hora.split('T')[1]?.substring(0,5);
      }
      // Cancela notificación previa si existe
      if (this.notificationId) {
        await this.notificationService.cancelNotification([this.notificationId]);
      }
      // LOG para depuración
      console.log('Programando notificación bienestar para:', hora);
      // Programa nueva notificación
      this.notificationId = await this.notificationService.programarNotificacionBienestar(
        this.currentUser.uid,
        hora
      );
      console.log('Notificación programada con ID:', this.notificationId);
      datosParaGuardar.notificationId = this.notificationId;
      datosParaGuardar.recordatorioActivo = true;
      datosParaGuardar.horaRecordatorio = hora;
    } else if (!this.recordatorioActivo && this.notificationId) {
      await this.notificationService.cancelNotification([this.notificationId]);
      this.notificationId = null;
      datosParaGuardar.notificationId = null;
      datosParaGuardar.recordatorioActivo = false;
      datosParaGuardar.horaRecordatorio = null;
    } else {
      datosParaGuardar.recordatorioActivo = false;
      datosParaGuardar.horaRecordatorio = null;
      datosParaGuardar.notificationId = null;
    }

    try {
      await this.estadoAnimoService.guardarRegistroDelDia(this.currentUser.uid, datosParaGuardar);
      const mensajeExito = this.registroActualId ? 'Registro actualizado.' : '¡Registro guardado!';
      await this.cargarRegistroDelDia();
      this.presentToast(mensajeExito, 'success');
    } catch (error) {
      this.presentToast('Error al guardar tu registro.', 'danger');
    } finally {
      await this.dismissLoading();
    }
  }

  // --- Funciones de Ayuda para la UI ---
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

  async presentToast(message: string, color: string = 'dark', duration: number = 2500) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color,
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    toast.present();
  }

  async presentLoading(message: string) {
    if (this.loadingElement && (await this.loadingCtrl.getTop()) === this.loadingElement) {
        this.loadingElement.message = message;
        return;
    }
    if (await this.loadingCtrl.getTop()) {
        await this.loadingCtrl.dismiss().catch(() => {});
    }
    this.loadingElement = await this.loadingCtrl.create({
      message,
      spinner: 'crescent',
      translucent: true,
      cssClass: 'custom-loading'
    });
    await this.loadingElement.present();
  }

  async dismissLoading() {
    if (this.loadingElement) {
      try {
        await this.loadingElement.dismiss();
      } catch (e) { /* Silenciar error */ }
      finally { this.loadingElement = null; }
    }}}
