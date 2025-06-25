import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { Habito } from 'src/app/models/habito.model';
import { AuthService } from 'src/app/services/auth.service';
import { HabitoService } from 'src/app/services/habito.service';
import { Timestamp } from 'firebase/firestore';
import { Meta } from 'src/app/models/meta.model';
import { GoalService } from 'src/app/services/goal.service';
import { Observable } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';
import { LocalNotifications } from '@capacitor/local-notifications';

@Component({
  selector: 'app-habito-form',
  templateUrl: './habito-form.component.html',
  styleUrls: ['./habito-form.component.scss'],
  standalone: false
})
export class HabitoFormComponent implements OnInit {
  @Input() habito?: Habito;
  @Input() metaId?: string;
  @Input() metaSeleccionada?: boolean = false;

  habitoForm!: FormGroup;
  esEdicion: boolean = false;
  metas$!: Observable<Meta[]>;

  colores = [
    '#FF6B6B', '#FFD166', '#06D6A0', '#118AB2', '#073B4C',
    '#F78C6B', '#FF8CC6', '#8338EC', '#3A86FF', '#6A040F'
  ];
  iconos = [
    'book', 'barbell', 'leaf', 'water', 'walk', 'bed', 'heart',
    'cash', 'musical-notes', 'code-slash', 'brush', 'construct'
  ];

