import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { WellbeingStatsPageRoutingModule } from './wellbeing-stats-routing.module';

import { WellbeingStatsPage } from './wellbeing-stats.page';
import { NgApexchartsModule } from 'ng-apexcharts'; // Asegúrate de instalar ng-apexcharts si usas gráficos

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    WellbeingStatsPageRoutingModule,
    // Asegúrate de importar NgApexchartsModule si usas gráficos
   NgApexchartsModule
  ],
  declarations: [WellbeingStatsPage]
})
export class WellbeingStatsPageModule {}
