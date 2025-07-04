import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController, LoadingController } from '@ionic/angular';
import { Meta } from '../../../models/meta.model';
import { AuthService } from '../../../services/auth.service';
import { GoalService } from '../../../services/goal.service';
import { TaskService } from '../../../services/task.service';
import { HabitoService } from '../../../services/habito.service';
import { NotificationService } from '../../../services/notification.service';
import { Tarea } from '../../../models/tarea.model';
import { Habito } from '../../../models/habito.model';
import { Timestamp } from 'firebase/firestore';
import { User } from '@firebase/auth';
import { Router } from '@angular/router';

// Importa los formularios de tarea y hábito si los usas como modales
import { TaskFormComponent } from '../task-form/task-form.component';
import { HabitoFormComponent } from '../habito-form/habito-form.component';

@Component({
  selector: 'app-goal-form',
  templateUrl: './goal-form.component.html',
  styleUrls: ['./goal-form.component.scss'],
  standalone: false
})
export class GoalFormComponent implements OnInit {

  @Input() meta?: Meta;

  goalForm!: FormGroup;
  esEdicion: boolean = false;
  minDate: string;
  loadingElement: HTMLIonLoadingElement | null = null;

  tareas: Tarea[] = [];
  habitos: Habito[] = [];

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private goalService: GoalService,
    private taskService: TaskService,
    private habitoService: HabitoService,
    private notificationService: NotificationService,
    private loadingCtrl: LoadingController,
    private router: Router
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.minDate = today.toISOString().split('T')[0];
  }

  get modalTitle(): string {
    return this.esEdicion ? 'Editar Meta' : 'Nueva Meta';
  }
  get botonGuardarTexto(): string {
    return this.esEdicion ? 'Actualizar' : 'Guardar';
  }

  get metaId(): string | undefined {
    return this.meta?.id;
  }

  async ngOnInit() {
    this.esEdicion = !!this.meta;
    this.goalForm = this.fb.group({
      titulo: [this.meta?.titulo || '', [Validators.required, Validators.maxLength(60)]],
      descripcion: [this.meta?.descripcion || '', [Validators.maxLength(200)]],
      fechaLimite: [
        this.meta?.fechaLimite
          ? (this.meta.fechaLimite instanceof Timestamp
              ? this.meta.fechaLimite.toDate().toISOString().split('T')[0]
              : this.meta.fechaLimite)
          : ''
      ]
    });

    // Cargar tareas y hábitos asociados si es edición
    if (this.esEdicion && this.meta?.id) {
      const user = await this.authService.getCurrentUser();
      if (user?.uid) {
        this.taskService.getTasks(user.uid).subscribe(tareas => {
          this.tareas = (tareas || []).filter(t => t.metaId === this.meta?.id);
        });
        this.habitoService.getHabitos(user.uid).subscribe(habitos => {
          this.habitos = (habitos || []).filter(h => h.metaId === this.meta?.id);
        });
      }
    }
  }

  async cerrarModal(data?: any) {
    await this.modalCtrl.dismiss(data);
  }

  limpiarFechaLimite() {
    this.goalForm.get('fechaLimite')?.setValue('');
  }

  async guardarMeta() {
    if (this.goalForm.invalid) {
      this.presentToast('Por favor, completa los campos requeridos.', 'warning');
      this.goalForm.markAllAsTouched();
      return;
    }

    const formValues = this.goalForm.value;
    const currentUser: User | null = await this.authService.getCurrentUser();

    if (!currentUser?.uid) {
      this.presentToast('Error: No se pudo identificar al usuario.', 'danger');
      return;
    }
    const userId = currentUser.uid;

    const metaDataParaGuardar: Partial<Omit<Meta, 'id' | 'userId' | 'fechaCreacion' | 'estado'>> = {
      titulo: formValues.titulo,
      descripcion: formValues.descripcion || null,
      fechaLimite: formValues.fechaLimite ? formValues.fechaLimite : null,
    };

    try {
      await this.presentLoading(this.esEdicion ? 'Actualizando meta...' : 'Guardando meta...');

      if (this.esEdicion && this.meta?.id) {
        const datosActualizados: Partial<Meta> = {
          ...metaDataParaGuardar,
          fechaLimite: formValues.fechaLimite ? Timestamp.fromDate(new Date(formValues.fechaLimite)) : null,
        };
        await this.goalService.actualizarMeta(userId, this.meta.id, datosActualizados);

        // Notificaciones solo si hay fecha límite
        if (formValues.fechaLimite) {
          await this.notificationService.programarNotificacionVencimientoMeta(
            { ...this.meta, ...datosActualizados } as Meta,
            this.meta.id
          );
          await this.notificationService.programarNotificacionMetaPrueba(
            { ...this.meta, ...datosActualizados } as Meta,
            this.meta.id
          );
        }

        this.presentToast('Meta actualizada exitosamente.', 'success');
        this.cerrarModal({ actualizada: true, id: this.meta.id, meta: { ...this.meta, ...datosActualizados } });
        this.router.navigate(['/goal-detail', this.meta.id]);
      } else {
        const docRef = await this.goalService.agregarMeta(userId, metaDataParaGuardar as Omit<Meta, 'id' | 'userId' | 'fechaCreacion' | 'estado'>);

        // Notificaciones solo si hay fecha límite
        if (formValues.fechaLimite) {
          await this.notificationService.programarNotificacionVencimientoMeta(
            { ...metaDataParaGuardar, id: docRef.id } as Meta,
            docRef.id
          );
          await this.notificationService.programarNotificacionMetaPrueba(
            { ...metaDataParaGuardar, id: docRef.id } as Meta,
            docRef.id
          );
        }

        this.presentToast('Meta creada exitosamente.', 'success');
        this.cerrarModal({ creada: true, id: docRef.id, meta: { ...metaDataParaGuardar, id: docRef.id } });
        this.router.navigate(['/goal-detail', docRef.id]);
      }
    } catch (error) {
      console.error('Error al guardar la meta:', error);
      this.presentToast('Error al guardar la meta. Inténtalo de nuevo.', 'danger');
    } finally {
      await this.dismissLoading();
    }
  }

  // Métodos para tareas
  async crearTareaParaMeta() {
    if (!this.metaId) {
      this.presentToast('Primero debes guardar la meta.', 'warning');
      return;
    }
    const modal = await this.modalCtrl.create({
      component: TaskFormComponent,
      componentProps: {
        metaId: this.metaId,
        metaSeleccionada: true
      }
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.creada) {
      const user = await this.authService.getCurrentUser();
      if (user?.uid) {
        this.taskService.getTasks(user.uid).subscribe(tareas => {
          this.tareas = (tareas || []).filter(t => t.metaId === this.metaId);
        });
      }
    }
  }

  async editarTarea(tarea: Tarea) {
    this.presentToast('Funcionalidad para editar tarea no implementada.', 'warning');
  }
  async eliminarTarea(tarea: Tarea) {
    this.presentToast('Funcionalidad para eliminar tarea no implementada.', 'warning');
  }

  // Métodos para hábitos
  async crearHabitoParaMeta() {
    if (!this.metaId) {
      this.presentToast('Primero debes guardar la meta.', 'warning');
      return;
    }
    const modal = await this.modalCtrl.create({
      component: HabitoFormComponent,
      componentProps: {
        metaId: this.metaId,
        metaSeleccionada: true
      }
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.creada) {
      const user = await this.authService.getCurrentUser();
      if (user?.uid) {
        this.habitoService.getHabitos(user.uid).subscribe(habitos => {
          this.habitos = (habitos || []).filter(h => h.metaId === this.metaId);
        });
      }
    }
  }

  async editarHabito(habito: Habito) {
    this.presentToast('Funcionalidad para editar hábito no implementada.', 'warning');
  }
  async eliminarHabito(habito: Habito) {
    this.presentToast('Funcionalidad para eliminar hábito no implementada.', 'warning');
  }

  onIntentoAsociar(tipo: 'tarea' | 'habito') {
    if (!this.metaId) {
      this.presentToast('Primero debes guardar la meta antes de poder asociar hábitos o tareas.', 'warning');
      return;
    }
    if (tipo === 'tarea') {
      this.crearTareaParaMeta();
    } else {
      this.crearHabitoParaMeta();
    }
  }

  async presentToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    toast.present();
  }

  async presentLoading(message: string) {
    if (this.loadingElement) {
      try {
        await this.loadingElement.dismiss();
      } catch (e) { /* Ignorar */ }
      this.loadingElement = null;
    }
    this.loadingElement = await this.loadingCtrl.create({
      message,
      spinner: 'crescent'
    });
    await this.loadingElement.present();
  }

  async dismissLoading() {
    if (this.loadingElement) {
      try {
        await this.loadingElement.dismiss();
      } catch (e) { /* Ignorar */ }
      this.loadingElement = null;
    }
  }}
