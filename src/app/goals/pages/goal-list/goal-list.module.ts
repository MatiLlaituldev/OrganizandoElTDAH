import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GoalListPageRoutingModule } from './goal-list-routing.module';

import { GoalListPage } from './goal-list.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GoalListPageRoutingModule
  ],
  declarations: [GoalListPage]
})
export class GoalListPageModule {}
