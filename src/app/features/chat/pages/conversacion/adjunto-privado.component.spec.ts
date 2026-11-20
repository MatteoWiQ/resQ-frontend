import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdjuntoPrivadoComponent } from './adjunto-privado.component';
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.restoreAllMocks(); TestBed.resetTestingModule(); });
function setup(ruta: string) {
  TestBed.configureTestingModule({ imports: [AdjuntoPrivadoComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
  const fixture = TestBed.createComponent(AdjuntoPrivadoComponent);
  fixture.componentRef.setInput('ruta', ruta);
  fixture.detectChanges();
  return { fixture, http: TestBed.inject(HttpTestingController) };
}
it('descarga mediante HttpClient y libera el blob al salir', () => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:adjunto');
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  const { fixture, http } = setup('/api/conversaciones/adjuntos/test.pdf');
  const req = http.expectOne('/api/conversaciones/adjuntos/test.pdf');
  expect(req.request.responseType).toBe('blob');
  req.flush(new Blob(['test']));
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('blob:adjunto');
  fixture.destroy();
  expect(revoke).toHaveBeenCalledWith('blob:adjunto');
  http.verify();
});
it('rechaza URLs externas sin solicitar el archivo', () => {
  const { fixture, http } = setup('https://example.com/file');
  expect(fixture.componentInstance.error()).toBe(true);
  http.expectNone(() => true);
});
it('muestra el error de acceso sin crear enlace de descarga', () => {
  const { fixture, http } = setup('/api/conversaciones/adjuntos/test.pdf');
  http.expectOne('/api/conversaciones/adjuntos/test.pdf').flush(null, { status: 404, statusText: 'Not Found' });
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('a')).toBeNull();
  expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
});
