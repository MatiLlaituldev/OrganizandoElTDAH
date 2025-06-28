import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HabitStatsPage } from './habit-stats.page';

const routes: Routes = [
  {
    path: '',
    component: HabitStatsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HabitStatsPageRoutingModule {}
