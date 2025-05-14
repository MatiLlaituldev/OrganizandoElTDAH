// profile.page.ts (Adaptado a tu estructura, usando user$ Observable y sin UserService - CON DEPURACIÓN)
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController, NavController } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';
import { User } from '@firebase/auth';
import { Subscription, firstValueFrom, tap } from 'rxjs'; // Import tap for logging

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
  private userSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    console.log('ProfilePage: ngOnInit - Iniciando carga de datos del usuario.');
    this.loadUserData();
  }

  ionViewWillEnter() {
    console.log('ProfilePage: ionViewWillEnter - Vista a punto de entrar.');
    // Solo recargar si userData aún no está definido para evitar recargas innecesarias.
    if (!this.userData) {
        console.log('ProfilePage: ionViewWillEnter - userData es nulo, llamando a loadUserData.');
        this.loadUserData();
    } else {
        console.log('ProfilePage: ionViewWillEnter - userData ya existe, no se recarga.');
    }
  }

  async loadUserData() {
    console.log('ProfilePage: loadUserData - Inicio de la función.');
    try {
      console.log('ProfilePage: Suscribiéndose momentáneamente a authService.user$ para depuración...');
      // Loguear cada emisión de user$ para ver qué está pasando
      this.authService.user$.pipe(
        tap(u => console.log('ProfilePage: Emisión de authService.user$:', u))
      ).subscribe(); // Esta suscripción es solo para logging inmediato, firstValueFrom se encargará de obtener el valor.

      // Esperar el primer valor (puede ser User o null después de la inicialización de Firebase)
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

  getDefaultAvatar(name: string | null | undefined): string {
    const initial = name ? name.charAt(0).toUpperCase() : 'U';
    return `https://placehold.co/100x100/E6E0FF/7F00FF?text=${initial}&font=Inter`;
  }

  async presentLogoutConfirm() {
    // ... (código de logout sin cambios)
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
    // ... (código de toast sin cambios)
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
    console.log('ProfilePage: ngOnDestroy - Limpiando suscripciones si las hubiera.');
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
