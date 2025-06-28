import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WellbeingPage } from './wellbeing.page';

const routes: Routes = [
  {
    path: '',
    component: WellbeingPage
  },  {
    path: 'wellbeing-stats',
    loadChildren: () => import('./pages/wellbeing-stats/wellbeing-stats.module').then( m => m.WellbeingStatsPageModule)
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WellbeingPageRoutingModule {}
