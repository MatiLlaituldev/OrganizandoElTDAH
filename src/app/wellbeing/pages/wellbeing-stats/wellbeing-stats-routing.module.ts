import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WellbeingStatsPage } from './wellbeing-stats.page';

const routes: Routes = [
  {
    path: '',
    component: WellbeingStatsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WellbeingStatsPageRoutingModule {}
