import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { GuiaReporteComponent } from './guia-reporte.component';

describe('GuiaReporteComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuiaReporteComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('deberia crear un componente', () => {
    const fixture = TestBed.createComponent(GuiaReporteComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('debe mostrar las 4 card, incluyendo la de "Publicar"', async () => {
    const fixture = TestBed.createComponent(GuiaReporteComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const steps = compiled.querySelectorAll('.guide-step');
    expect(steps.length).toBe(4);

    const lastStep = steps[3];
    expect(lastStep.querySelector('.step-number')?.textContent?.trim()).toContain('04');
    expect(lastStep.querySelector('h2')?.textContent?.trim()).toContain('Publicar');
  });
});