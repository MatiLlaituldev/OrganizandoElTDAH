import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FeedbackPageRoutingModule } from './feedback-routing.module';

import { FeedbackPage } from './feedback.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    FeedbackPageRoutingModule
  ],
  declarations: [FeedbackPage]
})
export class FeedbackPageModule {}
