import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WellbeingPage } from './wellbeing.page';

const routes: Routes = [
  {
    path: '',
    component: WellbeingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WellbeingPageRoutingModule {}
