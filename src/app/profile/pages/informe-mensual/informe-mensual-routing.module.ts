import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InformeMensualPage } from './informe-mensual.page';

const routes: Routes = [
  {
    path: '',
    component: InformeMensualPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InformeMensualPageRoutingModule {}
