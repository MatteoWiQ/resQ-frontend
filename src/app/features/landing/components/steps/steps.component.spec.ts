import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { LandingSteps } from './steps.component';

describe('LandingSteps', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<LandingSteps>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingSteps],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingSteps);
    fixture.detectChanges();
  });

  it('deberia crear el componente', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('deberia renderizar las 4 tarjetas de pasos, incluyendo "Ayudar"', () => {
    const tarjetas = fixture.debugElement.queryAll(By.css('.step-card'));
    expect(tarjetas.length).toBe(4);

    const textos = tarjetas.map((t) => t.nativeElement.textContent as string);
    expect(textos.some((texto) => texto.includes('Ayudar'))).toBe(true);
  });
});