import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController, NavController } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';
import { RecordatorioService } from '../../../services/recordatorio.service'; // 🔥 AGREGAR
import { User } from '@firebase/auth';
import { Subscription, firstValueFrom, tap } from 'rxjs';
import { Recordatorio } from '../../../models/recordatorio.model'; // 🔥 AGREGAR

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit, OnDestroy {

  userData: UserData | null = null;
  proximoRecordatorio: Recordatorio | null = null; // 🔥 AGREGAR
  cargandoRecordatorio = false; // 🔥 AGREGAR
  private userSubscription: Subscription | undefined;
  private recordatoriosSubscription: Subscription | undefined; // 🔥 AGREGAR

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private navCtrl: NavController,
    private recordatorioService: RecordatorioService // 🔥 AGREGAR
  ) { }

  ngOnInit() {
    console.log('ProfilePage: ngOnInit - Iniciando carga de datos del usuario.');
    this.loadUserData();
  }

  ionViewWillEnter() {
    console.log('ProfilePage: ionViewWillEnter - Vista a punto de entrar.');
    if (!this.userData) {
        console.log('ProfilePage: ionViewWillEnter - userData es nulo, llamando a loadUserData.');
        this.loadUserData();
    } else {
        console.log('ProfilePage: ionViewWillEnter - userData ya existe, no se recarga.');
        // 🔥 RECARGAR RECORDATORIO AL ENTRAR A LA VISTA
        this.cargarProximoRecordatorio();
    }
  }

  async loadUserData() {
    console.log('ProfilePage: loadUserData - Inicio de la función.');
    try {
      console.log('ProfilePage: Suscribiéndose momentáneamente a authService.user$ para depuración...');
      this.authService.user$.pipe(
        tap(u => console.log('ProfilePage: Emisión de authService.user$:', u))
      ).subscribe();

      const user: User | null = await firstValueFrom(this.authService.user$);
      console.log('ProfilePage: loadUserData - Usuario obtenido de firstValueFrom(authService.user$):', user);

      if (user && user.uid) {
        console.log('ProfilePage: loadUserData - Usuario encontrado:', user.email);
        this.userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Usuario',
          photoURL: user.photoURL || this.getDefaultAvatar(user.displayName || 'U'),
        };
        console.log('ProfilePage: loadUserData - userData establecido:', this.userData);

        // 🔥 CARGAR PRÓXIMO RECORDATORIO DESPUÉS DE OBTENER USUARIO
        this.cargarProximoRecordatorio();
      } else {
        console.warn('ProfilePage: loadUserData - No hay usuario autenticado (o UID es nulo). Redirigiendo a /auth.');
        this.navCtrl.navigateRoot('/auth');
      }
    } catch (error) {
      console.error('ProfilePage: loadUserData - Error al cargar datos del usuario:', error);
      this.presentToast('Error al cargar tu información.');
      this.navCtrl.navigateRoot('/auth');
    }
  }

  // 🔥 NUEVO MÉTODO: CARGAR PRÓXIMO RECORDATORIO
  cargarProximoRecordatorio() {
    if (!this.userData?.uid) return;

    this.cargandoRecordatorio = true;
    console.log('ProfilePage: Cargando próximo recordatorio...');

    // Suscribirse a recordatorios en tiempo real
    this.recordatoriosSubscription = this.recordatorioService.obtenerRecordatorios().subscribe({
      next: (recordatorios) => {
        console.log('ProfilePage: Recordatorios recibidos:', recordatorios);

        // Filtrar solo recordatorios pendientes (no completados)
        const recordatoriosPendientes = recordatorios.filter(r => !r.completado);

        if (recordatoriosPendientes.length > 0) {
          // Ordenar por fecha más próxima
          const recordatoriosOrdenados = recordatoriosPendientes.sort((a, b) => {
            const fechaA = this.toDate(a.fechaHora);
            const fechaB = this.toDate(b.fechaHora);
            return fechaA.getTime() - fechaB.getTime();
          });

          this.proximoRecordatorio = recordatoriosOrdenados[0];
          console.log('ProfilePage: Próximo recordatorio establecido:', this.proximoRecordatorio);
        } else {
          this.proximoRecordatorio = null;
          console.log('ProfilePage: No hay recordatorios pendientes');
        }

        this.cargandoRecordatorio = false;
      },
      error: (error) => {
        console.error('ProfilePage: Error al cargar recordatorios:', error);
        this.cargandoRecordatorio = false;
        this.proximoRecordatorio = null;
      }
    });
  }

  // 🔥 MÉTODO AUXILIAR: CONVERTIR FECHA
  private toDate(fecha: any): Date {
    if (!fecha) return new Date();
    if (fecha instanceof Date) return fecha;

    const fechaAny = fecha as any;
    if (fechaAny && typeof fechaAny.toDate === 'function') {
      return fechaAny.toDate(); // Firestore Timestamp
    }
    if (fechaAny && fechaAny.seconds) {
      return new Date(fechaAny.seconds * 1000); // Firestore Timestamp manual
    }
    return new Date(fecha);
  }

  // 🔥 GETTER: TIEMPO HASTA EL PRÓXIMO RECORDATORIO
  get tiempoHastaProximo(): string {
    if (!this.proximoRecordatorio) return '';

    const ahora = new Date();
    const fechaRecordatorio = this.toDate(this.proximoRecordatorio.fechaHora);
    const diferencia = fechaRecordatorio.getTime() - ahora.getTime();

    if (diferencia < 0) {
      return 'Vencido';
    }

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

    if (dias > 0) {
      return `En ${dias} día${dias > 1 ? 's' : ''}`;
    } else if (horas > 0) {
      return `En ${horas} hora${horas > 1 ? 's' : ''}`;
    } else if (minutos > 0) {
      return `En ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    } else {
      return '¡Muy pronto!';
    }
  }

  // 🔥 MÉTODO: IR A RECORDATORIOS
  irARecordatorios() {
    this.router.navigate(['/recordatorios']);
  }

  // 🔥 MÉTODO: COMPLETAR RECORDATORIO DESDE PERFIL
  async completarRecordatorioDesdePerfil() {
    if (!this.proximoRecordatorio?.id) return;

    try {
      await this.recordatorioService.marcarCompletado(this.proximoRecordatorio.id, true);
      this.presentToast('✅ Recordatorio completado', 2000, 'success');
      // El próximo recordatorio se actualizará automáticamente por la suscripción
    } catch (error) {
      console.error('Error al completar recordatorio:', error);
      this.presentToast('Error al completar recordatorio', 2000, 'danger');
    }
  }

  getDefaultAvatar(name: string | null | undefined): string {
    const initial = name ? name.charAt(0).toUpperCase() : 'U';
    return `https://placehold.co/100x100/E6E0FF/7F00FF?text=${initial}&font=Inter`;
  }

  async presentLogoutConfirm() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Sí, cerrar sesión',
          handler: async () => {
            try {
              await this.authService.logout();
              this.userData = null;
              this.navCtrl.navigateRoot('/auth');
              this.presentToast('Has cerrado sesión.');
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              this.presentToast('Error al cerrar sesión.');
            }
          },
        },
      ],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  async presentToast(message: string, duration: number = 2000, color?: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      position: 'bottom',
      color: color || 'dark',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    toast.present();
  }

  ngOnDestroy() {
    console.log('ProfilePage: ngOnDestroy - Limpiando suscripciones.');
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    // 🔥 LIMPIAR SUSCRIPCIÓN DE RECORDATORIOS
    if (this.recordatoriosSubscription) {
      this.recordatoriosSubscription.unsubscribe();
    }
  }
}
