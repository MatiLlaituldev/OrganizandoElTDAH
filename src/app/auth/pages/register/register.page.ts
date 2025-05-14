// register.page.ts (Mejorado)
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular'; // Import NavController and ToastController
import { AuthService } from '../../../services/auth.service'; // Ajusta la ruta si es necesario
import { Firestore, doc, setDoc } from '@angular/fire/firestore'; // Import doc and setDoc
import { updateProfile } from '@angular/fire/auth'; // Import updateProfile
import { firstValueFrom } from 'rxjs';
import { filter, take, tap } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit {

  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private firestore: Firestore,
    private navCtrl: NavController,   // Inyecta NavController
    private toastCtrl: ToastController // Inyecta ToastController
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]], // Añadido minLength para el nombre
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {}

  async onRegister() { // Convertido a async
    if (this.registerForm.invalid) {
      console.log("⚠️ Formulario de registro inválido");
      this.presentToast('Por favor, completa todos los campos correctamente.');
      // Podrías marcar los campos como "touched" para mostrar errores individuales si los tienes configurados
      this.registerForm.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.registerForm.value;
    console.log("🔥 Intentando registrar con:", this.registerForm.value);

    try {
      // 1. Registrar el usuario en Firebase Authentication
      const userCredential = await this.authService.register(email, password);
      console.log('[REGISTER PAGE] Usuario registrado en Firebase Auth:', userCredential.user);

      // 2. Actualizar el perfil del usuario en Firebase Auth (displayName)
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        console.log('[REGISTER PAGE] Perfil de Firebase Auth actualizado con displayName:', name);
      }

      // 3. Guardar información adicional en Firestore (Colección "usuarios")
      // Usaremos el UID del usuario como ID del documento para fácil acceso.
      const userDocRef = doc(this.firestore, `usuarios/${userCredential.user.uid}`);
      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        nombre: name, // Consistent naming with the form
        email: email,
        // Puedes añadir más campos aquí, como fechaDeCreacion, etc.
        // photoURL: null, // Podrías inicializarlo o añadirlo después
        fechaCreacion: new Date().toISOString() // Ejemplo de campo adicional
      });
      console.log('[REGISTER PAGE] Datos del usuario guardados en Firestore en usuarios/', userCredential.user.uid);

      // 4. Espera a que authService.user$ confirme el nuevo usuario (con displayName actualizado) ANTES de navegar
      console.log('[REGISTER PAGE] Esperando que authService.user$ emita el usuario registrado y actualizado...');
      await firstValueFrom(
        this.authService.user$.pipe(
          tap(u => console.log('[REGISTER PAGE] authService.user$ emitió durante la espera:', u)),
          // Espera a que el usuario no sea null, tenga el UID correcto y el displayName actualizado
          filter(user =>
            user !== null &&
            user.uid === userCredential.user.uid &&
            user.displayName === name
          ),
          take(1) // Toma la primera emisión que cumpla el filtro y completa
        )
      );
      console.log('[REGISTER PAGE] authService.user$ ha confirmado el usuario. Navegando a /tabs/tasks...');

      // 5. Ahora es seguro navegar
      this.navCtrl.navigateRoot('/tabs/tasks', { animationDirection: 'forward' });
      this.presentToast('¡Registro exitoso! Bienvenido/a.', 3000, 'success');

    } catch (error: any) {
      console.error("[REGISTER PAGE] ❌ Error al registrar: ", error);
      let errorMessage = 'Ocurrió un error durante el registro.';
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Este correo electrónico ya está en uso. Por favor, intenta con otro.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'El formato del correo electrónico no es válido.';
            break;
          case 'auth/weak-password':
            errorMessage = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
            break;
          default:
            errorMessage = 'Error de registro. Inténtalo de nuevo.';
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
      color: color, // El color se pasa directamente
    });
    toast.present();
  }
}
