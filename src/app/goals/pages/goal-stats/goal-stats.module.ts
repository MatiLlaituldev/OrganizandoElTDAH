import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GoalStatsPageRoutingModule } from './goal-stats-routing.module';

import { GoalStatsPage } from './goal-stats.page';
import { NgApexchartsModule } from 'ng-apexcharts';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgApexchartsModule,
    IonicModule,
    GoalStatsPageRoutingModule
  ],
  declarations: [GoalStatsPage]
})
export class GoalStatsPageModule {}
