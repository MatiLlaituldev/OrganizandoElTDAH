import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TaskStatsPageRoutingModule } from './task-stats-routing.module';

import { TaskStatsPage } from './task-stats.page';
import { NgApexchartsModule } from 'ng-apexcharts';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TaskStatsPageRoutingModule,
    NgApexchartsModule
  ],
  declarations: [TaskStatsPage]
})
export class TaskStatsPageModule {}
