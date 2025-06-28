import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeedbackService } from '../../../services/feedback.service';
import { AuthService } from '../../../services/auth.service';
import { ToastController, LoadingController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.page.html',
  styleUrls: ['./feedback.page.scss'],
  standalone: false
})
export class FeedbackPage implements OnInit {
  feedbackForm: FormGroup;
  currentUser: any;

  tiposFeedback = [
    { value: 'sugerencia', label: 'Sugerencia', icon: 'bulb-outline', color: 'warning' },
    { value: 'problema', label: 'Problema', icon: 'alert-circle-outline', color: 'danger' },
    { value: 'elogio', label: 'Elogio', icon: 'heart-outline', color: 'success' },
    { value: 'bug', label: 'Error/Bug', icon: 'bug-outline', color: 'medium' },
    { value: 'mejora', label: 'Mejora', icon: 'trending-up-outline', color: 'tertiary' }
  ];

  constructor(
    private fb: FormBuilder,
    private feedbackService: FeedbackService,
    private authService: AuthService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private navCtrl: NavController
  ) {
    // Inicializar el formulario
    this.feedbackForm = this.fb.group({
      tipo: ['', Validators.required],
      titulo: ['', [Validators.required, Validators.minLength(5)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      puntuacion: [null],
      email: ['', [Validators.email]]
    });
  }

  ngOnInit() {
    // Obtener el usuario actual y prellenar el email si está disponible
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
      if (user?.email) {
        this.feedbackForm.patchValue({ email: user.email });
      }
    });
  }

  async enviarFeedback() {
    if (this.feedbackForm.valid && this.currentUser) {
      const loading = await this.loadingController.create({
        message: 'Enviando feedback...'
      });
      await loading.present();

      try {
        const feedbackData = {
          ...this.feedbackForm.value,
          userId: this.currentUser.uid
        };

        await this.feedbackService.enviarFeedback(feedbackData);

        const toast = await this.toastController.create({
          message: '¡Gracias por tu feedback! Nos ayuda a mejorar la app.',
          duration: 3000,
          color: 'success',
          position: 'top'
        });
        await toast.present();

        this.feedbackForm.reset();
        // Opcional: volver a la página anterior
        this.navCtrl.back();

      } catch (error) {
        console.error('Error al enviar feedback:', error);
        const toast = await this.toastController.create({
          message: 'Error al enviar feedback. Inténtalo de nuevo.',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      } finally {
        await loading.dismiss();
      }
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      this.feedbackForm.markAllAsTouched();
      const toast = await this.toastController.create({
        message: 'Por favor, completa todos los campos requeridos.',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
    }
  }

  onTipoChange() {
    const tipo = this.feedbackForm.get('tipo')?.value;
    const puntuacionControl = this.feedbackForm.get('puntuacion');

    // Solo requerir puntuación para elogios
    if (tipo === 'elogio') {
      puntuacionControl?.setValidators([Validators.required, Validators.min(1), Validators.max(5)]);
    } else {
      puntuacionControl?.clearValidators();
      puntuacionControl?.setValue(null);
    }
    puntuacionControl?.updateValueAndValidity();
  }

  // Métodos auxiliares para la UI
  getTipoIcon(tipo: string): string {
    const tipoObj = this.tiposFeedback.find(t => t.value === tipo);
    return tipoObj?.icon || 'chatbubble-outline';
  }

  getTipoColor(tipo: string): string {
    const tipoObj = this.tiposFeedback.find(t => t.value === tipo);
    return tipoObj?.color || 'primary';
  }

  // Verificar si un campo tiene errores
  hasError(fieldName: string): boolean {
    const field = this.feedbackForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Obtener mensaje de error para un campo
  getErrorMessage(fieldName: string): string {
    const field = this.feedbackForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} es requerido`;
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['email']) return 'Email inválido';
      if (field.errors['min']) return 'Puntuación mínima: 1';
      if (field.errors['max']) return 'Puntuación máxima: 5';
    }
    return '';
  }
}
