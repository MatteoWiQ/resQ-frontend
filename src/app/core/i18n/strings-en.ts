import { organizacionesEn } from './strings-organizaciones-en';
import { gestionCasosEn } from './strings-gestionar-casos-en';
import { metricasEn } from './strings-metricas-en';

export const en = {
  // HU-20: registro de organizaciones (textos en strings-organizaciones-en.ts)
  organizaciones: organizacionesEn,
  gestionCasos: gestionCasosEn,
  // HU-34: mÃ©tricas de la comunidad (textos en strings-metricas-en.ts)
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
    // HU-19: resultado de la revisiÃ³n del caso por un voluntario. Vive en el
    // catalogo compartido (y no en perfil) porque tambien lo muestra el detalle
    // del caso en el panel administrativo.
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
    // HU-logout: cabecera compartida (landing/perfil/panel).
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
      alimento: {
        titulo: 'Food',
        descripcion: 'Supports with basic necessities for animals.',
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
    // HU-23: acceso al panel de usuarios, solo para administradores.
    panelVoluntario: 'Volunteer panel',
    botonEditar: 'Edit',
    // HU-19: voluntarios y admins revisan solicitudes.
    revisarSolicitudes: 'Review requests',
    // HU-23: tipos de ayuda.
    tiposAyuda: {
      transporte: 'Transport',
      hogarTemporal: 'Temporary home',
      alimento: 'Food',
      rescate: 'Rescue',
    },
    botonVoluntario: 'I want to help',
    // HU-19: notificaciones.
    notificaciones: 'Notifications',
    mensajeSolicitud: 'Your request has been submitted and is pending review by the administrator.',
    errorVoluntario: 'There was an error with the volunteer request.',
    // HU-19: ver solicitudes.
    verSolicitudes: 'View requests',
    // HU-19: solicitud enviada.
    solicitudEnviada: 'Request sent',
    // HU-19: error voluntario.
    errorVoluntarioMostrar: 'Error with volunteer request',
    reportesSection: 'Reports',
    reportesHead: 'My reports',
    reportesNuevo: 'New report',
    reportesLista: 'Reports list',
    // HU-19: filtros.
    filtros: 'Filters',
    // HU-19: estado.
    estado: 'State',
    // HU-19: ver reporte.
    verReporte: 'View report',
    // HU-19: eliminar reporte.
    eliminarReporte: 'Delete report',
    // HU-19: editar reporte.
    editarReporte: 'Edit report',
    // HU-19: compartir reporte.
    compartirReporte: 'Share report',
  },
  voluntario: {
    boton: 'I want to help',
    // HU-23: tipos de ayuda.
    tiposAyuda: {
      transporte: 'Transport',
      hogarTemporal: 'Temporary home',
      alimento: 'Food',
      rescate: 'Rescue',
    },
    // HU-19: solicitud enviada.
    solicitudEnviada: 'Request sent',
    // HU-19: error voluntario.
    errorVoluntario: 'There was an error with the volunteer request.',
    // HU-19: ver solicitudes.
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
    // HU-19: gestionar casos.
    gestionCasos: 'Manage cases',
    // HU-19: organizaciones.
    organizaciones: 'Organizations',
    // HU-19: ver reporte.
    verDetalle: 'View detail',
    // HU-19: eliminar.
    eliminar: 'Delete',
    // HU-19: editar.
    editar: 'Edit',
    // HU-19: crear.
    crear: 'Create',
    // HU-19: filtros.
    filtros: 'Filters',
    // HU-19: estado.
    estado: 'State',
    // HU-19: ver reporte.
    verReporte: 'View report',
    dashboard: 'Dashboard',
    // HU-34: mÃ©tricas.
    metricas: 'Metrics',
    // HU-34: grÃ¡fico.
    grafico: 'Graph',
    // HU-34: mÃ©tricas por caso.
    metricasPorCaso: 'Metrics per case',
    // HU-34: fecha.
    fecha: 'Date',
    // HU-34: usuario.
    usuario: 'User',
    // HU-34: acciÃ³n.
    accion: 'Action',
  },
  reportar: {
    // HU-19: tipo de reporte.
    tipoReporte: {
      PERDIDA: 'Lost',
      ENCONTRADA: 'Found',
      ABANDONADA: 'Abandoned',
    },
    // HU-19: formulario.
    formulario: {
      titulo: 'Make a report',
      // HU-19: tipo.
      tipo: {
        titulo: 'Report type',
        descripcion:
          'Indicate if the pet is lost, found or needs help due to abandonment. This allows the case to reach the right people.',
      },
      // HU-19: detalles.
      detalles: {
        titulo: 'Case details',
        descripcion:
          'Describe where and when it occurred, plus its breed, color, name and any particular mark. You can also add a URL with a photo.',
      },
      // HU-19: revisar.
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

}
