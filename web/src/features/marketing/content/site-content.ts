export const appStoreUrl = 'https://apps.apple.com/es/app/luva-ingles/id6758112881'
export const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.cardi7.luva'
export const supportEmail = 'dcardenasgz@gmail.com'
export const lastLegalUpdate = '29/03/2026'

export const socialLinks = [
  {
    eyebrow: 'iPhone / iPad',
    title: 'Descargar en App Store',
    detail: 'Instala Luva en iOS y empieza a practicar conversaciones guiadas en inglés.',
    href: appStoreUrl,
    cta: 'Abrir App Store',
  },
  {
    eyebrow: 'Android',
    title: 'Descargar en Google Play',
    detail: 'Accede a la versión para Android con el mismo enfoque de speaking y feedback inmediato.',
    href: playStoreUrl,
    cta: 'Abrir Google Play',
  },
]

export const sessionFlow = [
  {
    title: 'Contexto en voz',
    detail:
      'Escuchas el reto: una carta, una historia o una situación real. Tienes 30 segundos para pensar tu respuesta.',
  },
  {
    title: 'Habla y responde',
    detail:
      'Respondes en voz. Luva transcribe, entiende tu intención y mantiene el ritmo para que no pierdas fluidez.',
  },
  {
    title: 'Feedback inmediato',
    detail:
      'En segundos recibes correcciones de pronunciación y gramática, frases modelo y vocabulario para subir a C1.',
  },
  {
    title: 'Seguimiento',
    detail:
      'Guardamos tu progreso y proponemos el siguiente reto en función de lo que ya dominaste y tus errores frecuentes.',
  },
]

export const highlights = [
  {
    title: 'Conversaciones guiadas',
    description:
      'Cartas y micro historias creadas para hispanohablantes B1→C1. Escuchas el contexto, respondes en voz y recibes la réplica.',
  },
  {
    title: 'Correcciones accionables',
    description:
      'Transcripción limpia, frases modelo, phrasal verbs y notas cortas de pronunciación para usar en la siguiente respuesta.',
  },
  {
    title: 'Entrena hablando',
    description:
      'Interacción 100% por voz con refuerzos opcionales en texto. Practicas listening, speaking y autocorrección en un mismo flujo.',
  },
  {
    title: 'Seguro por diseño',
    description:
      'Sin claves de IA en el cliente. Todo pasa por nuestra API en AWS con cifrado en tránsito y en reposo.',
  },
]

export const commitments = [
  {
    label: 'B1→C1',
    text: 'Retos diseñados con rúbricas CEFR para que ganes precisión sin perder naturalidad.',
  },
  {
    label: '10-15 min',
    text: 'Sesiones cortas y guiadas que puedes completar en un descanso o de camino a casa.',
  },
  {
    label: 'Respeto a tu tiempo',
    text: 'Sin feeds infinitos ni notificaciones invasivas. Luva te recuerda solo lo necesario para progresar.',
  },
]

export const termsPoints = [
  'Al usar Luva aceptas estos términos y los ajustes que publiquemos. La app está pensada para mayores de 16 años.',
  'Usa la app solo para practicar inglés. No la utilices para actividades ilegales, automatización masiva ni para poner en riesgo a otras personas.',
  'Si creas una cuenta, mantén tus credenciales seguras. Podemos suspender accesos que abusen del servicio o interfieran con la infraestructura.',
  'Las suscripciones o compras dentro de la app, si aplican, se gestionan a través de la tienda correspondiente (App Store/Play Store) y se rigen por sus políticas.',
  'Todo el contenido y la tecnología de Luva son propiedad de sus creadores. No está permitido copiar, redistribuir o crear obras derivadas sin permiso.',
  'Luva es una herramienta de aprendizaje: no garantizamos resultados específicos ni asumimos responsabilidad por decisiones tomadas con base en la información entregada.',
]

export const privacyPoints = [
  'Recopilamos datos básicos de cuenta (por ejemplo, correo o alias), progreso de sesiones, transcripciones de voz y métricas de evaluación. No pedimos acceso a tus contactos ni fotos.',
  'Usamos tus datos para operar la app, personalizar retos, mejorar los modelos de corrección y enviar comunicaciones relevantes sobre el servicio.',
  'El audio se procesa para generar transcripciones y feedback; después se descarta. Guardamos las transcripciones y métricas para darte seguimiento.',
  'Alojamos la infraestructura en AWS. Protegemos la información con cifrado en tránsito y en reposo y aplicamos controles de acceso mínimos.',
  'No vendemos tus datos. Solo los compartimos con proveedores que nos ayudan a operar (autenticación, almacenamiento, analítica) bajo acuerdos de confidencialidad.',
  `Puedes solicitar acceso, corrección o eliminación de tus datos escribiendo al equipo de soporte publicado en la app o en ${supportEmail}.`,
]
