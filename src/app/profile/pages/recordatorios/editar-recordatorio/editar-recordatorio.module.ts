import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditarRecordatorioPageRoutingModule } from './editar-recordatorio-routing.module';

import { EditarRecordatorioPage } from './editar-recordatorio.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditarRecordatorioPageRoutingModule
  ],
  declarations: [EditarRecordatorioPage]
})
export class EditarRecordatorioPageModule {}
