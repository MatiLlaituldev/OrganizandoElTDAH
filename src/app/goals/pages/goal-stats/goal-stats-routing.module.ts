import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GoalStatsPage } from './goal-stats.page';

const routes: Routes = [
  {
    path: '',
    component: GoalStatsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GoalStatsPageRoutingModule {}
