import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { Habito } from 'src/app/models/habito.model';
import { AuthService } from 'src/app/services/auth.service';
import { HabitoService } from 'src/app/services/habito.service';
import { Timestamp } from 'firebase/firestore';
import { Meta } from 'src/app/models/meta.model';
import { GoalService } from 'src/app/services/goal.service';
import { Observable } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service'; // Asegúrate de tener este servicio

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
    private notificationService: NotificationService // Inyecta tu servicio de notificaciones
  ) {}

  ngOnInit() {
    this.esEdicion = !!this.habito && !!this.habito.id;

    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.metas$ = this.goalService.getMetas(currentUser.uid);
    }

    this.habitoForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      frecuenciaTipo: ['diaria', Validators.required],
      icono: [this.iconos[0]],
      color: [this.colores[0]],
      horaPreferida: [null],
      metaId: [
        { value: this.metaId || null, disabled: !!this.metaSeleccionada },
        this.metaSeleccionada ? [Validators.required] : []
      ],
      metaRacha: [this.habito?.metaRacha ?? null]
    });

    // Si es edición, carga los valores y los días seleccionados
    if (this.esEdicion && this.habito) {
      this.habitoForm.patchValue({
        titulo: this.habito.titulo,
        descripcion: this.habito.descripcion || '',
        frecuenciaTipo: this.habito.frecuenciaTipo || 'diaria',
        icono: this.habito.icono || this.iconos[0],
        color: this.habito.color || this.colores[0],
        horaPreferida: this.habito.horaPreferida || null,
        metaId: this.habito.metaId || this.metaId || null,
        metaRacha: this.habito.metaRacha ?? null
      });
      if (this.metaSeleccionada) {
        this.habitoForm.get('metaId')?.disable();
      } else {
        this.habitoForm.get('metaId')?.enable();
      }
      // Carga los días seleccionados si existen
      if (this.habito.diasSemana && Array.isArray(this.habito.diasSemana)) {
        this.diasSeleccionados = [...this.habito.diasSemana];
      }
    }

    // Limpia los días seleccionados si cambia la frecuencia a diaria
    this.habitoForm.get('frecuenciaTipo')?.valueChanges.subscribe(val => {
      if (val === 'diaria') {
        this.diasSeleccionados = [];
      }
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

  // Función auxiliar para calcular la próxima fecha para un día de la semana y hora
  private getNextDateForDayAndTime(diaSemana: number, horaPreferida: string): Date {
    const [hora, minuto] = horaPreferida.split(':').map(Number);
    const now = new Date();
    const result = new Date(now);
    result.setHours(hora, minuto, 0, 0);

    // 0 = domingo, 1 = lunes, ..., 6 = sábado
    const diaActual = now.getDay();
    let diasHasta = diaSemana - diaActual;
    if (diasHasta < 0 || (diasHasta === 0 && result <= now)) {
      diasHasta += 7;
    }
    result.setDate(now.getDate() + diasHasta);
    return result;
  }

  // Genera un ID único para cada notificación (puedes mejorarlo según tu lógica)
  private generaIdUnico(): number {
    return Math.floor(Math.random() * 100000000);
  }

  async guardarHabito() {
    // Validación: si metaSeleccionada es true, metaId debe estar presente
    if (this.metaSeleccionada && !this.metaId) {
      this.presentToast('No se encontró la meta asociada.', 'danger');
      return;
    }

    // Validación general del formulario
    if (this.habitoForm.invalid) {
      this.presentToast('Por favor, completa los campos requeridos.', 'warning');
      this.habitoForm.markAllAsTouched();
      return;
    }

    // Validación: si es semanal, debe seleccionar al menos un día
    if (this.habitoForm.get('frecuenciaTipo')?.value === 'semanal' && this.diasSeleccionados.length === 0) {
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
      frecuenciaTipo: formValues.frecuenciaTipo,
      icono: formValues.icono,
      color: formValues.color,
      horaPreferida: formValues.horaPreferida || null,
      metaId: this.metaSeleccionada ? this.metaId : formValues.metaId || null,
      metaRacha: formValues.metaRacha ?? null,
      diasSemana: formValues.frecuenciaTipo === 'semanal' ? [...this.diasSeleccionados] : undefined,
      recordatoriosActivos: true // Activar recordatorios por defecto
    };

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
          recordatoriosActivos: true,
        } as Habito;

        const docRef = await this.habitoService.agregarHabito(userId, nuevoHabitoData);
        habitoId = docRef.id;
        this.presentToast('Hábito creado exitosamente.', 'success');
        this.cerrarModal({ creada: true, habito: { ...nuevoHabitoData, id: habitoId } });
      }

      // NOTIFICACIONES: solo si hay hora preferida
      if (habitoData.horaPreferida) {
        if (habitoData.frecuenciaTipo === 'diaria') {
          // Notificación diaria
          const proximaFecha = this.getNextDateForDayAndTime(new Date().getDay(), habitoData.horaPreferida);
          await this.notificationService.scheduleNotification({
            notifications: [{
              id: this.generaIdUnico(),
              title: '¡Recuerda tu hábito!',
              body: `Hoy toca: ${habitoData.titulo}`,
              schedule: { at: proximaFecha },
              smallIcon: 'ic_stat_icon_config_sample',
              extra: { tipo: 'habito', id: habitoId }
            }]
          });
        } else if (habitoData.frecuenciaTipo === 'semanal' && habitoData.diasSemana) {
          // Notificación en días seleccionados
          for (const dia of habitoData.diasSemana) {
            const proximaFecha = this.getNextDateForDayAndTime(dia, habitoData.horaPreferida);
            await this.notificationService.scheduleNotification({
              notifications: [{
                id: this.generaIdUnico(),
                title: '¡Recuerda tu hábito!',
                body: `Hoy toca: ${habitoData.titulo}`,
                schedule: { at: proximaFecha },
                smallIcon: 'ic_stat_icon_config_sample',
                extra: { tipo: 'habito', id: habitoId }
              }]
            });
          }
        }
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
}
