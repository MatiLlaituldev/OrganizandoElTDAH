import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GoalDetailPage } from './goal-detail.page';

const routes: Routes = [
  {
    path: '',
    component: GoalDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GoalDetailPageRoutingModule {}
