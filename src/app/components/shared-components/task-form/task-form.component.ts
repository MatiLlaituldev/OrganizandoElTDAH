// src/app/components/task-form/task-form.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { Tarea } from '../../../models/tarea.model'; // El modelo sigue siendo Tarea
import { AuthService } from '../../../services/auth.service';
// Importa TaskService y asegúrate que la ruta sea correcta
import { TaskService } from '../../../services/task.service'; // Asumiendo que el archivo se llama tarea.service.ts pero la clase es TaskService
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss'],
  standalone: false,
})
export class TaskFormComponent implements OnInit {

  @Input() tarea?: Tarea; // El modelo de datos de entrada sigue siendo Tarea

  tareaForm!: FormGroup;
  esEdicion: boolean = false;
  minDate: string;


  get modalTitle(): string {
    return this.esEdicion ? 'Editar Tarea' : 'Nueva Tarea';
  }

  get botonGuardarTexto(): string {
    return this.esEdicion ? 'Actualizar Tarea' : 'Guardar Tarea';
  }

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private taskService: TaskService // Inyecta TaskService y usa el alias taskService
  ) {
    this.minDate = new Date().toISOString().split('T')[0];
  }

  ngOnInit() {
    this.esEdicion = !!this.tarea && !!this.tarea.id;

    this.tareaForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      fechaVencimiento: [null],
      prioridad: [3],
    });

    if (this.esEdicion && this.tarea) {
      let fechaVencimientoISO = null;
      if (this.tarea.fechaVencimiento && this.tarea.fechaVencimiento instanceof Timestamp) {
        fechaVencimientoISO = this.tarea.fechaVencimiento.toDate().toISOString();
      } else if (typeof this.tarea.fechaVencimiento === 'string') {
        fechaVencimientoISO = this.tarea.fechaVencimiento;
      }

      this.tareaForm.patchValue({
        titulo: this.tarea.titulo,
        descripcion: this.tarea.descripcion || '',
        fechaVencimiento: fechaVencimientoISO,
        prioridad: this.tarea.prioridad || 3,
      });
    }
  }

  async cerrarModal(data?: any) {
    await this.modalCtrl.dismiss(data);
  }

  limpiarFechaVencimiento() {
    this.tareaForm.get('fechaVencimiento')?.setValue(null);
  }

  async guardarTarea() {
    if (this.tareaForm.invalid) {
      this.presentToast('Por favor, completa los campos requeridos.', 'warning');
      this.tareaForm.markAllAsTouched();
      return;
    }

    const formValues = this.tareaForm.value;
    // Asumiendo que getCurrentUser() en AuthService devuelve una Promesa o es async
    const currentUser = await this.authService.getCurrentUser();
    const userId = currentUser?.uid;

    if (!userId) {
      this.presentToast('Error: No se pudo identificar al usuario.', 'danger');
      return;
    }

    const tareaData: Partial<Tarea> = { // El objeto de datos sigue siendo de tipo Tarea
      titulo: formValues.titulo,
      descripcion: formValues.descripcion || null,
      prioridad: formValues.prioridad,
      fechaVencimiento: formValues.fechaVencimiento
        ? Timestamp.fromDate(new Date(formValues.fechaVencimiento))
        : null,
    };

    try {
      this.presentToast('Guardando...', 'light', 1500);

      if (this.esEdicion && this.tarea?.id) {
        // Llama al método actualizarTask de taskService
        await this.taskService.actualizarTask(userId, this.tarea.id, tareaData);
        this.presentToast('Tarea actualizada exitosamente.', 'success');
        // Devuelve la tarea actualizada (combinando la original con los nuevos datos)
        this.cerrarModal({ actualizada: true, id: this.tarea.id, tarea: { ...this.tarea, ...tareaData } });
      } else {
        // Llama al método agregarTask de taskService
        const nuevaTareaParaGuardar: Tarea = { // El objeto completo es de tipo Tarea
          ...tareaData,
          fechaCreacion: Timestamp.now(),
          completada: false,
        } as Tarea;

        const docRef = await this.taskService.agregarTask(userId, nuevaTareaParaGuardar);
        this.presentToast('Tarea creada exitosamente.', 'success');
        // Devuelve la tarea creada con su nuevo ID
        this.cerrarModal({ creada: true, tarea: { ...nuevaTareaParaGuardar, id: docRef.id } });
      }
    } catch (error) {
      console.error('Error al guardar la tarea:', error);
      this.presentToast('Error al guardar la tarea. Inténtalo de nuevo.', 'danger');
    }
  }

  // Helper para mostrar mensajes Toast
  async presentToast(
    mensaje: string,
    // CORRECCIÓN: Se añade 'dark' a los tipos permitidos y se mantiene como valor por defecto.
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
