import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GoalListPage } from './goal-list.page';

describe('GoalListPage', () => {
  let component: GoalListPage;
  let fixture: ComponentFixture<GoalListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GoalListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
