import { organizacionesEs } from './strings-organizaciones';
import { gestionCasosEs } from './strings-gestionar-casos';
import { metricasEs } from './strings-metricas';
import { organizacionesEn } from './strings-organizaciones-en';
import { gestionCasosEn } from './strings-gestionar-casos-en';
import { metricasEn } from './strings-metricas-en';

export const es = {
  // HU-20: registro de organizaciones (textos en strings-organizaciones.ts)
  organizaciones: organizacionesEs,
  gestionCasos: gestionCasosEs,
  // HU-34: métricas de la comunidad (textos en strings-metricas.ts)
  metricas: metricasEs,
  shared: {
    brand: {
      marca: 'R',
      nombre: 'ResQ',
    },
    volverAtras: 'Volver atrás',
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
    tipos: {
      TRANSPORTE: 'Transporte',
      HOGAR_TEMPORAL: 'Hogar temporal',
      ALIMENTO: 'Alimento',
      RESCATE: 'Rescate',
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

export type StringCatalog = typeof es;

type ExtractPaths<T> = {
  [K in keyof T]: T[K] extends string ? K & string : `${K & string}.${ExtractPaths<T[K]>}`;
}[keyof T];

export type TranslationKey = ExtractPaths<StringCatalog>;

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
      titulo: 'Configuration',
      descripcion: 'Adjust your language and appearance preferences',
    },
    cargandoPerfil: 'Loading your profile...',
    correo: 'Email',
    telefono: 'Phone',
    noRegistrado: 'Not registered',
    etiquetaRol: {
      USUARIO: 'User',
      VOLUNTARIO: 'Volunteer',
      ADMIN: 'Admin',
    },
    panelAdmin: 'Admin panel',
    misReportes: 'My reports',
    sinReportes: 'No reports yet.',
    crearNuevoReporte: 'Create new report',
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
    estado: 'State',
    verReporte: 'View report',
    eliminarReporte: 'Delete report',
    editarReporte: 'Edit report',
    compartirReporte: 'Share report',
  },
  voluntario: {
    boton: 'I want to help',
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
  admin: {
    panelAdmin: 'Admin panel',
    gestionCasos: 'Manage cases',
    organizaciones: 'Organizations',
    verDetalle: 'View detail',
    eliminar: 'Delete',
    editar: 'Edit',
    crear: 'Create',
    filtros: 'Filters',
    estado: 'State',
    verReporte: 'View report',
    dashboard: 'Dashboard',
    metricas: 'Metrics',
    grafico: 'Graph',
    metricasPorCaso: 'Metrics per case',
    fecha: 'Date',
    usuario: 'User',
    accion: 'Action',
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
  notificaciones: 'Notifications',
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
