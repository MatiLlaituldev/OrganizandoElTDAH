import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WellbeingStatsPage } from './wellbeing-stats.page';

describe('WellbeingStatsPage', () => {
  let component: WellbeingStatsPage;
  let fixture: ComponentFixture<WellbeingStatsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(WellbeingStatsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
