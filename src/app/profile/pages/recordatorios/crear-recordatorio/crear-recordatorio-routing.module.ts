import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CrearRecordatorioPage } from './crear-recordatorio.page';

const routes: Routes = [
  {
    path: '',
    component: CrearRecordatorioPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CrearRecordatorioPageRoutingModule {}
