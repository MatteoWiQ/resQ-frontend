import { organizacionesEs } from './strings-organizaciones';
import { gestionCasosEs } from './strings-gestionar-casos';
import { metricasEs } from './strings-metricas';
import { organizacionesEn } from './strings-organizaciones-en';
import { gestionCasosEn } from './strings-gestionar-casos-en';
import { metricasEn } from './strings-metricas-en';
import { chatCasoEs } from './strings-chat-caso';
import { chatCasoEn } from './strings-chat-caso-en';

export const es = {
  // HU-20: registro de organizaciones (textos en strings-organizaciones.ts)
  organizaciones: organizacionesEs,
  gestionCasos: gestionCasosEs,
  // HU-34: métricas de la comunidad (textos en strings-metricas.ts)
  metricas: metricasEs,
  // HU-22: chat en vivo del caso (textos en strings-chat-caso.ts)
  chatCaso: chatCasoEs,
  shared: {
    brand: {
      marca: 'R',
      nombre: 'ResQ',
    },
    volverAtras: 'Volver atrás',
    abrirMenu: 'Abrir menú',
    cerrarMenu: 'Cerrar menú',
    ubicacionSeleccionada: 'Ubicación seleccionada',
    estados: {
      PENDIENTE: 'Pendiente',
      EN_PROCESO: 'En proceso',
      RESUELTO: 'Resuelto',
      CANCELADO: 'Cancelado',
    },
    // HU-19: resultado de la revisión del caso por un voluntario. Vive en el
    // catalogo compartido (y no en perfil) porque tambien lo muestra el detalle
    // del caso en el panel administrativo.
    estadosRevision: {
      PENDIENTE_REVISION: 'En revisión',
      APROBADO: 'Aprobado',
      RECHAZADO: 'Rechazado',
    },
    roles: {
      USUARIO: 'Usuario',
      VOLUNTARIO: 'Voluntario',
      ADMIN: 'Administrador',
    },
    tiposCaso: {
      PERDIDA: 'Perdida',
      ENCONTRADA: 'Encontrada',
      ABANDONADA: 'Abandonada',
    },
  },
  landing: {
    topbar: {
      ariaLabel: 'Navegación principal',
      inicio: 'Inicio',
      mapa: 'Mapa',
      casos: 'Casos',
      ayudar: 'Ayudar',
      guia: 'Guía para reportar',
      perfil: 'Mi Perfil',
      panelAdmin: 'Panel administrativo',
      reportar: 'Reportar',
    },
    // HU-logout: cabecera compartida (landing/perfil/panel).
    header: {
      cerrarSesion: 'Cerrar sesión',
      notificaciones: 'Notificaciones',
    },
    mapa: {
      eyebrow: 'Visualización geográfica',
      titulo: 'Mapa de casos',
      subtitulo: 'Explora la ubicación de los animales reportados en tu zona',
      casosUbicados: 'Casos ubicados',
      totalCasos: 'Total de casos',
      leyenda: 'Estados',
      cargando: 'Cargando casos...',
      errorCargar: 'Error al cargar los casos: {{detalle}}',
      reintentar: 'Reintentar',
      sinCasos: 'No hay casos con ubicación registrada todavía.',
      sinCasosFiltrado: 'No hay casos con esos estados.',
      filtrandoPor: 'Mostrando:',
      detalleCaso: 'Detalle del caso',
      tipoCaso: 'Tipo de caso',
      estado: 'Estado',
      descripcion: 'Descripción',
      fechaCreacion: 'Fecha de creación',
      ubicacion: 'Ubicación',
      fotoAlt: 'Foto del reporte',
      marcadorTexto: 'Reporte {{id}}, {{estado}}',
      cerrar: 'Cerrar',
      cerrarDetalle: 'Cerrar detalle del caso',
    },
    hero: {
      eyebrow: 'Red de rescate animal',
      tituloAntes: 'Conectamos ',
      tituloAccento: 'alivio',
      tituloDespues: ' con acción.',
      descripcion:
        'Ayudamos a localizar, rescatar y cuidar animales en situación de riesgo, conectando personas, refugios y voluntarios en una sola red.',
      acciones: {
        ayudar: 'Quiero ayudar',
        verCasos: 'Ver casos',
      },
      estadisticas: {
        ariaLabel: 'Estadísticas de la comunidad',
        rescatados: 'Rescatados',
        voluntarios: 'Voluntarios',
        casosSemana: 'Casos esta semana',
      },
      imagenAriaLabel: 'Imagen de rescate animal',
    },
    steps: {
      eyebrow: 'Cómo funciona',
      titulo: 'Un proceso simple y urgente',
      paso1: {
        titulo: 'Reportar',
        descripcion: 'Sube la foto, describe la situación y ubica al animal en riesgo.',
      },
      paso2: {
        titulo: 'Localizar',
        descripcion: 'La comunidad y los refugios reciben la alerta para coordinar ayuda.',
      },
      paso3: {
        titulo: 'Conectar',
        descripcion: 'Voluntarios, transportistas y veterinarios se unen para resolverlo.',
      },
    },
    help: {
      eyebrow: 'Ofrecer ayuda',
      titulo: 'Hay muchas formas de colaborar',
      transporte: {
        titulo: 'Transporte',
        descripcion: 'Acude a recoger animales y llevarlos a clínica o refugios.',
      },
      hogarTemporal: {
        titulo: 'Hogar temporal',
        descripcion: 'Ofrece un espacio seguro mientras se resuelve su adopción.',
      },
      alimento: {
        titulo: 'Alimento',
        descripcion: 'Apoya con donaciones o entrega de insumos básicos para animales.',
      },
      rescate: {
        titulo: 'Rescate',
        descripcion: 'Coordina intervenciones y apoyo en emergencias inmediatas.',
      },
    },
    guia: {
      eyebrow: 'Guía para reportar',
      titulo: 'Haz un reporte claro y útil',
      descripcion:
        'Sigue estos pasos para compartir la información que ayudará a encontrar o proteger a una mascota.',
      pasosAriaLabel: 'Pasos para crear un reporte',
      paso1: {
        titulo: 'Elige el tipo de reporte',
        descripcion:
          'Indica si la mascota está perdida, fue encontrada o necesita ayuda por abandono. Esto permite que el caso llegue a las personas correctas.',
      },
      paso2: {
        titulo: 'Cuenta los detalles del caso',
        descripcion:
          'Describe dónde y cuándo ocurrió, además de su raza, color, nombre y cualquier seña particular. También puedes agregar una URL con una foto.',
      },
      paso3: {
        titulo: 'Revisa y envía',
        descripcion:
          'Comprueba que la información sea correcta y envía el reporte. Necesitas iniciar sesión para registrar el caso en tu perfil.',
      },
      paso4: {
        titulo: 'Publicar',
      },
      accion: {
        kicker: '¿Listo para ayudar?',
        titulo: 'Comienza tu reporte',
        boton: 'Hacer un reporte',
      },
    },
  },
  auth: {
    login: {
      titulo: 'Iniciar sesión',
      correo: 'Correo electrónico',
      correoPlaceholder: 'Tu correo electrónico',
      password: 'Contraseña',
      passwordPlaceholder: 'Tu contraseña',
      boton: 'Iniciar sesión',
      noCuenta: '¿No tienes una cuenta?',
      registrate: 'Regístrate aquí',
      errorCredenciales: 'Credenciales incorrectas. Verifica tu correo y contraseña.',
      errorDb: 'No se pudo conectar con la base de datos. Inténtalo de nuevo más tarde.',
    },
    register: {
      titulo: 'Crear cuenta',
      subtitle: 'Regístrate en ResQ',
      nombre: 'Nombre',
      nombrePlaceholder: 'Tu nombre',
      correo: 'Correo electrónico',
      correoPlaceholder: 'Tu correo electrónico',
      password: 'Contraseña',
      passwordPlaceholder: 'Tu contraseña',
      passwordError: 'La contraseña debe tener al menos 8 caracteres.',
      telefono: 'Teléfono',
      telefonoPlaceholder: 'Tu teléfono',
      telefonoError: 'El teléfono es obligatorio.',
      rol: 'Rol',
      seleccionarRol: 'Selecciona un rol',
      rolUsuario: 'Usuario',
      rolVoluntario: 'Voluntario',
      boton: 'Registrarse',
      ok: 'Usuario registrado correctamente',
      errorDb: 'No se pudo conectar con la base de datos. Inténtalo de nuevo más tarde.',
      errorEmailRegistrado: 'Ese correo ya tiene una cuenta. Inicia sesión o usa otro correo.',
      errorDatosInvalidos: 'Revisa los datos: hay campos incompletos o con formato inválido.',
      yaTienesCuenta: '¿Ya tienes una cuenta?',
      iniciaSesion: 'Inicia sesión',
    },
  },
  perfil: {
    configuracion: {
      titulo: 'Configuración',
      descripcion: 'Ajusta tus preferencias de idioma y apariencia',
    },
    cargandoPerfil: 'Cargando tu perfil...',
    correo: 'Correo',
    telefono: 'Teléfono',
    noRegistrado: 'No registrado',
    sinSesion: 'No hay una sesión activa.',
    errorCargarPerfil: 'No se pudo cargar tu información de perfil.',
    misReportes: 'Mis reportes',
    crearNuevoReporte: 'Crear nuevo reporte',
    cargandoReportes: 'Cargando reportes...',
    sinReportes: 'Todavía no has hecho ningún reporte.',
    ver: 'Ver',
    panelAdmin: 'Panel administrativo',
    revisarSolicitudes: 'Revisar solicitudes',
    mensajeSolicitud: 'Tu solicitud fue enviada y está pendiente de revisión por el administrador.',

    revision: {
      titulo: 'Revisión',
      nota: 'Nota del voluntario',
    },
    modal: {
      cerrarAria: 'Cerrar',
      id: 'ID',
      estado: 'Estado',
      descripcion: 'Descripción',
      fechaCreacion: 'Fecha de creación',
      fotoAlt: 'Foto del reporte',
      cerrarBoton: 'Cerrar',
      etiquetaEstado: 'Actualizar estado del informe',
      actualizarEstado: 'Actualizar estado',
      guardando: 'Guardando...',
    },
    estado: {
      errorDistinto: 'Selecciona un estado diferente al actual.',
      errorBase: '❌ No se pudo actualizar el estado. ',
      sinPermisos: 'No tienes permisos para realizar esta acción.',
      reintentar: 'Inténtalo de nuevo.',
      ok: '✅ Estado actualizado correctamente.',
    },
  },
  reportes: {
    filtros: {
      titulo: 'Filtrar casos por estado',
      TODOS: 'Todos',
      URGENTES: 'Urgentes',
      ACTIVOS: 'Activos',
      RESUELTOS: 'Resueltos',
      CANCELADOS: 'Cancelados',
    },
    nuevo: {
      titulo: 'Crear nuevo reporte',
      subtitle: 'Ayúdanos a registrar el caso de una mascota.',
      paso1: 'Tipo de reporte',
      paso2: 'Detalles',
      continuar: 'Continuar',
      tipoElegido: 'Tipo de reporte: ',
      descripcion: 'Descripción',
      descripcionPlaceholder:
        'Describe el caso: raza, color, nombres, lugar y hora, señas particulares...',
      foto: 'Fotografía (opcional)',
      fotoAyuda: 'Formatos permitidos: JPG, PNG o WEBP. Tamaño máximo: 5 MB.',
      fotoSeleccionar: 'Seleccionar fotografía',
      fotoCambiar: 'Cambiar fotografía',
      fotoQuitar: 'Quitar fotografía',
      fotoVistaPreviaAlt: 'Vista previa de la fotografía seleccionada',
      fotoErrorFormato: 'Formato no permitido. Usa una imagen JPG, PNG o WEBP.',
      fotoErrorTamano: 'La fotografía supera el tamaño máximo permitido de 5 MB.',
      fotoErrorSubir: 'No se pudo subir la fotografía. Inténtalo de nuevo.',
      ubicacion: 'Ubicación (opcional)',
      ubicacionAyuda: 'Haz clic en el mapa para marcar dónde se encuentra el animal.',
      ubicacionActual: 'Usar mi ubicación actual',
      ubicacionObteniendo: 'Obteniendo tu ubicación...',
      ubicacionQuitar: 'Quitar ubicación',
      ubicacionError: {
        NO_SOPORTADA:
          'Este dispositivo no permite obtener la ubicación. Marca el punto en el mapa.',
        CONTEXTO_SEGURO:
          'Para obtener tu ubicación hace falta una conexión segura (https). Marca el punto en el mapa.',
        PERMISO_DENEGADO: 'No diste permiso para usar tu ubicación. Marca el punto en el mapa.',
        POSICION_NO_DISPONIBLE:
          'No se pudo determinar tu ubicación. Inténtalo de nuevo o marca el punto en el mapa.',
        TIEMPO_AGOTADO:
          'Tu ubicación tardó demasiado en obtenerse. Inténtalo de nuevo o marca el punto en el mapa.',
        ERROR_DESCONOCIDO:
          'No se pudo obtener tu ubicación. Inténtalo de nuevo o marca el punto en el mapa.',
      },
      atras: 'Atrás',
      creando: 'Creando...',
      crear: 'Crear reporte',
      seleccionaTipo: 'Selecciona un tipo de reporte.',
      sinSesion: 'No hay una sesión activa. Vuelve a iniciar sesión.',
      descripcionObligatoria: 'La descripción es obligatoria.',
      errorCrear: 'No se pudo crear el reporte. Inténtalo de nuevo.',
    },
  },
  voluntario: {
    boton: 'Quiero ser voluntario',
    botonEditar: 'Editar tipos de ayuda',
    modalTituloRegistro: 'Quiero ser voluntario',
    modalTituloEditar: 'Editar tipos de ayuda',
    modalSubtitulo: 'Selecciona el tipo de ayuda que puedes ofrecer:',
    confirmar: 'Confirmar',
    enviando: 'Enviando...',
    errorSeleccion: 'Selecciona al menos un tipo de ayuda.',
    errorGenerico: 'Ocurrió un error. Inténtalo de nuevo.',
    errorSolicitudDuplicada: 'No puedes enviar una nueva solicitud todavía',

    tipos: {
      TRANSPORTE: 'Transporte',
      HOGAR_TEMPORAL: 'Hogar temporal',
      ALIMENTO: 'Alimento',
      RESCATE: 'Rescate',
    },
      tiposAyuda: {
        transporte: 'Transport',
        hogarTemporal: 'Temporary home',
        alimento: 'Food',
        rescate: 'Rescue',
      },
  },
  // ============ HU-19: aceptar o rechazar solicitudes ============
  solicitudes: {
    titulo: 'Solicitudes pendientes',
    subtitulo: 'Valida la información de los casos reportados por los usuarios.',
    sinPermisos: 'No tienes permisos para ver esta sección.',
    cargando: 'Cargando solicitudes...',
    vacio: 'No hay solicitudes pendientes por revisar.',
    errorCargar: '❌ No se pudieron cargar las solicitudes.',
    reporteNumero: 'Reporte #{{id}}',
    revisar: 'Revisar',
    modalTitulo: 'Revisar solicitud #{{id}}',
    cerrarAria: 'Cerrar',
    tipoCaso: 'Tipo de caso',
    descripcion: 'Descripción',
    fecha: 'Fecha del reporte',
    ubicacion: 'Ubicación',
    sinUbicacion: 'Sin ubicación',
    fotoAlt: 'Foto del reporte',
    nota: 'Nota para el usuario',
    notaAyuda: 'Obligatoria al rechazar, opcional al aprobar.',
    notaPlaceholder: 'Explica brevemente tu decisión...',
    aprobar: 'Aprobar',
    rechazar: 'Rechazar',
    enviando: 'Enviando...',
    notaObligatoria: 'Debes indicar el motivo del rechazo.',
    aprobada: '✅ Solicitud #{{id}} aprobada. Se notificó al usuario.',
    rechazada: '✅ Solicitud #{{id}} rechazada. Se notificó al usuario.',
    errorDecidir: '❌ No se pudo registrar la decisión. Inténtalo de nuevo.',
    errorSinPermiso: '❌ No tienes permisos para revisar solicitudes.',
    errorYaRevisada: '❌ Esta solicitud ya fue revisada. Se actualizó la lista.',
  },
  notificaciones: {
    titulo: 'Notificaciones',
    cargando: 'Cargando notificaciones...',
    vacio: 'No tienes notificaciones.',
    errorCargar: 'No se pudieron cargar tus notificaciones.',
    errorAccion: 'No se pudo actualizar la notificación.',
    sinLeer: '{{n}} sin leer',
    marcarLeida: 'Marcar como leída',
    marcarNoLeida: 'Marcar como no leída',
    archivar: 'Archivar',
    abrir: 'Abrir notificación',
  },
  // HU-27: mensajes entre usuarios.
  mensajes: {
    bandejaTitulo: 'Mensajes',
    nuevaConversacion: 'Nueva conversación',
    buscar: 'Buscar',
    buscarOrganizacion: 'Buscar organización por nombre',
    organizacion: 'Organización',
    iniciar: 'Escribir',
    iniciarCon: 'Iniciar conversación con {{nombre}}',
    sinOrganizaciones: 'No se encontraron organizaciones.',
    sinConversaciones: 'Todavía no tienes conversaciones.',
    sinMensajes: 'Todavía no hay mensajes en esta conversación.',
    sinSesion: 'Inicia sesión para usar los mensajes.',
    conversacion: 'Conversación',
    contador: '{{n}}/{{max}} caracteres',
    cargando: 'Cargando...',
    yo: 'Tú',
    escribir: 'Escribe un mensaje...',
    vacio: 'Escribe un mensaje o adjunta un archivo.',
    adjuntar: 'Adjuntar imagen o archivo',
    quitarAdjunto: 'Quitar adjunto',
    archivo: 'Archivo adjunto',
    eliminar: 'Eliminar',
    eliminado: 'Mensaje eliminado',
    enviar: 'Enviar',
    enviando: 'Enviando...',
    errorCargar: 'No se pudieron cargar los mensajes.',
    errorEnviar: 'No se pudo enviar el mensaje. Inténtalo de nuevo.',
    errorEliminar: 'No se pudo eliminar el mensaje.',
    errorAbrir: 'No se pudo abrir la conversación.',
    errorDemasiadoLargo: 'El mensaje supera el límite de caracteres.',
    errorSinPermiso: 'No puedes participar de esta conversación.',
    formato: {
      negrita: 'Negrita',
      cursiva: 'Cursiva',
      mono: 'Monoespaciado',
    },
  },
  admin: {
    titulo: 'Panel administrativo',
    subtitle: 'Gestiona los reportes y usuarios de ResQ.',
    usuarios: 'Usuarios',
    reportes: 'Reportes',
    filtrarPor: 'Filtrar por estado:',
    casosMostrados: 'Casos mostrados',
    id: 'ID',
    nombre: 'Nombre',
    email: 'Email',
    telefono: 'Teléfono',
    rol: 'Rol',
    acciones: 'Acciones',
    idUsuario: 'ID Usuario',
    tipoCaso: 'Tipo de caso',
    descripcion: 'Descripción',
    estado: 'Estado',
    guardar: 'Guardar',
    cancelar: 'Cancelar',
    editar: 'Editar',
    eliminar: 'Eliminar',
    mensaje: 'Mensaje',
    mensajeA: 'Escribir mensaje a {{nombre}}',
    errorMensaje: 'No se pudo abrir la conversación con {{nombre}}',
    tituloModalEliminar: 'Eliminar usuario',
    confirmarEliminarDetalle: 'Vas a eliminar la cuenta de:',
    confirmarEliminarAviso: 'Esta acción no se puede deshacer.',
    usuarioEliminado: 'Usuario eliminado correctamente',
    errorEliminarUsuario: 'Error al eliminar usuario: {{detalle}}',
    errorCargarUsuarios: 'Error al cargar usuarios: {{detalle}}',
    errorCargarReportes: 'Error al cargar reportes: {{detalle}}',
    usuarioActualizado: 'Usuario actualizado correctamente',
    errorActualizarUsuario: 'Error al actualizar usuario: {{detalle}}',
    reporteActualizado: 'Reporte actualizado correctamente',
    errorActualizarReporte: 'Error al actualizar reporte: {{detalle}}',
    buscar: 'Buscar',
    buscarPlaceholder: 'Descripción o tipo de caso...',
    limpiarBusqueda: 'Limpiar búsqueda',
    ordenarPor: 'Ordenar por:',
    orden: {
      recientes: 'Más recientes',
      antiguos: 'Más antiguos',
    },
    sinResultados: 'Ningún reporte coincide con la búsqueda.',
    verDetalle: 'Ver detalle',
    detalle: {
      titulo: 'Detalle del reporte',
      cargando: 'Cargando el reporte...',
      noEncontrado: 'Ese reporte ya no existe.',
      errorCargar: 'No se pudo cargar el reporte: {{detalle}}',
      autor: 'Reportado por',
      autorDesconocido: 'Usuario no registrado',
      fecha: 'Fecha de creación',
      ubicacion: 'Ubicación',
      sinUbicacion: 'Sin ubicación registrada',
      sinFoto: 'Sin foto adjunta',
      estadoActual: 'Estado actual',
      cambiarEstado: 'Cambiar estado',
      nuevoEstado: 'Nuevo estado',
      estadoSinSalida: 'Este estado no admite cambios. Revisa el caso antes de modificarlo.',
      volver: 'Volver al panel',
    },
    cambioEstado: {
      ok: 'Estado actualizado correctamente',
      error: 'No se pudo actualizar el estado: {{detalle}}',
      sinCambio: 'Elige un estado diferente al actual.',
    },
    tituloModalEliminarReporte: 'Eliminar reporte',
    confirmarEliminarReporte: 'Vas a eliminar el reporte:',
    confirmarEliminarReporteAviso: 'Se pierde el caso y su ubicación. Esta acción no se puede deshacer.',
    reporteEliminado: 'Reporte eliminado correctamente',
    errorEliminarReporte: 'Error al eliminar reporte: {{detalle}}',
  },
} as const;

