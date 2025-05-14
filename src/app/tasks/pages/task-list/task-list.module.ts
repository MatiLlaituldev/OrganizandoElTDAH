import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TaskListPageRoutingModule } from './task-list-routing.module';

import { TaskListPage } from './task-list.page';
import { SharedComponentsModule } from '../../../components/shared-components/shared-components.module'; // Asegúrate de que la ruta sea correcta

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TaskListPageRoutingModule,ReactiveFormsModule,SharedComponentsModule
  ],
  declarations: [TaskListPage]
})
export class TaskListPageModule {}
