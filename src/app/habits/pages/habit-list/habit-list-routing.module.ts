import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HabitsListPage } from './habit-list.page';

const routes: Routes = [
  {
    path: '',
    component: HabitsListPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HabitListPageRoutingModule {}
