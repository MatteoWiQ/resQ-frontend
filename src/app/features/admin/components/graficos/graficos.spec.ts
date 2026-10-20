import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';

import { GraficoBarrasComponent } from './grafico-barras.component';
import { GraficoEvolucionComponent } from './grafico-evolucion.component';
import { SerieGrafico } from './grafico.model';

async function crear<T>(componente: Type<T>, entradas: Record<string, unknown>) {
  await TestBed.configureTestingModule({ imports: [componente] }).compileComponents();
  const fixture = TestBed.createComponent(componente);
  for (const [nombre, valor] of Object.entries(entradas)) {
    fixture.componentRef.setInput(nombre, valor);
  }
  fixture.detectChanges();
  return fixture;
}

const DOS_PERIODOS: SerieGrafico[] = [
  { nombre: 'Período A', valores: [5, 3, 0, 1] },
  { nombre: 'Período B', valores: [2, 4, 1, 0] },
];

describe('graficos de metricas (HU-34)', () => {
  describe('GraficoBarrasComponent', () => {
    const entradas = {
      titulo: 'Comparación de períodos',
      categorias: ['Registrados', 'Activos', 'Nuevos voluntarios', 'Nuevas organizaciones'],
      series: DOS_PERIODOS,
    };

    it('dibuja una barra por valor mayor a cero y una leyenda por serie', async () => {
      const fixture = await crear(GraficoBarrasComponent, entradas);
      const raiz = fixture.nativeElement as HTMLElement;

      expect(raiz.querySelectorAll('svg path')).toHaveLength(6);
      expect(raiz.querySelectorAll('.leyenda li')).toHaveLength(2);
      expect(raiz.querySelector('svg')?.getAttribute('aria-label')).toBe('Comparación de períodos');
    });

    it('al pasar el mouse por una categoria muestra los valores de cada serie', async () => {
      const fixture = await crear(GraficoBarrasComponent, entradas);
      const raiz = fixture.nativeElement as HTMLElement;

      raiz.querySelectorAll('rect.objetivo')[1].dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      const tooltip = raiz.querySelector('.tooltip')!;
      expect(tooltip.textContent).toContain('Activos');
      expect(Array.from(tooltip.querySelectorAll('.valor')).map((v) => v.textContent?.trim())).toEqual([
        '3',
        '4',
      ]);
    });

    it('ofrece los mismos datos en una tabla', async () => {
      const fixture = await crear(GraficoBarrasComponent, entradas);

      const filas = (fixture.nativeElement as HTMLElement).querySelectorAll('details tbody tr');
      expect(filas).toHaveLength(4);
      expect(filas[0].textContent).toContain('Registrados');
    });
  });

  describe('GraficoEvolucionComponent', () => {
    it('dibuja una linea por serie y no etiqueta mas tramos de los que entran en el eje X', async () => {
      const etiquetas = Array.from({ length: 30 }, (_, i) => `${i + 1}/10`);
      const fixture = await crear(GraficoEvolucionComponent, {
        titulo: 'Usuarios registrados, por día',
        etiquetas,
        series: [
          { nombre: 'Período A', valores: etiquetas.map((_, i) => i) },
          { nombre: 'Período B', valores: etiquetas.map(() => 2) },
        ],
      });
      const raiz = fixture.nativeElement as HTMLElement;

      expect(raiz.querySelectorAll('svg path')).toHaveLength(2);
      // Sin layout (jsdom) el grafico usa el ancho por defecto: 640 - margenes = 588 px,
      // a 64 px por etiqueta entran 9 de las 30.
      const visibles = fixture.componentInstance.etiquetasVisibles();
      expect(visibles.length).toBeLessThanOrEqual(9);
      expect(visibles[0]).toBe(0);
    });

    it('con un solo tramo marca el punto, porque no hay linea que dibujar', async () => {
      const fixture = await crear(GraficoEvolucionComponent, {
        titulo: 'Usuarios activos, por día',
        etiquetas: ['01/10'],
        series: [{ nombre: 'Período A', valores: [3] }],
      });

      expect((fixture.nativeElement as HTMLElement).querySelectorAll('svg circle')).toHaveLength(1);
    });

    it('si una serie es mas corta, el tramo que le falta se muestra con un guion', async () => {
      const fixture = await crear(GraficoEvolucionComponent, {
        titulo: 'Usuarios registrados, por día',
        etiquetas: ['01/10', '02/10', '03/10'],
        series: [
          { nombre: 'Período A', valores: [1, 2, 3] },
          { nombre: 'Período B', valores: [4, 5], etiquetas: ['29/09', '30/09'] },
        ],
      });

      const ultimaFila = (fixture.nativeElement as HTMLElement).querySelectorAll('details tbody tr')[2];
      expect(ultimaFila.textContent).toContain('—');
    });
  });
});
