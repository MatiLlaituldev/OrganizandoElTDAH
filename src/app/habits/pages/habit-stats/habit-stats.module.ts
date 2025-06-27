import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HabitStatsPageRoutingModule } from './habit-stats-routing.module';

import { HabitStatsPage } from './habit-stats.page';
import { NgApexchartsModule } from 'ng-apexcharts';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HabitStatsPageRoutingModule,
    NgApexchartsModule
  ],
  declarations: [HabitStatsPage]
})
export class HabitStatsPageModule {}
