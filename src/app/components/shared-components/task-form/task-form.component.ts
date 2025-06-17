import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { Tarea } from '../../../models/tarea.model';
import { AuthService } from '../../../services/auth.service';
import { TaskService } from '../../../services/task.service';
import { Timestamp } from 'firebase/firestore';

// --- PASO 1: IMPORTAR MODELO Y SERVICIO DE ETIQUETAS ---
import { Etiqueta } from '../../../models/etiqueta.model';
import { EtiquetaService } from '../../../services/etiqueta.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss'],
  standalone: false // Asegúrate de que este componente no es standalone
})
export class TaskFormComponent implements OnInit {

  @Input() tarea?: Tarea;

  tareaForm!: FormGroup;
  esEdicion: boolean = false;
  minDate: string;

  // --- PASO 2: AÑADIR PROPIEDADES PARA ETIQUETAS ---
  etiquetas$!: Observable<Etiqueta[]>;
  compareWith = (o1: any, o2: any) => {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  };

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
    private taskService: TaskService,
    private etiquetaService: EtiquetaService // --- PASO 3: INYECTAR SERVICIO ---
  ) {
    this.minDate = new Date().toISOString().split('T')[0];
  }

  ngOnInit() {
    this.esEdicion = !!this.tarea && !!this.tarea.id;
    // --- PASO 4: CARGAR ETIQUETAS ---
    this.etiquetas$ = this.etiquetaService.getEtiquetas();

    this.tareaForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      fechaVencimiento: [null],
      prioridad: [3],
      // --- PASO 5: AÑADIR CAMPO AL FORMULARIO ---
      etiquetas: [[]],
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
        // --- PASO 6: 'PARCHEAR' VALOR DE ETIQUETAS ---
        etiquetas: this.tarea.etiquetas || [],
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
    const currentUser = await this.authService.getCurrentUser();
    const userId = currentUser?.uid;

    if (!userId) {
      this.presentToast('Error: No se pudo identificar al usuario.', 'danger');
      return;
    }

    const tareaData: Partial<Tarea> = {
      titulo: formValues.titulo,
      descripcion: formValues.descripcion || null,
      prioridad: formValues.prioridad,
      fechaVencimiento: formValues.fechaVencimiento
        ? Timestamp.fromDate(new Date(formValues.fechaVencimiento))
        : null,
      // --- PASO 7: INCLUIR ETIQUETAS EN LOS DATOS A GUARDAR ---
      etiquetas: formValues.etiquetas || []
    };

    try {
      this.presentToast('Guardando...', 'light', 1500);

      if (this.esEdicion && this.tarea?.id) {
        await this.taskService.actualizarTask(userId, this.tarea.id, tareaData);
        this.presentToast('Tarea actualizada exitosamente.', 'success');
        this.cerrarModal({ actualizada: true, id: this.tarea.id, tarea: { ...this.tarea, ...tareaData } });
      } else {
        const nuevaTareaParaGuardar: Tarea = {
          ...tareaData,
          fechaCreacion: Timestamp.now(),
          completada: false,
        } as Tarea;

        const docRef = await this.taskService.agregarTask(userId, nuevaTareaParaGuardar);
        this.presentToast('Tarea creada exitosamente.', 'success');
        this.cerrarModal({ creada: true, tarea: { ...nuevaTareaParaGuardar, id: docRef.id } });
      }
    } catch (error) {
      console.error('Error al guardar la tarea:', error);
      this.presentToast('Error al guardar la tarea. Inténtalo de nuevo.', 'danger');
    }
  }

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
