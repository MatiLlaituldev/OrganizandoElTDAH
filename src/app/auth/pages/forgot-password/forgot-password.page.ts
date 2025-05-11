import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: false,
})
export class ForgotPasswordPage {

  email: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {}

  async onResetPassword() {
    if (!this.email) {
      this.showToast("Por favor, ingresa tu correo electrónico.");
      return;
    }

    try {
      await this.authService.resetPassword(this.email);
      this.showToast("🔗 Revisa tu correo para las instrucciones.");
      this.router.navigate(['/auth/login']);
    } catch (error: any) {
      this.showToast("❌ No se pudo enviar el correo. Verifica e intenta de nuevo.");
      console.error(error.message);
    }
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'primary',
    });
    toast.present();
  }
}
