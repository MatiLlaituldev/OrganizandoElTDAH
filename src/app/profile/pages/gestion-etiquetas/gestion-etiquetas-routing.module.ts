import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GestionEtiquetasPage } from './gestion-etiquetas.page';

const routes: Routes = [
  {
    path: '',
    component: GestionEtiquetasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GestionEtiquetasPageRoutingModule {}
