import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray} from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { Tarea, Subtarea } from '../../../models/tarea.model'; // Asegúrate de importar Subtarea
import { AuthService } from '../../../services/auth.service';
import { TaskService } from '../../../services/task.service';
import { Timestamp } from 'firebase/firestore';

import { Etiqueta } from '../../../models/etiqueta.model';
import { EtiquetaService } from '../../../services/etiqueta.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss'],
  standalone: false
})
export class TaskFormComponent implements OnInit {

  @Input() tarea?: Tarea;
  tareaForm!: FormGroup;
  esEdicion: boolean = false;
  minDate: string;
  etiquetas$!: Observable<Etiqueta[]>;
  compareWith = (o1: any, o2: any) => o1 && o2 ? o1.id === o2.id : o1 === o2;

  get modalTitle(): string { return this.esEdicion ? 'Editar Tarea' : 'Nueva Tarea'; }
  get botonGuardarTexto(): string { return this.esEdicion ? 'Actualizar Tarea' : 'Guardar Tarea'; }

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private taskService: TaskService,
    private etiquetaService: EtiquetaService
  ) {
    this.minDate = new Date().toISOString().split('T')[0];
  }

  // --- AÑADIDO ---
  // Métodos para gestionar el FormArray de subtareas.

  // Getter para acceder fácilmente al FormArray desde el HTML
  get subtareas(): FormArray {
    return this.tareaForm.get('subtareas') as FormArray;
  }

  // Crea un FormGroup para una subtarea (nueva o existente)
  createSubtaskFormGroup(subtask?: Subtarea): FormGroup {
    return this.fb.group({
      id: [subtask?.id || new Date().getTime().toString()],
      titulo: [subtask?.titulo || '', Validators.required]
    });
  }

  // Añade una nueva subtarea vacía al FormArray
  addSubtask() {
    const lastSubtask = this.subtareas.at(this.subtareas.length - 1);
    if (this.subtareas.length === 0 || lastSubtask.valid) {
      this.subtareas.push(this.createSubtaskFormGroup());
    }
  }

  // Elimina una subtarea del FormArray por su índice
  removeSubtask(index: number) {
    this.subtareas.removeAt(index);
  }

  // --- MODIFICADO ---
  // Se actualiza ngOnInit para incluir el FormArray de subtareas.
  ngOnInit() {
    this.esEdicion = !!this.tarea && !!this.tarea.id;
    this.etiquetas$ = this.etiquetaService.getEtiquetas();

    this.tareaForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      fechaVencimiento: [null],
      prioridad: [2],
      etiquetas: [[]],
      recurrencia: ['unica', Validators.required],
      // Se añade el FormArray para las subtareas.
      subtareas: this.fb.array(this.tarea?.subtareas?.map(sub => this.createSubtaskFormGroup(sub)) || [])
    });

    if (this.esEdicion && this.tarea) {
      let fechaVencimientoISO = null;
      if (this.tarea.fechaVencimiento && this.tarea.fechaVencimiento instanceof Timestamp) {
        fechaVencimientoISO = this.tarea.fechaVencimiento.toDate().toISOString();
      } else if (typeof this.tarea.fechaVencimiento === 'string') {
        fechaVencimientoISO = this.tarea.fechaVencimiento;
      }
      this.tareaForm.patchValue({ ...this.tarea, fechaVencimiento: fechaVencimientoISO });
    }
  }

  async cerrarModal(data?: any) { await this.modalCtrl.dismiss(data); }

  limpiarFechaVencimiento() { this.tareaForm.get('fechaVencimiento')?.setValue(null); }

  // --- MODIFICADO ---
  // Se actualiza guardarTarea para incluir las subtareas en el objeto que se guarda.
  async guardarTarea() {
    if (this.tareaForm.invalid) {
      this.presentToast('Por favor, completa los campos requeridos.', 'warning');
      this.tareaForm.markAllAsTouched();
      return;
    }

    const formValues = this.tareaForm.value;
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser) {
      this.presentToast('Error: No se pudo identificar al usuario.', 'danger');
      return;
    }

    const tareaData: Partial<Tarea> = {
      titulo: formValues.titulo,
      descripcion: formValues.descripcion || null,
      prioridad: formValues.prioridad,
      etiquetas: formValues.etiquetas || [],
      recurrencia: formValues.recurrencia,
      fechaVencimiento: formValues.fechaVencimiento ? Timestamp.fromDate(new Date(formValues.fechaVencimiento)) : null,
      // Se añaden las subtareas, filtrando las que estén vacías.
      subtareas: formValues.subtareas?.filter((s: any) => s.titulo) || []
    };

    try {
      this.presentToast('Guardando...', 'light', 1500);
      if (this.esEdicion && this.tarea?.id) {
        await this.taskService.actualizarTask(currentUser.uid, this.tarea.id, tareaData);
        this.presentToast('Tarea actualizada exitosamente.', 'success');
        this.cerrarModal({ actualizada: true, id: this.tarea.id, tarea: { ...this.tarea, ...tareaData } });
      } else {
        const nuevaTareaParaGuardar: Tarea = {
          ...tareaData,
          fechaCreacion: Timestamp.now(),
          completada: false,
        } as Tarea;
        const docRef = await this.taskService.agregarTask(currentUser.uid, nuevaTareaParaGuardar);
        this.presentToast('Tarea creada exitosamente.', 'success');
        this.cerrarModal({ creada: true, tarea: { ...nuevaTareaParaGuardar, id: docRef.id } });
      }
    } catch (error) {
      console.error('Error al guardar la tarea:', error);
      this.presentToast('Error al guardar la tarea. Inténtalo de nuevo.', 'danger');
    }
  }

  async presentToast(mensaje: string, color: 'success' | 'warning' | 'danger' | 'light' | 'dark' = 'dark', duracion: number = 2500) {
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
