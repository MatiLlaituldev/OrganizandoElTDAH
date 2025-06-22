import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GoalDetailPageRoutingModule } from './goal-detail-routing.module';

import { GoalDetailPage } from './goal-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GoalDetailPageRoutingModule
  ],
  declarations: [GoalDetailPage]
})
export class GoalDetailPageModule {}
