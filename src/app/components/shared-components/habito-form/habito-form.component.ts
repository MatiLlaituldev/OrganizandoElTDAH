// src/app/components/habito-form/habito-form.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { Habito } from 'src/app/models/habito.model'; // Ajusta la ruta a tu modelo Habito (MVP)
import { AuthService } from 'src/app/services/auth.service';
import { HabitoService } from 'src/app/services/habito.service'; // Ajusta la ruta (lo crearemos después)
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-habito-form', // Asegúrate que coincida con el selector usado
  templateUrl: './habito-form.component.html',
  styleUrls: ['./habito-form.component.scss'],
  standalone: false,

})
export class HabitoFormComponent implements OnInit {

  @Input() habito?: Habito; // Para pasar un hábito existente al editar

  habitoForm!: FormGroup;
  esEdicion: boolean = false;

  // Título del modal dinámico
  get modalTitle(): string {
    return this.esEdicion ? 'Editar Hábito' : 'Nuevo Hábito';
  }

  // Texto del botón de guardar dinámico
  get botonGuardarTexto(): string {
    return this.esEdicion ? 'Actualizar Hábito' : 'Guardar Hábito';
  }

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private habitoService: HabitoService // Servicio para interactuar con Firestore (lo crearemos)
  ) {}

  ngOnInit() {
    this.esEdicion = !!this.habito && !!this.habito.id;

    this.habitoForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      frecuenciaTipo: ['diaria', Validators.required], // Valor por defecto 'diaria'
      // frecuenciaValor: [[]], // Para MVP, este campo no se usa activamente en el form, pero podría inicializarse
      icono: [''], // ej: 'flame-outline'
      color: ['#7F00FF'], // Un color por defecto (morado primario)
      horaPreferida: [null], // Se manejará como string ISO HH:mm
    });

    if (this.esEdicion && this.habito) {
      this.habitoForm.patchValue({
        titulo: this.habito.titulo,
        descripcion: this.habito.descripcion || '',
        frecuenciaTipo: this.habito.frecuenciaTipo || 'diaria',
        // frecuenciaValor: this.habito.frecuenciaValor || [],
        icono: this.habito.icono || '',
        color: this.habito.color || '#7F00FF',
        horaPreferida: this.habito.horaPreferida || null, // El ion-datetime para time espera un string ISO
      });
    }
  }

  // Cerrar el modal
  async cerrarModal(data?: any) {
    await this.modalCtrl.dismiss(data);
  }

  // Limpiar el campo de hora preferida
  limpiarHoraPreferida() {
    this.habitoForm.get('horaPreferida')?.setValue(null);
  }

  // Guardar o actualizar el hábito
  async guardarHabito() {
    if (this.habitoForm.invalid) {
      this.presentToast('Por favor, completa los campos requeridos.', 'warning');
      this.habitoForm.markAllAsTouched();
      return;
    }

    const formValues = this.habitoForm.value;
    const currentUser = await this.authService.getCurrentUser(); // Asume que getCurrentUser es async o devuelve Promise
    const userId = currentUser?.uid;

    if (!userId) {
      this.presentToast('Error: No se pudo identificar al usuario.', 'danger');
      return;
    }

    // Prepara el objeto Habito
    const habitoData: Partial<Habito> = {
      titulo: formValues.titulo,
      descripcion: formValues.descripcion || null,
      frecuenciaTipo: formValues.frecuenciaTipo,
      // frecuenciaValor: formValues.frecuenciaValor, // Si se implementa en el futuro
      icono: formValues.icono || null,
      color: formValues.color || null,
      horaPreferida: formValues.horaPreferida || null, // Guardar null si no se seleccionó
    };

    try {
      this.presentToast('Guardando hábito...', 'light', 1500);

      if (this.esEdicion && this.habito?.id) {
        // --- Lógica de Actualización ---
        await this.habitoService.actualizarHabito(userId, this.habito.id, habitoData);
        this.presentToast('Hábito actualizado exitosamente.', 'success');
        this.cerrarModal({ actualizado: true, id: this.habito.id, habito: { ...this.habito, ...habitoData } });
      } else {
        // --- Lógica de Creación ---
        const nuevoHabitoData: Habito = {
          ...habitoData,
          fechaInicio: Timestamp.now(), // Fecha de inicio es ahora
          rachaActual: 0,               // Iniciar racha en 0
          mejorRacha: 0,                // Iniciar mejor racha en 0
          recordatoriosActivos: false,    // Por defecto, sin recordatorios activos para MVP
        } as Habito; // Asegurar el tipo

        const docRef = await this.habitoService.agregarHabito(userId, nuevoHabitoData);
        this.presentToast('Hábito creado exitosamente.', 'success');
        this.cerrarModal({ creada: true, habito: { ...nuevoHabitoData, id: docRef.id } });
      }
    } catch (error) {
      console.error('Error al guardar el hábito:', error);
      this.presentToast('Error al guardar el hábito. Inténtalo de nuevo.', 'danger');
    }
  }

  // Helper para mostrar mensajes Toast
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
}
