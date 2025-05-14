// login.page.ts (Con Autenticación y Espera)
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular'; // Import NavController and ToastController
import { AuthService } from '../../../services/auth.service'; // Asegúrate de que la ruta sea correcta
import { firstValueFrom } from 'rxjs';
import { filter, take, tap } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {

  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService, // Inyecta AuthService
    private navCtrl: NavController,   // Inyecta NavController para navegación robusta
    private toastCtrl: ToastController // Inyecta ToastController para mensajes
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {}

  async onLogin() { // Convertido a async para usar await
    if (this.loginForm.invalid) {
      console.log("⚠️ Formulario inválido");
      this.presentToast('Por favor, completa todos los campos correctamente.');
      return; // Detiene la ejecución si el formulario no es válido
    }

    console.log("🔥 Intentando iniciar sesión con:", this.loginForm.value);
    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;

    try {
      // 1. Llama al método de login de tu AuthService
      const userCredential = await this.authService.login(email, password);
      console.log('[LOGIN PAGE] Firebase signInWithEmailAndPassword exitoso:', userCredential.user);

      // 2. Espera a que authService.user$ confirme el nuevo usuario ANTES de navegar
      console.log('[LOGIN PAGE] Esperando que authService.user$ emita el usuario logueado...');
      await firstValueFrom(
        this.authService.user$.pipe(
          tap(u => console.log('[LOGIN PAGE] authService.user$ emitió durante la espera:', u)),
          filter(user => user !== null && user.uid === userCredential.user.uid), // Espera al usuario correcto y no nulo
          take(1) // Toma la primera emisión que cumpla el filtro y completa
        )
      );
      console.log('[LOGIN PAGE] authService.user$ ha confirmado el usuario. Navegando a /tabs/tasks...');

      // 3. Ahora es seguro navegar
      // Usar NavController para limpiar el stack de navegación es a menudo preferido después del login
      this.navCtrl.navigateRoot('/tabs/tasks', { animationDirection: 'forward' });
      this.presentToast('¡Inicio de sesión exitoso!');

    } catch (error: any) {
      console.error('[LOGIN PAGE] Error durante el login:', error);
      let errorMessage = 'Ocurrió un error al iniciar sesión.';
      // Firebase suele devolver errores con un código, puedes personalizarlos
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password': // En Firebase v9+ estos errores se agrupan en 'auth/invalid-credential'
          case 'auth/invalid-credential':
            errorMessage = 'Correo electrónico o contraseña incorrectos.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'El formato del correo electrónico no es válido.';
            break;
          default:
            errorMessage = 'Error de autenticación. Inténtalo de nuevo.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      this.presentToast(errorMessage);
    }
  }

  async presentToast(message: string, duration: number = 3000, color: string = 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      position: 'bottom',
      color: message.includes('exitoso') ? 'success' : color, // Color verde para éxito
    });
    toast.present();
  }
}
