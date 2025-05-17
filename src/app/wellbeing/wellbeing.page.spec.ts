import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WellbeingPage } from './wellbeing.page';

describe('WellbeingPage', () => {
  let component: WellbeingPage;
  let fixture: ComponentFixture<WellbeingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(WellbeingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
