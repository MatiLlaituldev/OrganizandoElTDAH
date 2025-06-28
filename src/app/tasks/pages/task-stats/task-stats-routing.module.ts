import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TaskStatsPage } from './task-stats.page';

const routes: Routes = [
  {
    path: '',
    component: TaskStatsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TaskStatsPageRoutingModule {}
