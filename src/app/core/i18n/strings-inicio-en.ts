/** Redesign: Home page strings. Merged into `en` in strings.ts. */
export const inicioEn = {
  hero: {
    titulo: 'Every report brings an animal closer to safety.',
    descripcion:
      'ResQ connects people who find an animal at risk with volunteers, shelters and vets in La Paz and El Alto.',
    reportar: {
      titulo: 'I found an animal at risk',
      descripcion: 'Upload a photo and mark where it is. It takes 2 minutes.',
      accion: 'Report',
    },
    ayudar: {
      titulo: 'I want to help',
      descripcion: 'See cases near you and offer transport, a home or food.',
      accion: 'See cases',
    },
  },
  carrusel: {
    ariaLabel: 'Latest cases',
    anterior: 'Previous case',
    siguiente: 'Next case',
    posicion: 'Case {{n}} of {{total}}',
    sinFoto: 'Case without a photo',
    vacio: 'There are no open cases right now. When someone reports one, it will show up here.',
  },
  insignias: {
    urgente: 'Urgent',
    activo: 'Active',
  },
  tiempo: {
    ahora: 'just now',
    minutos: '{{n}} min ago',
    horas: '{{n}} h ago',
    dias: '{{n}} d ago',
  },
  urgentes: {
    titulo: 'Cases that need help now',
    subtitulo: 'Cases nobody has taken yet come first, newest to oldest.',
    verTodos: 'See all cases',
  },
  historia: {
    titulo: 'How a case gets solved on ResQ',
    subtitulo: 'From a report on the street to a safe place, step by step.',
    paso1: {
      hora: '9:12',
      titulo: 'Someone finds it and reports it',
      descripcion: 'They upload a photo and mark the exact corner on the map.',
    },
    paso2: {
      hora: '9:30',
      titulo: 'A local shelter takes the case',
      descripcion: 'Nearby volunteers get the alert.',
    },
    paso3: {
      hora: '11:05',
      titulo: 'A volunteer takes it to the vet',
      descripcion: 'The case is updated with every change.',
    },
    paso4: {
      hora: 'Day 3',
      titulo: 'It is safe in a foster home',
      descripcion: 'Now it is looking for a family to adopt it.',
    },
  },
  ayudar: {
    titulo: 'Help with what you have',
    subtitulo: 'You do not need to be a rescuer. Every case says what it is missing.',
    verCasos: 'See cases',
    transporte: { titulo: 'Transport', descripcion: 'Take an animal to the clinic or the shelter.' },
    hogar: { titulo: 'Foster home', descripcion: 'Offer a safe place until it is adopted.' },
    alimento: { titulo: 'Food and supplies', descripcion: 'Donate food, blankets or medicine.' },
    rescate: { titulo: 'Field rescue', descripcion: 'Coordinate interventions in emergencies.' },
  },
  organizaciones: {
    titulo: 'Shelters and organizations in the network',
    subtitulo: 'They get alerts for their area and manage their cases from a panel.',
    unete: 'Are you an organization? Join',
    logoAlt: '{{nombre}} logo',
  },
  pie: {
    ariaLabel: 'Footer links',
    comoAyudar: 'How to help',
    organizaciones: 'Organizations',
    guia: 'Guide to report',
    lema: 'Animal rescue network for La Paz and El Alto.',
  },
};
