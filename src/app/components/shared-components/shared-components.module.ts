import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';



import { TaskFormComponent } from './task-form/task-form.component';
import { HabitoFormComponent } from './habito-form/habito-form.component';
import { GoalFormComponent } from './goal-form/goal-form.component';

@NgModule({
  declarations: [
    TaskFormComponent,
    HabitoFormComponent,
    GoalFormComponent

  ],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,

  ],
  exports: [
    TaskFormComponent,
    HabitoFormComponent,
    GoalFormComponent

  ]
})
export class SharedComponentsModule { }

