/** HU-34: una serie de un grafico; `valores[i]` corresponde a la categoria o tramo i. */
export interface SerieGrafico {
  nombre: string;
  /** Nombre para el tooltip, donde no entra el nombre completo de la leyenda. */
  nombreCorto?: string;
  valores: number[];
  /**
   * Etiqueta propia de cada punto para el tooltip. Al superponer dos periodos alineados
   * por tramo, el eje muestra las fechas del primero y cada serie aclara las suyas.
   */
  etiquetas?: string[];
}

/** Lo que muestra el tooltip al pasar sobre una categoria o un tramo. */
export interface DetalleHover {
  indice: number;
  /** Posicion horizontal del tooltip, en % del ancho del grafico. */
  izquierda: number;
}
