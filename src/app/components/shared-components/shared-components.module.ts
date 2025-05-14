import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';



import { TaskFormComponent } from './task-form/task-form.component';
import { HabitoFormComponent } from './habito-form/habito-form.component';

@NgModule({
  declarations: [
    TaskFormComponent,
    HabitoFormComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule
  ],
  exports: [
    TaskFormComponent,
    HabitoFormComponent

  ]
})
export class SharedComponentsModule { }

