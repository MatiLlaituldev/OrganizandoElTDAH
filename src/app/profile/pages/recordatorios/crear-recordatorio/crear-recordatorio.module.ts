import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CrearRecordatorioPageRoutingModule } from './crear-recordatorio-routing.module';

import { CrearRecordatorioPage } from './crear-recordatorio.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CrearRecordatorioPageRoutingModule
  ],
  declarations: [CrearRecordatorioPage]
})
export class CrearRecordatorioPageModule {}
