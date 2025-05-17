import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { WellbeingPageRoutingModule } from './wellbeing-routing.module';

import { WellbeingPage } from './wellbeing.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    WellbeingPageRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ],
  declarations: [WellbeingPage]
})
export class WellbeingPageModule {}
