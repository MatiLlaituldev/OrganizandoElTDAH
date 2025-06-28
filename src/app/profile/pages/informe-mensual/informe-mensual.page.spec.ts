import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InformeMensualPage } from './informe-mensual.page';

describe('InformeMensualPage', () => {
  let component: InformeMensualPage;
  let fixture: ComponentFixture<InformeMensualPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InformeMensualPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
