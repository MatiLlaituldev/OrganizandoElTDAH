import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GoalListPage } from './goal-list.page';

const routes: Routes = [
  {
    path: '',
    component: GoalListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GoalListPageRoutingModule {}
