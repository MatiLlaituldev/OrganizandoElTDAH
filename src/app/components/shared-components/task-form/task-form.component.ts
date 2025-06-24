import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { Meta } from 'src/app/models/meta.model';
import { Etiqueta } from 'src/app/models/etiqueta.model';
import { TaskService } from 'src/app/services/task.service';
import { GoalService } from 'src/app/services/goal.service';
import { EtiquetaService } from 'src/app/services/etiqueta.service';
import { AuthService } from 'src/app/services/auth.service';
import { Tarea } from 'src/app/models/tarea.model';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss'],
  standalone: false
})
export class TaskFormComponent implements OnInit {
  @Input() tarea?: Tarea;
  @Input() metaId?: string;
  @Input() metaSeleccionada?: boolean = false;

  tareaForm!: FormGroup;
  metas$!: Observable<Meta[]>;
  etiquetas$!: Observable<Etiqueta[]>;
  modalTitle = 'Nueva Tarea';
  botonGuardarTexto = 'Guardar Tarea';
  minDate: string = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private taskService: TaskService,
    private goalService: GoalService,
    private etiquetaService: EtiquetaService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.tarea && this.tarea.id) {
      this.modalTitle = 'Editar Tarea';
      this.botonGuardarTexto = 'Actualizar Tarea';
    }

    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.metas$ = this.goalService.getMetas(currentUser.uid);
      this.etiquetas$ = this.etiquetaService.getEtiquetas(); // <-- Arreglado: sin argumentos
    }

    // Manejo del estado disabled de metaId solo desde TS
    this.tareaForm = this.fb.group({
      titulo: [this.tarea?.titulo || '', Validators.required],
      descripcion: [this.tarea?.descripcion || ''],
      metaId: [
        { value: this.tarea?.metaId || this.metaId || null, disabled: !!this.metaSeleccionada },
        this.metaSeleccionada ? [Validators.required] : []
      ],
      prioridad: [this.tarea?.prioridad ?? 2, Validators.required],
      fechaVencimiento: [this.tarea?.fechaVencimiento || null],
      recurrencia: [this.tarea?.recurrencia || 'unica', Validators.required],
      subtareas: this.fb.array(this.tarea?.subtareas?.map(st => this.fb.group({ titulo: [st.titulo, Validators.required] })) || []),
      etiquetas: [this.tarea?.etiquetas || []]
    });

    if (this.metaSeleccionada) {
      this.tareaForm.get('metaId')?.disable();
    } else {
      this.tareaForm.get('metaId')?.enable();
    }
  }

  get subtareas(): FormArray {
    return this.tareaForm.get('subtareas') as FormArray;
  }

  addSubtask() {
    this.subtareas.push(this.fb.group({ titulo: ['', Validators.required] }));
  }

  removeSubtask(index: number) {
    this.subtareas.removeAt(index);
  }

  limpiarFechaVencimiento() {
    this.tareaForm.get('fechaVencimiento')?.setValue(null);
  }

  compareWith(o1: any, o2: any): boolean {
    return o1 && o2 && o1.id === o2.id;
  }

  async cerrarModal(data?: any) {
    await this.modalCtrl.dismiss(data);
  }

  async guardarTarea() {
    if (this.tareaForm.invalid) {
      this.presentToast('Por favor, completa los campos requeridos.', 'warning');
      this.tareaForm.markAllAsTouched();
      return;
    }

    const formValues = this.tareaForm.getRawValue();
    const currentUser = await this.authService.getCurrentUser();
    const userId = currentUser?.uid;

    if (!userId) {
      this.presentToast('Error: No se pudo identificar al usuario.', 'danger');
      return;
    }

    const tareaData: Partial<Tarea> = {
      titulo: formValues.titulo,
      descripcion: formValues.descripcion || '',
      metaId: this.metaSeleccionada ? this.metaId : formValues.metaId || null,
      prioridad: formValues.prioridad,
      fechaVencimiento: formValues.fechaVencimiento || null,
      recurrencia: formValues.recurrencia,
      subtareas: formValues.subtareas || [],
      etiquetas: formValues.etiquetas || []
    };

    try {
      this.presentToast('Guardando...', 'light', 1500);

      if (this.tarea && this.tarea.id) {
        await this.taskService.actualizarTask(userId, this.tarea.id, tareaData);
        this.presentToast('Tarea actualizada exitosamente.', 'success');
        this.cerrarModal({ actualizado: true, id: this.tarea.id, tarea: { ...this.tarea, ...tareaData } });
      } else {
        const docRef = await this.taskService.agregarTask(userId, tareaData);
        this.presentToast('Tarea creada exitosamente.', 'success');
        this.cerrarModal({ creada: true, tarea: { ...tareaData, id: docRef.id } });
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
