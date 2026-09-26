export const es = {
  shared: {
    brand: {
      marca: 'R',
      nombre: 'ResQ',
    },
    volverAtras: 'Volver atrás',
    ubicacionSeleccionada: 'Ubicación seleccionada',
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
      estados: {
        PENDIENTE: 'Pendiente',
        EN_PROCESO: 'En proceso',
        RESUELTO: 'Resuelto',
        CANCELADO: 'Cancelado',
      },
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
      yaTienesCuenta: '¿Ya tienes una cuenta?',
      iniciaSesion: 'Inicia sesión',
    },
  },
  perfil: {
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
      fotoUrl: 'URL de foto (opcional)',
      fotoUrlPlaceholder: 'https://...',
      ubicacion: 'Ubicación (opcional)',
      ubicacionAyuda: 'Haz clic en el mapa para marcar dónde se encuentra el animal.',
      ubicacionQuitar: 'Quitar ubicación',
      atras: 'Atrás',
      creando: 'Creando...',
      crear: 'Crear reporte',
      seleccionaTipo: 'Selecciona un tipo de reporte.',
      sinSesion: 'No hay una sesión activa. Vuelve a iniciar sesión.',
      descripcionObligatoria: 'La descripción es obligatoria.',
      errorCrear: 'No se pudo crear el reporte. Inténtalo de nuevo.',
    },
  },
  admin: {
    titulo: 'Panel administrativo',
    subtitle: 'Gestiona los reportes y usuarios de ResQ.',
    usuarios: 'Usuarios',
    reportes: 'Reportes',
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
    errorCargarUsuarios: 'Error al cargar usuarios: {{detalle}}',
    errorCargarReportes: 'Error al cargar reportes: {{detalle}}',
    usuarioActualizado: 'Usuario actualizado correctamente',
    errorActualizarUsuario: 'Error al actualizar usuario: {{detalle}}',
    reporteActualizado: 'Reporte actualizado correctamente',
    errorActualizarReporte: 'Error al actualizar reporte: {{detalle}}',
  },
} as const;

export type StringCatalog = typeof es;

type ExtractPaths<T> = {
  [K in keyof T]: T[K] extends string
    ? K & string
    : `${K & string}.${ExtractPaths<T[K]>}`;
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

export function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}

export function getTranslation(
  key: TranslationKey,
  catalog: StringCatalog,
  params?: Record<string, string | number>
): string {
  return interpolate(lookup(catalog, key), params);
}