/** Forma de referencia (catalogo es) de la que se derivan las claves validas. */
export type CatalogShape = typeof es;

/**
 * Un catalogo puede estar incompleto: el ingles todavia no cubre todas las
 * claves y las ausentes caen al espanol en TranslateService.
 */
export type StringCatalog = { readonly [key: string]: string | StringCatalog };

type ExtractPaths<T> = {
  [K in keyof T]: T[K] extends string ? K & string : `${K & string}.${ExtractPaths<T[K]>}`;
}[keyof T];

export type TranslationKey = ExtractPaths<CatalogShape>;

function lookup(catalog: StringCatalog, key: string): string {
  let value: unknown = catalog;
  for (const part of key.split('.')) {
    if (value == null || typeof value !== 'object') {
      return key;
    }
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === 'string' ? value : key;
}

export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function getTranslation(
  key: TranslationKey,
  catalog: StringCatalog,
  params?: Record<string, string | number>,
): string {
  return interpolate(lookup(catalog, key), params);
}

export const en = {
  organizaciones: organizacionesEn,
  gestionCasos: gestionCasosEn,
  metricas: metricasEn,
  chatCaso: chatCasoEn,
  shared: {
    brand: {
      marca: 'R',
      nombre: 'ResQ',
    },
    volverAtras: 'Back',
    ubicacionSeleccionada: 'Selected location',
    estados: {
      PENDIENTE: 'Pending',
      EN_PROCESO: 'In progress',
      RESUELTO: 'Resolved',
      CANCELADO: 'Cancelled',
    },
    estadosRevision: {
      PENDIENTE_REVISION: 'Under review',
      APROBADO: 'Approved',
      RECHAZADO: 'Rejected',
    },
    roles: {
      USUARIO: 'User',
      VOLUNTARIO: 'Volunteer',
      ADMIN: 'Admin',
    },
    tiposCaso: {
      PERDIDA: 'Loss',
      ENCONTRADA: 'Found',
      ABANDONADA: 'Abandoned',
    },
  },
  landing: {
    topbar: {
      ariaLabel: 'Main navigation',
      inicio: 'Home',
      mapa: 'Map',
      casos: 'Cases',
      ayudar: 'Help',
      guia: 'Guide to report',
      perfil: 'My Profile',
      panelAdmin: 'Admin panel',
      reportar: 'Report',
    },
    header: {
      cerrarSesion: 'Log out',
      notificaciones: 'Notifications',
    },
    mapa: {
      eyebrow: 'Geographic visualization',
      titulo: 'Cases map',
      subtitulo: 'Explore the location of reported animals in your area',
      casosUbicados: 'Cases located',
      totalCasos: 'Total cases',
      leyenda: 'States',
      cargando: 'Loading cases...',
      errorCargar: 'Error loading cases: {{detalle}}',
      reintentar: 'Retry',
      sinCasos: 'No cases with registered location yet.',
      sinCasosFiltrado: 'No cases with those states.',
      filtrandoPor: 'Showing:',
      detalleCaso: 'Case detail',
      tipoCaso: 'Case type',
      estado: 'State',
      descripcion: 'Description',
      fechaCreacion: 'Creation date',
      ubicacion: 'Location',
      fotoAlt: 'Report photo',
      marcadorTexto: 'Report {{id}}, {{estado}}',
      cerrar: 'Close',
      cerrarDetalle: 'Close case detail',
    },
    hero: {
      eyebrow: 'Animal rescue network',
      tituloAntes: 'Connecting ',
      tituloAccento: 'relief',
      tituloDespues: ' with action.',
      descripcion:
        'We help locate, rescue and care for animals at risk, connecting people, shelters and volunteers in a single network.',
      acciones: {
        ayudar: 'I want to help',
        verCasos: 'View cases',
      },
      estadisticas: {
        ariaLabel: 'Community statistics',
        rescatados: 'Rescued',
        voluntarios: 'Volunteers',
        casosSemana: 'Cases this week',
      },
      imagenAriaLabel: 'Animal rescue image',
    },
    steps: {
      eyebrow: 'How it works',
      titulo: 'A simple and urgent process',
      paso1: {
        titulo: 'Report',
        descripcion: 'Upload the photo, describe the situation and locate the animal at risk.',
      },
      paso2: {
        titulo: 'Locate',
        descripcion: 'The community and shelters receive the alert to coordinate help.',
      },
      paso3: {
        titulo: 'Connect',
        descripcion: 'Volunteers, transporters and veterinarians join to solve it.',
      },
    },
    help: {
      eyebrow: 'Ways to help',
      titulo: 'There are many ways to collaborate',
      transporte: {
        titulo: 'Transport',
        descripcion: 'Go to pick up animals and take them to clinic or shelters.',
      },
      hogarTemporal: {
        titulo: 'Temporary home',
        descripcion: 'Offers a safe space while adoption is resolved.',
      },
      rescate: {
        titulo: 'Rescue',
        descripcion: 'Coordinates interventions and immediate emergency support.',
      },
    },
    guia: {
      eyebrow: 'Guide to report',
      titulo: 'Make a clear and useful report',
      descripcion:
        'Follow these steps to share the information that will help find or protect a pet.',
      pasosAriaLabel: 'Steps to create a report',
      paso1: {
        titulo: 'Choose report type',
        descripcion:
          'Indicate if the pet is lost, found or needs help due to abandonment. This allows the case to reach the right people.',
      },
      paso2: {
        titulo: 'Count case details',
        descripcion:
          'Describe where and when it occurred, plus its breed, color, name and any particular mark. You can also add a URL with a photo.',
      },
      paso3: {
        titulo: 'Review and send',
        descripcion:
          'Check that the information is correct and send the report. You need to log in to register the case in your profile.',
      },
      paso4: {},
      accion: {
        kicker: 'Ready to help?',
        titulo: 'Start your report',
        boton: 'Make a report',
      },
    },
  },
  auth: {
    login: {
      titulo: 'Login',
      correo: 'Email',
      correoPlaceholder: 'Your email',
      password: 'Password',
      passwordPlaceholder: 'Your password',
      boton: 'Login',
      noCuenta: 'No have an account?',
      registrate: 'Register here',
      errorCredenciales: 'Incorrect credentials. Check your email and password.',
      errorDb: 'Could not connect to the database. Try again later.',
    },
    register: {
      titulo: 'Create account',
      subtitle: 'Register in ResQ',
      nombre: 'Name',
      nombrePlaceholder: 'Your name',
      correo: 'Email',
      correoPlaceholder: 'Your email',
      password: 'Password',
      passwordError: 'Password must have at least 8 characters.',
      telefono: 'Phone',
      telefonoPlaceholder: 'Your phone',
      telefonoError: 'Phone is required.',
      rol: 'Role',
      seleccionarRol: 'Select a role',
      rolUsuario: 'User',
      rolVoluntario: 'Volunteer',
      boton: 'Register',
      ok: 'User registered correctly',
      errorDb: 'Could not connect to the database. Try again later.',
      yaTienesCuenta: 'Already have an account?',
      iniciaSesion: 'Login',
    },
  },
  perfil: {
    configuracion: {
      titulo: 'Settings',
      descripcion: 'Adjust your language and appearance preferences',
    },
    cargandoPerfil: 'Loading your profile...',
    correo: 'Email',
    telefono: 'Phone',
    noRegistrado: 'Not registered',
    sinSesion: 'There is no active session.',
    errorCargarPerfil: 'Could not load your profile information.',
    etiquetaRol: {
      USUARIO: 'User',
      VOLUNTARIO: 'Volunteer',
      ADMIN: 'Admin',
    },
    panelAdmin: 'Admin panel',
    misReportes: 'My reports',
    sinReportes: 'No reports yet.',
    crearNuevoReporte: 'Create new report',
    cargandoReportes: 'Loading reports...',
    ver: 'View',
    
    panelVoluntario: 'Volunteer panel',
    botonEditar: 'Edit',
    revisarSolicitudes: 'Review requests',

    tiposAyuda: {
      transporte: 'Transport',
      hogarTemporal: 'Temporary home',
      alimento: 'Food',
      rescate: 'Rescue',
    },
    botonVoluntario: 'I want to help',
    notificaciones: 'Notifications',
    mensajeSolicitud: 'Your request has been submitted and is pending review by the administrator.',
    errorVoluntario: 'There was an error with the volunteer request.',
    verSolicitudes: 'View requests',
    solicitudEnviada: 'Request sent',
    errorVoluntarioMostrar: 'Error with volunteer request',

    reportesSection: 'Reports',
    reportesHead: 'My reports',
    reportesNuevo: 'New report',
    reportesLista: 'Reports list',
    filtros: 'Filters',
    estado: {
      errorDistinto: 'Select a status different from the current one.',
      errorBase: 'Could not update the status. ',
      sinPermisos: 'You do not have permission to perform this action.',
      reintentar: 'Please try again.',
      ok: ' Status updated successfully.',
    },
    verReporte: 'View report',
    eliminarReporte: 'Delete report',
    editarReporte: 'Edit report',
    compartirReporte: 'Share report',

    revision: {
    titulo: 'Review',
    nota: 'Volunteer note',
    },

  },
  
  
  voluntario: {
    boton: 'I want to help',
    botonEditar: 'Edit help types',
    modalTituloRegistro: 'I want to volunteer',
    modalTituloEditar: 'Edit help types',
    modalSubtitulo: 'Select the types of help you can offer:',
    confirmar: 'Confirm',
    enviando: 'Sending...',
    errorSeleccion: 'Select at least one type of help.',
    errorGenerico: 'An error occurred. Please try again.',
    errorSolicitudDuplicada: 'You cannot submit another request yet.',
    tipos: {
      TRANSPORTE: 'Transport',
      HOGAR_TEMPORAL: 'Temporary home',
      ALIMENTO: 'Food',
      RESCATE: 'Rescue',
    },
    tiposAyuda: {
      transporte: 'Transport',
      hogarTemporal: 'Temporary home',
      alimento: 'Food',
      rescate: 'Rescue',
    },
    solicitudEnviada: 'Request sent',
    errorVoluntario: 'There was an error with the volunteer request.',
    verSolicitudes: 'View requests',

    modalVoluntario: {
      titulo: 'Volunteer request',
      subtitulo: 'Submit your availability',
      descripcion: 'Tell us when you are available to help',
      campos: {
        nombre: 'Name',
        telefono: 'Phone',
        disponibilidad: 'Availability',
      },
      botonEnviar: 'Send',
      error: 'There was an error submitting the request.',
    },
  },

  reportes: {
    filtros: {
      titulo: 'Filter cases by status',
      TODOS: 'All',
      URGENTES: 'Urgent',
      ACTIVOS: 'Active',
      RESUELTOS: 'Resolved',
      CANCELADOS: 'Cancelled',
    },

    nuevo: {
      titulo: 'Create new report',
      subtitle: 'Help us report an animal in need.',
      paso1: 'Report type',
      paso2: 'Details',
      continuar: 'Continue',
      tipoElegido: 'Report type: ',
      descripcion: 'Description',
      descripcionPlaceholder:
        'Describe the case: breed, color, name, location, time and distinguishing features...',

      foto: 'Photo (optional)',
      fotoAyuda: 'Allowed formats: JPG, PNG or WEBP. Maximum size: 5 MB.',
      fotoSeleccionar: 'Select photo',
      fotoCambiar: 'Change photo',
      fotoQuitar: 'Remove photo',
      fotoVistaPreviaAlt: 'Preview of the selected photo',
      fotoErrorFormato: 'Invalid format. Use a JPG, PNG or WEBP image.',
      fotoErrorTamano: 'The photo exceeds the maximum size of 5 MB.',
      fotoErrorSubir: 'Could not upload the photo. Please try again.',

      ubicacion: 'Location (optional)',
      ubicacionAyuda: 'Click on the map to mark where the animal is located.',
      ubicacionActual: 'Use my current location',
      ubicacionObteniendo: 'Getting your location...',
      ubicacionQuitar: 'Remove location',

      ubicacionError: {
        NO_SOPORTADA:
          'This device does not support location services. Mark the location on the map.',
        CONTEXTO_SEGURO:
          'A secure connection (HTTPS) is required to access your location. Mark the location on the map.',
        PERMISO_DENEGADO:
          'You denied location access. Mark the location on the map.',
        POSICION_NO_DISPONIBLE:
          'Could not determine your location. Please try again or select a point on the map.',
        TIEMPO_AGOTADO:
          'Getting your location took too long. Please try again or select a point on the map.',
        ERROR_DESCONOCIDO:
          'Could not get your location. Please try again or select a point on the map.',
      },

      atras: 'Back',
      creando: 'Creating...',
      crear: 'Create report',
      seleccionaTipo: 'Select a report type.',
      sinSesion: 'There is no active session. Please sign in again.',
      descripcionObligatoria: 'Description is required.',
      errorCrear: 'Could not create the report. Please try again.',
    },
  },


  solicitudes: {
    titulo: 'Pending requests',
    subtitulo: 'Review the information in cases reported by users.',
    sinPermisos: 'You do not have permission to view this section.',
    cargando: 'Loading requests...',
    vacio: 'There are no pending requests to review.',
    errorCargar: '❌ Could not load requests.',
    reporteNumero: 'Report #{{id}}',
    revisar: 'Review',
    modalTitulo: 'Review request #{{id}}',
    cerrarAria: 'Close',
    tipoCaso: 'Case type',
    descripcion: 'Description',
    fecha: 'Report date',
    ubicacion: 'Location',
    sinUbicacion: 'No location available',
    fotoAlt: 'Report photo',
    nota: 'Note for the user',
    notaAyuda: 'Required when rejecting, optional when approving.',
    notaPlaceholder: 'Briefly explain your decision...',
    aprobar: 'Approve',
    rechazar: 'Reject',
    enviando: 'Submitting...',
    notaObligatoria: 'You must provide a reason for rejection.',
    aprobada: '✅ Request #{{id}} approved. The user has been notified.',
    rechazada: '✅ Request #{{id}} rejected. The user has been notified.',
    errorDecidir: '❌ Could not save the decision. Please try again.',
    errorSinPermiso: '❌ You do not have permission to review requests.',
    errorYaRevisada: '❌ This request has already been reviewed. The list has been updated.',
  },

  

admin: {
  titulo: 'Admin panel',
  subtitle: 'Manage ResQ reports and users.',
  usuarios: 'Users',
  reportes: 'Reports',
  filtrarPor: 'Filter by status:',
  casosMostrados: 'Cases displayed',
  id: 'ID',
  nombre: 'Name',
  email: 'Email',
  telefono: 'Phone',
  rol: 'Role',
  acciones: 'Actions',
  idUsuario: 'User ID',
  tipoCaso: 'Case type',
  descripcion: 'Description',
  estado: 'Status',
  guardar: 'Save',
  cancelar: 'Cancel',
  editar: 'Edit',
  eliminar: 'Delete',
  mensaje: 'Message',
  mensajeA: 'Send a message to {{nombre}}',
  errorMensaje: 'Could not open the conversation with {{nombre}}',

  tituloModalEliminar: 'Delete user',
  confirmarEliminarDetalle: 'You are about to delete the account:',
  confirmarEliminarAviso: 'This action cannot be undone.',
  usuarioEliminado: 'User deleted successfully.',
  errorEliminarUsuario: 'Error deleting user: {{detalle}}',
  errorCargarUsuarios: 'Error loading users: {{detalle}}',
  errorCargarReportes: 'Error loading reports: {{detalle}}',
  usuarioActualizado: 'User updated successfully.',
  errorActualizarUsuario: 'Error updating user: {{detalle}}',
  reporteActualizado: 'Report updated successfully.',
  errorActualizarReporte: 'Error updating report: {{detalle}}',

  buscar: 'Search',
  buscarPlaceholder: 'Description or case type...',
  limpiarBusqueda: 'Clear search',
  ordenarPor: 'Sort by:',

  orden: {
    recientes: 'Most recent',
    antiguos: 'Oldest first',
  },

  sinResultados: 'No reports match your search.',
  verDetalle: 'View details',

  detalle: {
    titulo: 'Report details',
    cargando: 'Loading report...',
    noEncontrado: 'This report no longer exists.',
    errorCargar: 'Could not load report: {{detalle}}',
    autor: 'Reported by',
    autorDesconocido: 'Unregistered user',
    fecha: 'Creation date',
    ubicacion: 'Location',
    sinUbicacion: 'No location available',
    sinFoto: 'No photo attached',
    estadoActual: 'Current status',
    cambiarEstado: 'Change status',
    nuevoEstado: 'New status',
    estadoSinSalida: 'This status does not allow changes. Review the case before updating it.',
    volver: 'Back to admin panel',
  },

  cambioEstado: {
    ok: 'Status updated successfully.',
    error: 'Could not update status: {{detalle}}',
    sinCambio: 'Choose a status different from the current one.',
  },

  tituloModalEliminarReporte: 'Delete report',
  confirmarEliminarReporte: 'You are about to delete the report:',
  confirmarEliminarReporteAviso:
    'The case and its location will be deleted. This action cannot be undone.',
  reporteEliminado: 'Report deleted successfully.',
  errorEliminarReporte: 'Error deleting report: {{detalle}}',

  // Claves utilizadas por otros módulos
  panelAdmin: 'Admin panel',
  gestionCasos: 'Manage cases',
  organizaciones: 'Organizations',
  crear: 'Create',
  filtros: 'Filters',
  verReporte: 'View report',
  dashboard: 'Dashboard',
  metricas: 'Metrics',
  grafico: 'Chart',
  metricasPorCaso: 'Metrics by case',
  fecha: 'Date',
  usuario: 'User',
  accion: 'Action',

  revisarSolicitudesVoluntarios: 'Review volunteer applications',
},

  reportar: {
    tipoReporte: {
      PERDIDA: 'Lost',
      ENCONTRADA: 'Found',
      ABANDONADA: 'Abandoned',
    },
    formulario: {
      titulo: 'Make a report',
      tipo: {
        titulo: 'Report type',
        descripcion:
          'Indicate if the pet is lost, found or needs help due to abandonment. This allows the case to reach the right people.',
      },
      detalles: {
        titulo: 'Case details',
        descripcion:
          'Describe where and when it occurred, plus its breed, color, name and any particular mark. You can also add a URL with a photo.',
      },
      revisar: 'Review and send',
      descripcion:
        'Check that the information is correct and send the report. You need to log in to register the case in your profile.',
      accion: {
        kicker: 'Ready to help?',
        titulo: 'Start your report',
        boton: 'Make a report',
      },
    },
  },
  // HU-19: notificaciones.
  notificaciones: {
  titulo: 'Notifications',
  cargando: 'Loading notifications...',
  vacio: 'You have no notifications.',
  errorCargar: 'Could not load your notifications.',
  errorAccion: 'Could not update the notification.',
  sinLeer: '{{n}} unread',
  marcarLeida: 'Mark as read',
  marcarNoLeida: 'Mark as unread',
  archivar: 'Archive',
  abrir: 'Open notification',
},
  // HU-19: bandeja.
  bandeja: 'Inbox',
  // HU-19: mensaje.
  mensaje: 'Message',
  // HU-19: solicitud.
  solicitud: 'Request',
  // HU-19: administrar.
  administrar: 'Manage',
};

export type StringCatalogEn = typeof en;

type ExtractPathsEn<T> = {
  [K in keyof T]: T[K] extends string ? K & string : `${K & string}.${ExtractPathsEn<T[K]>}`;
}[keyof T];

export type TranslationKeyEn = ExtractPathsEn<StringCatalogEn>;

function lookupEn(catalog: StringCatalogEn, key: string): string {
  let value: unknown = catalog;
  for (const part of key.split('.')) {
    if (value == null || typeof value !== 'object') {
      return key;
    }
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === 'string' ? value : key;
}

export function getTranslationEn(
  key: TranslationKeyEn,
  catalog: StringCatalogEn,
  params?: Record<string, string | number>,
): string {
  return interpolate(lookupEn(catalog, key), params);
}
