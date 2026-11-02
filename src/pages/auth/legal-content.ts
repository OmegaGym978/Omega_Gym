/**
 * Textos legales de Omega Gym.
 *
 * Los fragmentos entre [corchetes] son datos pendientes del Responsable
 * (razón social, domicilio y correo de contacto): se muestran resaltados en la
 * app para que sea evidente qué falta completar antes de publicar.
 */

export type LegalBlock =
  | { kind: 'p'; text: string }
  | { kind: 'label'; text: string }
  | { kind: 'list'; items: string[] }

export interface LegalSection {
  heading: string
  blocks: LegalBlock[]
}

export interface LegalDocument {
  title: string
  /** Nota visible mientras el documento no está publicado. */
  pendingNote: string
  sections: LegalSection[]
}

export const PRIVACY_NOTICE: LegalDocument = {
  title: 'Aviso de Privacidad Integral',
  pendingNote:
    'Documento en revisión: los datos entre [corchetes] están pendientes de completar. Los Términos y Condiciones se publicarán en este mismo apartado.',
  sections: [
    {
      heading: '1. Identidad y domicilio del Responsable',
      blocks: [
        {
          kind: 'p',
          text: '[Nombre de la Persona Física o Razón Social], operando bajo el nombre comercial "Omega Gym" (en adelante, el "Responsable"), con domicilio en [Calle, Número, Colonia, C.P.], Tepic, Nayarit, México, es responsable de recabar sus datos personales, del uso que se le dé a los mismos y de su protección, en cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).',
        },
      ],
    },
    {
      heading: '2. Datos personales sometidos a tratamiento',
      blocks: [
        {
          kind: 'p',
          text: 'Para llevar a cabo las finalidades descritas en este aviso, recabaremos los siguientes datos personales:',
        },
        {
          kind: 'list',
          items: [
            'Datos de identificación y contacto: nombre completo, alias, correo electrónico y número de teléfono.',
            'Datos de la cuenta: historial de pagos (en efectivo o transferencia), estado de membresía, fechas de ingreso y asistencia.',
            'Datos de menores de edad: en caso de usuarios menores de 18 años, se recabarán datos de identificación con el consentimiento expreso y por escrito del padre, madre o tutor legal.',
          ],
        },
      ],
    },
    {
      heading: '3. Datos personales sensibles',
      blocks: [
        {
          kind: 'p',
          text: 'Además de los datos anteriores, recabaremos y trataremos datos personales sensibles relacionados con su estado de salud físico (lesiones previas y condiciones médicas relevantes comunicadas al entrenador) y métricas de entrenamiento (pesos, rutinas y series). Estos datos son estrictamente necesarios para la asignación de rutinas y la prevención de lesiones, y requieren su consentimiento expreso.',
        },
      ],
    },
    {
      heading: '4. Cámaras de videovigilancia',
      blocks: [
        {
          kind: 'p',
          text: 'Las instalaciones de Omega Gym cuentan con un sistema de videovigilancia. Las imágenes y sonidos captados por las cámaras serán utilizados para la seguridad de los usuarios, del personal y de las instalaciones. Estas grabaciones se resguardan por un periodo limitado y posteriormente son destruidas, salvo que sean requeridas por una autoridad competente.',
        },
      ],
    },
    {
      heading: '5. Finalidades del tratamiento',
      blocks: [
        { kind: 'label', text: 'Finalidades primarias (necesarias para el servicio):' },
        {
          kind: 'list',
          items: [
            'Registro y creación de cuenta en la plataforma Omega_Gym.',
            'Control de acceso a las instalaciones y gestión de vigencia de membresías.',
            'Diseño, asignación y seguimiento de planes de entrenamiento personalizados.',
            'Gestión de cobros, bloqueos por impago, congelamientos y reembolsos según nuestras políticas.',
            'Contacto para avisos operativos del sistema y seguimiento de emergencias.',
          ],
        },
        {
          kind: 'label',
          text: 'Finalidades secundarias (no necesarias para el servicio, pero que mejoran su experiencia):',
        },
        {
          kind: 'p',
          text: 'Envío de promociones, publicidad y ofertas exclusivas a través de correo electrónico y/o mensajes de WhatsApp.',
        },
        {
          kind: 'p',
          text: 'Si no desea que sus datos sean tratados para las finalidades secundarias, puede indicarlo enviando un correo a [Correo electrónico de contacto/soporte]. La negativa para el uso de sus datos para estas finalidades no será motivo para negarle los servicios.',
        },
      ],
    },
    {
      heading: '6. Transferencia de datos',
      blocks: [
        {
          kind: 'p',
          text: 'Sus datos personales no serán vendidos ni compartidos con terceros ajenos a la operación de Omega Gym. Sin embargo, para la prestación del servicio de la aplicación, sus datos son alojados en infraestructuras de computación en la nube provistas por Vercel y Supabase. Estas empresas actúan como Encargados a nombre del Responsable y operan bajo estrictas políticas de confidencialidad y seguridad.',
        },
      ],
    },
    {
      heading: '7. Derechos ARCO y revocación del consentimiento',
      blocks: [
        {
          kind: 'p',
          text: 'Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación); que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no está siendo utilizada conforme a los principios, deberes y obligaciones previstas en la normativa (Cancelación); así como oponerse al uso de sus datos personales para fines específicos (Oposición).',
        },
        {
          kind: 'p',
          text: 'Para el ejercicio de cualquiera de los derechos ARCO, o para revocar su consentimiento, deberá presentar la solicitud respectiva enviando un correo electrónico a [Correo electrónico de contacto/soporte].',
        },
      ],
    },
    {
      heading: '8. Uso de tecnologías de rastreo en nuestro portal de internet',
      blocks: [
        {
          kind: 'p',
          text: 'Le informamos que en nuestra plataforma web (PWA) utilizamos cookies y tokens de sesión estrictamente necesarios para mantener su sesión activa, gestionar sus permisos según su rol (admin, entrenador, miembro) y garantizar la seguridad de su cuenta.',
        },
      ],
    },
    {
      heading: '9. Cambios al Aviso de Privacidad',
      blocks: [
        {
          kind: 'p',
          text: 'El presente aviso de privacidad puede sufrir modificaciones, cambios o actualizaciones derivadas de nuevos requerimientos legales, de nuestras propias necesidades operativas o de cambios en nuestro modelo de negocio. Nos comprometemos a mantenerlo informado sobre los cambios que pueda sufrir el presente aviso a través de la aplicación Omega_Gym o mediante correo electrónico.',
        },
      ],
    },
  ],
}
