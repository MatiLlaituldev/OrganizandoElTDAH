import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditarRecordatorioPage } from './editar-recordatorio.page';

const routes: Routes = [
  {
    path: '',
    component: EditarRecordatorioPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditarRecordatorioPageRoutingModule {}
