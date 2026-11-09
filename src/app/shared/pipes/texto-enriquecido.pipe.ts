import { Pipe, PipeTransform } from '@angular/core';

/**
 * HU-27: muestra el texto enriquecido de un mensaje (**negrita**, *cursiva*,
 * `monoespaciado`) de forma segura.
 *
 * El texto llega de otro usuario, asi que primero se escapa el HTML y solo despues
 * se aplican los marcados: nunca se interpreta etiqueta que venga en el mensaje.
 */
@Pipe({ name: 'textoEnriquecido', standalone: true })
export class TextoEnriquecidoPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    if (!valor) {
      return '';
    }
    return this.escapar(valor)
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/\n/g, '<br />');
  }

  private escapar(valor: string): string {
    return valor
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
