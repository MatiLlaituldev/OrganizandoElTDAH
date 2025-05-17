import { TestBed } from '@angular/core/testing';

import { EstadoAnimoService } from './estado-animo.service';

describe('EstadoAnimoService', () => {
  let service: EstadoAnimoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EstadoAnimoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
