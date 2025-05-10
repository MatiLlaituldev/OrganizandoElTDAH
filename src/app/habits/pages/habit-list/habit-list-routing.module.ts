import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HabitListPage } from './habit-list.page';

const routes: Routes = [
  {
    path: '',
    component: HabitListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HabitListPageRoutingModule {}
