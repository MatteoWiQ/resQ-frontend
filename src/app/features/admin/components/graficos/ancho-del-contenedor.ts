import { DestroyRef, ElementRef, Signal, afterNextRender, inject, signal } from '@angular/core';

/** Ancho que se usa hasta medir el contenedor (y en pruebas, donde no hay layout). */
export const ANCHO_POR_DEFECTO = 640;
const ANCHO_MINIMO = 260;

/**
 * HU-34: ancho real del componente, para dibujar el SVG en pixeles reales.
 *
 * Si el viewBox fuera fijo, el navegador escalaria todo el grafico: el texto de los
 * ejes se veria enorme a pantalla completa e ilegible en un celular. Midiendo el
 * contenedor, las etiquetas quedan siempre en su tamano y solo cambia el espacio
 * entre marcas. Se llama desde un inicializador de campo (contexto de inyeccion).
 */
export function anchoDelContenedor(): Signal<number> {
  const host = inject<ElementRef<HTMLElement>>(ElementRef);
  const destroyRef = inject(DestroyRef);
  const ancho = signal(ANCHO_POR_DEFECTO);

  afterNextRender(() => {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observador = new ResizeObserver(([entrada]) => {
      const medido = Math.round(entrada.contentRect.width);
      if (medido > 0) {
        ancho.set(Math.max(ANCHO_MINIMO, medido));
      }
    });
    observador.observe(host.nativeElement);
    destroyRef.onDestroy(() => observador.disconnect());
  });

  return ancho.asReadonly();
}

/** Mantiene el tooltip dentro del grafico: su centro nunca se acerca tanto al borde. */
export function posicionTooltip(x: number, ancho: number): number {
  return Math.min(80, Math.max(20, (x / ancho) * 100));
}
