import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { RecordatoriosPageRoutingModule } from './recordatorios-routing.module';
import { RecordatoriosPage } from './recordatorios.page';

// ✅ IMPORTAR FIREBASE MODULES


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RecordatoriosPageRoutingModule,
    // ✅ AGREGAR ESTO AQUÍ
  ],
  declarations: [RecordatoriosPage]
})
export class RecordatoriosPageModule {}
