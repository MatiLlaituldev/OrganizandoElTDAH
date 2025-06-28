import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InformeMensualPageRoutingModule } from './informe-mensual-routing.module';

import { InformeMensualPage } from './informe-mensual.page';
import { NgApexchartsModule } from 'ng-apexcharts'; // <-- Agrega esta línea

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InformeMensualPageRoutingModule,
    NgApexchartsModule // <-- Y esta línea
  ],
  declarations: [InformeMensualPage]
})
export class InformeMensualPageModule {}
