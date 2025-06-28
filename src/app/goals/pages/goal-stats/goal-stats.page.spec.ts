import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GoalStatsPage } from './goal-stats.page';

describe('GoalStatsPage', () => {
  let component: GoalStatsPage;
  let fixture: ComponentFixture<GoalStatsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GoalStatsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
