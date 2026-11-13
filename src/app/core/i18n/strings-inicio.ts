/** Rediseño: textos de la página de Inicio. Se incorpora a `es` en strings.ts. */
export const inicioEs = {
  hero: {
    titulo: 'Cada reporte acerca a un animal a un lugar seguro.',
    descripcion:
      'ResQ conecta a quien encuentra un animal en riesgo con voluntarios, refugios y veterinarios de La Paz y El Alto.',
    reportar: {
      titulo: 'Encontré un animal en riesgo',
      descripcion: 'Sube una foto y marca dónde está. Toma 2 minutos.',
      accion: 'Reportar',
    },
    ayudar: {
      titulo: 'Quiero ayudar',
      descripcion: 'Mira los casos cerca de ti y ofrece transporte, hogar o alimento.',
      accion: 'Ver casos',
    },
  },
  carrusel: {
    ariaLabel: 'Últimos casos',
    anterior: 'Caso anterior',
    siguiente: 'Caso siguiente',
    posicion: 'Caso {{n}} de {{total}}',
    sinFoto: 'Caso sin foto',
    vacio: 'Por ahora no hay casos abiertos. Cuando alguien reporte uno, aparecerá aquí.',
  },
  insignias: {
    urgente: 'Urgente',
    activo: 'Activo',
  },
  tiempo: {
    ahora: 'hace un momento',
    minutos: 'hace {{n}} min',
    horas: 'hace {{n}} h',
    dias: 'hace {{n}} d',
  },
  urgentes: {
    titulo: 'Casos que necesitan ayuda ahora',
    subtitulo: 'Primero los que nadie tomó todavía, del más reciente al más antiguo.',
    verTodos: 'Ver todos los casos',
  },
  historia: {
    titulo: 'Así se resuelve un caso en ResQ',
    subtitulo: 'De un reporte en la calle a un lugar seguro, paso a paso.',
    paso1: {
      hora: '9:12',
      titulo: 'Alguien lo encuentra y lo reporta',
      descripcion: 'Sube una foto y marca la esquina exacta en el mapa.',
    },
    paso2: {
      hora: '9:30',
      titulo: 'Un refugio de la zona toma el caso',
      descripcion: 'Los voluntarios cercanos reciben la alerta.',
    },
    paso3: {
      hora: '11:05',
      titulo: 'Un voluntario lo lleva al veterinario',
      descripcion: 'El caso se actualiza con cada novedad.',
    },
    paso4: {
      hora: 'Día 3',
      titulo: 'Está a salvo en un hogar temporal',
      descripcion: 'Ahora busca una familia para adopción.',
    },
  },
  ayudar: {
    titulo: 'Ayuda con lo que tengas',
    subtitulo: 'No necesitas ser rescatista. Cada caso dice qué le falta.',
    verCasos: 'Ver casos',
    transporte: { titulo: 'Transporte', descripcion: 'Lleva un animal a la clínica o al refugio.' },
    hogar: { titulo: 'Hogar temporal', descripcion: 'Ofrece un espacio seguro hasta que lo adopten.' },
    alimento: { titulo: 'Alimento e insumos', descripcion: 'Dona comida, mantas o medicamentos.' },
    rescate: { titulo: 'Rescate en terreno', descripcion: 'Coordina intervenciones en emergencias.' },
  },
  organizaciones: {
    titulo: 'Refugios y organizaciones en la red',
    subtitulo: 'Reciben alertas de su zona y gestionan sus casos desde un panel.',
    unete: '¿Eres una organización? Únete',
    logoAlt: 'Logo de {{nombre}}',
  },
  pie: {
    ariaLabel: 'Enlaces del pie de página',
    comoAyudar: 'Cómo ayudar',
    organizaciones: 'Organizaciones',
    guia: 'Guía para reportar',
    lema: 'Red de rescate animal de La Paz y El Alto.',
  },
};
