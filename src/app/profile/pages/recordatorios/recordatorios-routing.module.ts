import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RecordatoriosPage } from './recordatorios.page';

const routes: Routes = [
  {
    path: '',
    component: RecordatoriosPage
  },
  {
    path: 'crear',
    loadChildren: () => import('./crear-recordatorio/crear-recordatorio.module').then(m => m.CrearRecordatorioPageModule)
  },
  {
    path: 'editar/:id',
    loadChildren: () => import('./editar-recordatorio/editar-recordatorio.module').then(m => m.EditarRecordatorioPageModule)
  },  {
    path: 'crear-recordatorio',
    loadChildren: () => import('./crear-recordatorio/crear-recordatorio.module').then( m => m.CrearRecordatorioPageModule)
  },
  {
    path: 'editar-recordatorio',
    loadChildren: () => import('./editar-recordatorio/editar-recordatorio.module').then( m => m.EditarRecordatorioPageModule)
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecordatoriosPageRoutingModule {}
