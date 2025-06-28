import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrearRecordatorioPage } from './crear-recordatorio.page';

describe('CrearRecordatorioPage', () => {
  let component: CrearRecordatorioPage;
  let fixture: ComponentFixture<CrearRecordatorioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CrearRecordatorioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
