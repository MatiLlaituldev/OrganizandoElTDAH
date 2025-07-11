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
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss'],
  standalone: false,
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
  minDate: string = '';
  minDateTime: string = '';

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private taskService: TaskService,
    private goalService: GoalService,
    private etiquetaService: EtiquetaService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.minDate = this.getLocalDateString();
    this.minDateTime = this.getLocalDateTimeString();

    if (this.tarea && this.tarea.id) {
      this.modalTitle = 'Editar Tarea';
      this.botonGuardarTexto = 'Actualizar Tarea';
    }

    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.metas$ = this.goalService.getMetas(currentUser.uid);
      this.etiquetas$ = this.etiquetaService.getEtiquetas();
    }

    this.tareaForm = this.fb.group({
      titulo: [this.tarea?.titulo || '', Validators.required],
      descripcion: [this.tarea?.descripcion || ''],
      metaId: [
        {
          value: this.tarea?.metaId || this.metaId || null,
          disabled: !!this.metaSeleccionada,
        },
        this.metaSeleccionada ? [Validators.required] : [],
      ],
      prioridad: [this.tarea?.prioridad ?? 2, Validators.required],
      fechaVencimiento: [this.tarea?.fechaVencimiento || null],
      fechaRecordatorio: [this.tarea?.fechaRecordatorio || null],
      recurrencia: [this.tarea?.recurrencia || 'unica', Validators.required],
      subtareas: this.fb.array(
        this.tarea?.subtareas?.map((st) =>
          this.fb.group({ titulo: [st.titulo, Validators.required] })
        ) || []
      ),
      etiquetas: [this.tarea?.etiquetas || []],
    });

    if (this.metaSeleccionada) {
      this.tareaForm.get('metaId')?.disable();
    } else {
      this.tareaForm.get('metaId')?.enable();
    }
  }

  getLocalDateString(): string {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Hora local a las 00:00
    return now.toISOString().split('T')[0];
  }

  getLocalDateTimeString(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
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

  limpiarFechaRecordatorio() {
    this.tareaForm.get('fechaRecordatorio')?.setValue(null);
  }

  compareWith(o1: any, o2: any): boolean {
    return o1 && o2 && o1.id === o2.id;
  }

  async cerrarModal(data?: any) {
    await this.modalCtrl.dismiss(data);
  }

  async guardarTarea() {
    if (this.tareaForm.invalid) {
      this.presentToast(
        'Por favor, completa los campos requeridos.',
        'warning'
      );
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
      fechaRecordatorio: formValues.fechaRecordatorio || null,
      recurrencia: formValues.recurrencia,
      subtareas: formValues.subtareas || [],
      etiquetas: formValues.etiquetas || [],
    };

    try {
      this.presentToast('Guardando...', 'light', 1500);

      // Si es edición, primero cancela las notificaciones anteriores si existen
      if (this.tarea && this.tarea.id) {
        if (this.tarea.notificationId) {
          await this.notificationService.cancelNotification([
            this.tarea.notificationId,
          ]);
        }
        if (this.tarea.notificationIdVencimiento) {
          await this.notificationService.cancelNotification([
            this.tarea.notificationIdVencimiento,
          ]);
        }

        // Programa nueva notificación de recordatorio personalizada
        tareaData.notificationId = await this.notificationService.programarNotificacionTarea(
          { ...this.tarea, ...tareaData } as Tarea,
          this.tarea.id
        );

        // Notificación un día antes de la fecha de vencimiento
        tareaData.notificationIdVencimiento = await this.notificationService.programarNotificacionVencimientoTarea(
          { ...this.tarea, ...tareaData } as Tarea,
          this.tarea.id
        );

        // Elimina campos undefined antes de guardar
        if (tareaData.notificationId === undefined) delete tareaData.notificationId;
        if (tareaData.notificationIdVencimiento === undefined) delete tareaData.notificationIdVencimiento;

        await this.taskService.actualizarTask(userId, this.tarea.id, tareaData);
        this.presentToast('Tarea actualizada exitosamente.', 'success');
        this.cerrarModal({
          actualizado: true,
          id: this.tarea.id,
          tarea: { ...this.tarea, ...tareaData },
        });
      } else {
        // Nueva tarea: programa notificación de recordatorio personalizada
        const docRef = await this.taskService.agregarTask(userId, tareaData);

        tareaData.notificationId = await this.notificationService.programarNotificacionTarea(
          { ...tareaData, id: docRef.id } as Tarea,
          docRef.id
        );

        tareaData.notificationIdVencimiento = await this.notificationService.programarNotificacionVencimientoTarea(
          { ...tareaData, id: docRef.id } as Tarea,
          docRef.id
        );

        if (tareaData.notificationId === undefined) delete tareaData.notificationId;
        if (tareaData.notificationIdVencimiento === undefined) delete tareaData.notificationIdVencimiento;

        this.presentToast('Tarea creada exitosamente.', 'success');
        this.cerrarModal({
          creada: true,
          tarea: { ...tareaData, id: docRef.id },
        });
      }
    } catch (error) {
      console.error('Error al guardar la tarea:', error);
      this.presentToast(
        'Error al guardar la tarea. Inténtalo de nuevo.',
        'danger'
      );
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
      cssClass: 'custom-toast',
    });
    toast.present();
  }
}
