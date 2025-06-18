import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';

import { GoalFormComponent } from './goal-form/goal-form.component';
import { HabitoFormComponent } from './habito-form/habito-form.component';
import { TaskFormComponent } from './task-form/task-form.component';
import { EtiquetaFormComponent } from './etiqueta-form/etiqueta-form.component'; // 1. IMPORTAR

@NgModule({
  declarations: [
    GoalFormComponent,
    HabitoFormComponent,
    TaskFormComponent,
    EtiquetaFormComponent // 2. AÑADIR A DECLARATIONS
  ],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule
  ],
  exports: [
    GoalFormComponent,
    HabitoFormComponent,
    TaskFormComponent,
    EtiquetaFormComponent // 3. AÑADIR A EXPORTS
  ]
})
export class SharedComponentsModule { }
