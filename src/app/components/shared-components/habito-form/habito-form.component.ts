import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { Habito } from 'src/app/models/habito.model';
import { AuthService } from 'src/app/services/auth.service';
import { HabitoService } from 'src/app/services/habito.service';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-habito-form',
  templateUrl: './habito-form.component.html',
  styleUrls: ['./habito-form.component.scss'],
  standalone: false // Si estás usando Angular con módulos, asegúrate de que este componente esté declarado en un módulo
})
export class HabitoFormComponent implements OnInit {
  @Input() habito?: Habito;

  habitoForm!: FormGroup;
  esEdicion: boolean = false;

  // --- NUEVO: Listas para los selectores visuales ---
  colores = [
    '#FF6B6B', '#FFD166', '#06D6A0', '#118AB2', '#073B4C',
    '#F78C6B', '#FF8CC6', '#8338EC', '#3A86FF', '#6A040F'
  ];
  iconos = [
    'book', 'barbell', 'leaf', 'water', 'walk', 'bed', 'heart',
    'cash', 'musical-notes', 'code-slash', 'brush', 'construct'
  ];
  // --- FIN DE LO NUEVO ---

  get modalTitle(): string {
    return this.esEdicion ? 'Editar Hábito' : 'Nuevo Hábito';
  }

  get botonGuardarTexto(): string {
    return this.esEdicion ? 'Actualizar Hábito' : 'Guardar Hábito';
  }

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private habitoService: HabitoService
  ) {}

  ngOnInit() {
    this.esEdicion = !!this.habito && !!this.habito.id;

    this.habitoForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      frecuenciaTipo: ['diaria', Validators.required],
      // Valores por defecto para los nuevos selectores visuales
      icono: [this.iconos[0]],
      color: [this.colores[0]],
      horaPreferida: [null],
    });

    if (this.esEdicion && this.habito) {
      this.habitoForm.patchValue({
        titulo: this.habito.titulo,
        descripcion: this.habito.descripcion || '',
        frecuenciaTipo: this.habito.frecuenciaTipo || 'diaria',
        icono: this.habito.icono || this.iconos[0],
        color: this.habito.color || this.colores[0],
        horaPreferida: this.habito.horaPreferida || null,
      });
    }
  }

  async cerrarModal(data?: any) {
    await this.modalCtrl.dismiss(data);
  }

  limpiarHoraPreferida() {
    this.habitoForm.get('horaPreferida')?.setValue(null);
  }

  async guardarHabito() {
    if (this.habitoForm.invalid) {
      this.presentToast('Por favor, completa los campos requeridos.', 'warning');
      this.habitoForm.markAllAsTouched();
      return;
    }

    const formValues = this.habitoForm.value;
    const currentUser = await this.authService.getCurrentUser();
    const userId = currentUser?.uid;

    if (!userId) {
      this.presentToast('Error: No se pudo identificar al usuario.', 'danger');
      return;
    }

    // La estructura de datos que se envía al servicio es la MISMA que en tu código original
    const habitoData: Partial<Habito> = {
      titulo: formValues.titulo,
      descripcion: formValues.descripcion || '',
      frecuenciaTipo: formValues.frecuenciaTipo,
      icono: formValues.icono,
      color: formValues.color,
      horaPreferida: formValues.horaPreferida || null,
    };

    try {
      this.presentToast('Guardando...', 'light', 1500);

      if (this.esEdicion && this.habito?.id) {
        await this.habitoService.actualizarHabito(userId, this.habito.id, habitoData);
        this.presentToast('Hábito actualizado exitosamente.', 'success');
        this.cerrarModal({ actualizado: true, id: this.habito.id, habito: { ...this.habito, ...habitoData } });
      } else {
        const nuevoHabitoData: Habito = {
          ...habitoData,
          fechaInicio: Timestamp.now(),
          rachaActual: 0,
          mejorRacha: 0,
          recordatoriosActivos: false,
        } as Habito;

        const docRef = await this.habitoService.agregarHabito(userId, nuevoHabitoData);
        this.presentToast('Hábito creado exitosamente.', 'success');
        this.cerrarModal({ creada: true, habito: { ...nuevoHabitoData, id: docRef.id } });
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
