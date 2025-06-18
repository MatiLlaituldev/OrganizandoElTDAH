import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionEtiquetasPage } from './gestion-etiquetas.page';

describe('GestionEtiquetasPage', () => {
  let component: GestionEtiquetasPage;
  let fixture: ComponentFixture<GestionEtiquetasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GestionEtiquetasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
