import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { Etiqueta } from '../../../models/etiqueta.model';
import { EtiquetaService } from '../../../services/etiqueta.service';

@Component({
  selector: 'app-etiqueta-form',
  templateUrl: './etiqueta-form.component.html',
  styleUrls: ['./etiqueta-form.component.scss'],
  standalone: false
})
export class EtiquetaFormComponent implements OnInit {

  @Input() etiqueta?: Etiqueta;
  form: FormGroup;
  esEdicion = false;

  // Lista de colores predefinidos para que el usuario elija
  colores = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF',
    '#33FFA1', '#FFC300', '#C70039', '#900C3F', '#581845'
  ];

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private etiquetaService: EtiquetaService
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      color: [this.colores[0], Validators.required] // Color por defecto
    });
  }

  ngOnInit() {
    if (this.etiqueta) {
      this.esEdicion = true;
      this.form.patchValue(this.etiqueta);
    }
  }

  seleccionarColor(color: string) {
    this.form.get('color')?.setValue(color);
  }

  async guardar() {
    if (this.form.invalid) {
      this.presentToast('Por favor, completa todos los campos.', 'warning');
      return;
    }

    const { nombre, color } = this.form.value;

    try {
      if (this.esEdicion && this.etiqueta?.id) {
        // Actualizar etiqueta existente
        await this.etiquetaService.updateEtiqueta(this.etiqueta.id, { nombre, color });
        this.presentToast('Etiqueta actualizada con éxito.', 'success');
      } else {
        // Crear nueva etiqueta
        await this.etiquetaService.addEtiqueta(nombre, color);
        this.presentToast('Etiqueta creada con éxito.', 'success');
      }
      this.cerrar(true); // Cierra el modal y avisa que hubo cambios
    } catch (error) {
      console.error('Error al guardar la etiqueta:', error);
      this.presentToast('Ocurrió un error al guardar.', 'danger');
    }
  }

  cerrar(huboCambios = false) {
    this.modalCtrl.dismiss({ huboCambios });
  }

  async presentToast(mensaje: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom',
      color: color,
    });
    toast.present();
  }
}