  diasSemana = [
    { nombre: 'Lunes', valor: 1 },
    { nombre: 'Martes', valor: 2 },
    { nombre: 'Miércoles', valor: 3 },
    { nombre: 'Jueves', valor: 4 },
    { nombre: 'Viernes', valor: 5 },
    { nombre: 'Sábado', valor: 6 },
    { nombre: 'Domingo', valor: 0 }
  ];
  diasSeleccionados: number[] = [];

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private habitoService: HabitoService,
    private goalService: GoalService,
    private notificationService: NotificationService
  ) {}

  private frecuenciaRequeridaSiRecordatorioActivo(): ValidatorFn {
    return (control: AbstractControl) => {
      const parent = control.parent;
      if (!parent) return null;
      const recordatoriosActivos = parent.get('recordatoriosActivos')?.value;
      if (recordatoriosActivos && !control.value) {
        return { required: true };
      }
      return null;
    };
  }

  ngOnInit() {
    this.esEdicion = !!this.habito && !!this.habito.id;

    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.metas$ = this.goalService.getMetas(currentUser.uid);
    }

    this.habitoForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      frecuenciaTipo: ['', this.frecuenciaRequeridaSiRecordatorioActivo()],
      icono: [this.iconos[0]],
      color: [this.colores[0]],
      horaPreferida: [null],
      metaId: [
        { value: this.metaId || null, disabled: !!this.metaSeleccionada },
        this.metaSeleccionada ? [Validators.required] : []
      ],
      metaRacha: [this.habito?.metaRacha ?? null],
      recordatoriosActivos: [true]
    });

    if (this.esEdicion && this.habito) {
      this.habitoForm.patchValue({
        titulo: this.habito.titulo,
        descripcion: this.habito.descripcion || '',
        frecuenciaTipo: this.habito.frecuenciaTipo || '',
        icono: this.habito.icono || this.iconos[0],
        color: this.habito.color || this.colores[0],
        horaPreferida: this.habito.horaPreferida || null,
        metaId: this.habito.metaId || this.metaId || null,
        metaRacha: this.habito.metaRacha ?? null,
        recordatoriosActivos: this.habito.recordatoriosActivos ?? true
      });
      if (this.metaSeleccionada) {
        this.habitoForm.get('metaId')?.disable();
      } else {
        this.habitoForm.get('metaId')?.enable();
      }
      if (this.habito.diasSemana && Array.isArray(this.habito.diasSemana)) {
        this.diasSeleccionados = [...this.habito.diasSemana];
      }
    }

    this.habitoForm.get('frecuenciaTipo')?.valueChanges.subscribe(val => {
      if (val === 'diaria') {
        this.diasSeleccionados = [];
      }
    });

    this.habitoForm.get('recordatoriosActivos')?.valueChanges.subscribe(() => {
      this.habitoForm.get('frecuenciaTipo')?.updateValueAndValidity();
    });
  }

  toggleDiaSemana(valor: number) {
    const idx = this.diasSeleccionados.indexOf(valor);
    if (idx > -1) {
      this.diasSeleccionados.splice(idx, 1);
    } else {
      this.diasSeleccionados.push(valor);
    }
  }

  async cerrarModal(data?: any) {
    await this.modalCtrl.dismiss(data);
  }

  limpiarHoraPreferida() {
    this.habitoForm.get('horaPreferida')?.setValue(null);
  }

  async guardarHabito() {
    if (this.metaSeleccionada && !this.metaId) {
      this.presentToast('No se encontró la meta asociada.', 'danger');
      return;
    }

    if (this.habitoForm.invalid) {
      this.presentToast('Por favor, completa los campos requeridos.', 'warning');
      this.habitoForm.markAllAsTouched();
      return;
    }

    if (
      this.habitoForm.get('recordatoriosActivos')?.value &&
      this.habitoForm.get('frecuenciaTipo')?.value === 'semanal' &&
      this.diasSeleccionados.length === 0
    ) {
      this.presentToast('Selecciona al menos un día de la semana.', 'warning');
      return;
    }

    const formValues = this.habitoForm.getRawValue();
    const currentUser = await this.authService.getCurrentUser();
    const userId = currentUser?.uid;

    if (!userId) {
      this.presentToast('Error: No se pudo identificar al usuario.', 'danger');
      return;
    }

    const habitoData: Partial<Habito> = {
      titulo: formValues.titulo,
      descripcion: formValues.descripcion || '',
      frecuenciaTipo: formValues.recordatoriosActivos ? formValues.frecuenciaTipo : null,
      icono: formValues.icono,
      color: formValues.color,
      horaPreferida: formValues.recordatoriosActivos ? formValues.horaPreferida || null : null,
      metaId: this.metaSeleccionada ? this.metaId : formValues.metaId || null,
      metaRacha: formValues.metaRacha ?? null,
      recordatoriosActivos: formValues.recordatoriosActivos
    };
    if (formValues.recordatoriosActivos && formValues.frecuenciaTipo === 'semanal') {
      habitoData.diasSemana = [...this.diasSeleccionados];
    }

    try {
      this.presentToast('Guardando...', 'light', 1500);

      let habitoId: string | undefined;

      if (this.esEdicion && this.habito?.id) {
        await this.habitoService.actualizarHabito(userId, this.habito.id, habitoData);
        habitoId = this.habito.id;
        this.presentToast('Hábito actualizado exitosamente.', 'success');
        this.cerrarModal({ actualizado: true, id: habitoId, habito: { ...this.habito, ...habitoData } });
      } else {
        const nuevoHabitoData: Habito = {
          ...habitoData,
          fechaInicio: Timestamp.now(),
          rachaActual: 0,
          mejorRacha: 0,
          recordatoriosActivos: formValues.recordatoriosActivos,
        } as Habito;

        const docRef = await this.habitoService.agregarHabito(userId, nuevoHabitoData);
        habitoId = docRef.id;
        this.presentToast('Hábito creado exitosamente.', 'success');
        this.cerrarModal({ creada: true, habito: { ...nuevoHabitoData, id: habitoId } });
      }

      // NOTIFICACIONES: solo si el usuario quiere recordatorios y hay hora preferida y hay id
      if (formValues.recordatoriosActivos && habitoData.horaPreferida && habitoId) {
        console.log('Hora preferida:', habitoData.horaPreferida, typeof habitoData.horaPreferida);
        // Si viene en formato ISO, extrae solo la hora
        if (typeof habitoData.horaPreferida === 'string' && habitoData.horaPreferida.includes('T')) {
          habitoData.horaPreferida = habitoData.horaPreferida.split('T')[1]?.substring(0,5);
          console.log('Hora preferida corregida:', habitoData.horaPreferida);
        }
        await this.notificationService.programarNotificacionHabito(
          { ...habitoData, id: habitoId, diasSemana: habitoData.diasSemana } as Habito,
          habitoId
        );
      }

    } catch (error) {
      console.error('Error al guardar el hábito:', error);
      this.presentToast('Error al guardar el hábito. Inténtalo de nuevo.', 'danger');
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

  async probarNotificacion() {
    await LocalNotifications.requestPermissions();
    await LocalNotifications.schedule({
      notifications: [{
        id: 9999,
        title: 'Notificación de prueba',
        body: '¡Esto es una prueba!',
        schedule: { at: new Date(Date.now() + 5000) }
      }]
    });
    this.presentToast('Notificación de prueba programada en 5 segundos', 'success');
  }
}
