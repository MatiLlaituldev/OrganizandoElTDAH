import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Habito } from 'src/app/models/habito.model';

@Component({
  selector: 'app-habito-form',
  templateUrl: './habito-form.component.html',
  styleUrls: ['./habito-form.component.scss'],
  standalone: false
})
export class HabitoFormComponent implements OnInit {
  @Input() habito?: Habito;
  form!: FormGroup;
  isEditMode = false;

  // Lista de colores predefinidos para el selector visual
  colores = [
    '#FF6B6B', '#FFD166', '#06D6A0', '#118AB2', '#073B4C',
    '#F78C6B', '#FF8CC6', '#8338EC', '#3A86FF', '#6A040F'
  ];

  // Lista de iconos predefinidos para el selector visual
  iconos = [
    'book', 'barbell', 'leaf', 'water', 'walk', 'bed', 'heart',
    'cash', 'musical-notes', 'code-slash', 'brush', 'construct'
  ];

  diasSemana = [
    { nombre: 'Lun', valor: 1 }, { nombre: 'Mar', valor: 2 },
    { nombre: 'Mié', valor: 3 }, { nombre: 'Jue', valor: 4 },
    { nombre: 'Vie', valor: 5 }, { nombre: 'Sáb', valor: 6 },
    { nombre: 'Dom', valor: 7 }
  ];

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
  ) { }

  ngOnInit() {
    this.isEditMode = !!this.habito;
    this.form = this.fb.group({
      titulo: [this.habito?.titulo || '', Validators.required],
      descripcion: [this.habito?.descripcion || ''],
      // Usamos el primer icono y color de la lista como default
      icono: [this.habito?.icono || this.iconos[0]],
      color: [this.habito?.color || this.colores[0]],
      frecuencia: [this.habito?.frecuencia || 'diaria', Validators.required],
      diasEspecificos: [this.habito?.diasEspecificos || []],
      recordatorios: this.fb.array(this.habito?.recordatorios?.map(r => this.crearRecordatorioFormGroup(r)) || [])
    });
  }

  get recordatorios() {
    return this.form.get('recordatorios') as FormArray;
  }

  crearRecordatorioFormGroup(recordatorio?: { id: string; hora: string; activo: boolean }): FormGroup {
    return this.fb.group({
      id: [recordatorio?.id || Date.now().toString()],
      hora: [recordatorio?.hora || '09:00', Validators.required],
      activo: [recordatorio?.activo ?? true]
    });
  }

  agregarRecordatorio() {
    this.recordatorios.push(this.crearRecordatorioFormGroup());
  }

  eliminarRecordatorio(index: number) {
    this.recordatorios.removeAt(index);
  }

  toggleDia(valor: number) {
    const diasSeleccionados = this.form.get('diasEspecificos')!.value as number[];
    const index = diasSeleccionados.indexOf(valor);
    if (index > -1) {
      diasSeleccionados.splice(index, 1);
    } else {
      diasSeleccionados.push(valor);
    }
    this.form.get('diasEspecificos')!.setValue(diasSeleccionados);
  }

  isDiaSeleccionado(valor: number): boolean {
    return (this.form.get('diasEspecificos')!.value as number[]).includes(valor);
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    const formValues = this.form.value;
    const habitoData: Partial<Habito> = {
      titulo: formValues.titulo,
      descripcion: formValues.descripcion,
      icono: formValues.icono,
      color: formValues.color,
      frecuencia: formValues.frecuencia,
      diasEspecificos: formValues.frecuencia === 'dias_especificos' ? formValues.diasEspecificos : [],
      recordatorios: formValues.recordatorios,
      ...(this.isEditMode && {
        conteoCompletados: this.habito!.conteoCompletados,
        rachaActual: this.habito!.rachaActual,
        mejorRacha: this.habito!.mejorRacha,
      })
    };

    this.modalCtrl.dismiss(habitoData);
  }

  onCancel() {
    this.modalCtrl.dismiss(null);
  }
}
