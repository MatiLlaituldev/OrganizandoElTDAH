import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GestionEtiquetasPageRoutingModule } from './gestion-etiquetas-routing.module';

import { GestionEtiquetasPage } from './gestion-etiquetas.page';
import { SharedComponentsModule } from 'src/app/components/shared-components/shared-components.module'; // 1. IMPORTAR

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GestionEtiquetasPageRoutingModule,
    ReactiveFormsModule,
    SharedComponentsModule // 2. AÑADIR A IMPORTS
  ],
  declarations: [GestionEtiquetasPage]
})
export class GestionEtiquetasPageModule {}
