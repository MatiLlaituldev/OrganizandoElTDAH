import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HabitListPage } from './habit-list.page';

describe('HabitListPage', () => {
  let component: HabitListPage;
  let fixture: ComponentFixture<HabitListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HabitListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
