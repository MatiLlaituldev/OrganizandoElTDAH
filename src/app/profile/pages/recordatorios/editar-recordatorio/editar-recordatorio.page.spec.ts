import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditarRecordatorioPage } from './editar-recordatorio.page';

describe('EditarRecordatorioPage', () => {
  let component: EditarRecordatorioPage;
  let fixture: ComponentFixture<EditarRecordatorioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EditarRecordatorioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
