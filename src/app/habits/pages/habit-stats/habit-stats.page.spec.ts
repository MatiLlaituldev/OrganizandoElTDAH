import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HabitStatsPage } from './habit-stats.page';

describe('HabitStatsPage', () => {
  let component: HabitStatsPage;
  let fixture: ComponentFixture<HabitStatsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HabitStatsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
