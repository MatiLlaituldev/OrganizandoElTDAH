import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GoalDetailPage } from './goal-detail.page';

describe('GoalDetailPage', () => {
  let component: GoalDetailPage;
  let fixture: ComponentFixture<GoalDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GoalDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
