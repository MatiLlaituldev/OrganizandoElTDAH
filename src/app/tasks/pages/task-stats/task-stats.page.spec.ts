import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskStatsPage } from './task-stats.page';

describe('TaskStatsPage', () => {
  let component: TaskStatsPage;
  let fixture: ComponentFixture<TaskStatsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskStatsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
