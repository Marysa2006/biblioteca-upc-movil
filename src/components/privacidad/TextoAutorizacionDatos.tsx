/**
 * El formato «Autorización para el tratamiento de datos personales» del Acuerdo 019 (#225), con
 * la fuente, el responsable y las finalidades que aplican a la app. Lo muestran el diálogo del
 * primer ingreso (AceptacionTratamientoDatos) y el registro (#203), así la persona lee el mismo
 * formato antes de autorizar.
 *
 * EL TEXTO LEGAL NO ES NUESTRO: se transcribe literal del Acuerdo, sin corregirlo ni resumirlo.
 * No lleva desplazamiento propio: lo pone quien lo muestra.
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colores, espacio } from '@/theme';
import { DIAS_HABILES_CONSULTA, DIAS_HABILES_RECLAMO, NIT_UNIVERSIDAD } from '@/utils/constantes';

import { EnlacePoliticaDatos } from './EnlacePoliticaDatos';

/**
 * Formato «Autorización para el tratamiento de datos personales», Acuerdo 019, páginas 18 y 19.
 * Transcripción literal de los puntos I a VI y de la frase de autorización.
 */
const PUNTOS_AUTORIZACION: readonly string[] = [
  'La UPC, actuará como responsable del Tratamiento de Datos Personales de los cuales soy titular y que, conjunta o separadamente podrá recolectar, usar y tratar mis datos personales conforme la política de Tratamiento de Datos Personales de la UPC, disponible en la página web www.unicesar.edu.co y para sus fines misionales.',
  'Es de carácter facultativo del titular del dato, responder preguntas que versen sobre Datos Sensibles o sobre menores de edad. NOTA: Son Datos Sensibles, aquellos que afecten la intimidad del titular o cuyo uso indebido puede generar discriminación.',
  'Mis derechos como titular de los datos son los previstos en la Constitución y la ley, especialmente el derecho a conocer, actualizar, rectificar y suprimir mi información personal, así como el derecho a revocar el consentimiento otorgado para el tratamiento de datos personales.',
  'Los derechos pueden ser ejercidos a través del correo electrónico tratamientodedatos@unicesar.edu.co dispuesta por la UPC, y observando la Política de Tratamiento de Datos Personales de la misma UPC.',
  'Para cualquier inquietud o información adicional relacionada con el tratamiento de datos personales, puedo contactarme al correo electrónico: tratamientodedatos@unicesar.edu.co',
  'La UPC garantiza la confidencialidad, libertad, seguridad, veracidad, transparencia, acceso y circulación restringida de mis datos y se reservan el derecho de modificar su Política de Tratamiento de Datos Personales en cualquier momento. Cualquier cambio será publicado oportunamente en la página WEB. informado y Teniendo en cuenta lo anterior, autorizo de manera voluntaria, previa, explicita, informada e inequívoca a la UPC, para tratar mis datos personales de acuerdo con la Política de Tratamiento de Datos Personales de la UPC y para los fines relacionados con su Misión y en especial para fines legales, contractuales, comerciales descritos en la Política de Tratamiento de Datos Personales de la UPC. La información obtenida para el Tratamiento de mis datos personales la he suministrado de forma voluntaria y es verídica.',
];

/**
 * Las finalidades del numeral 6.1 del Acuerdo que aplican a lo que hace esta app: son las cuatro
 * que señaló la revisión del #225 (a, e, h y j). Texto literal del Acuerdo.
 */
const FINALIDADES_QUE_APLICAN: readonly { letra: string; texto: string }[] = [
  {
    letra: 'a',
    texto:
      'Proveer información o servicios institucionales derivados de la relación existente entre el Titular y La UNIVERSIDAD.',
  },
  { letra: 'e', texto: 'Evaluar la calidad de programas o servicios institucionales.' },
  // La h) está cortada en el PDF del Acuerdo: se transcribe hasta donde llega el texto.
  { letra: 'h', texto: 'Adelantar encuestas de satisfacción y percepción de los grupos de valor' },
  {
    letra: 'j',
    texto:
      'Recopilar información de asistentes a eventos de capacitación desarrollados por la UNIVERSIDAD',
  },
];

const NUMERALES = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;

export function TextoAutorizacionDatos() {
  return (
    <View style={estilos.bloque}>
      <Text variant="bodyMedium" style={estilos.texto}>
        Con la firma de este documento manifiesto que he sido informado por La Universidad
        Popular Del Cesar (en adelante “UPC”) de que:
      </Text>
      {PUNTOS_AUTORIZACION.map((texto, i) => (
        <Text key={NUMERALES[i]} variant="bodyMedium" style={estilos.texto}>
          {`${NUMERALES[i]}. ${texto}`}
        </Text>
      ))}
      <Text variant="bodySmall" style={estilos.fuente}>
        Acuerdo 019 del 5 de octubre de 2020 de la UPC, «Autorización para el tratamiento
        de datos personales», páginas 18 y 19.
      </Text>
      <Text variant="bodySmall" style={estilos.fuente}>
        {`Responsable: Universidad Popular del Cesar, NIT ${NIT_UNIVERSIDAD}. Responde las consultas en máximo ${DIAS_HABILES_CONSULTA} días hábiles y los reclamos en máximo ${DIAS_HABILES_RECLAMO} días hábiles.`}
      </Text>
      <Text variant="bodyMedium" style={estilos.texto}>
        Finalidades del tratamiento que aplican a esta app (numeral 6.1 del Acuerdo):
      </Text>
      {FINALIDADES_QUE_APLICAN.map(({ letra, texto }) => (
        <Text key={letra} variant="bodySmall" style={estilos.fuente}>
          {`${letra}) ${texto}`}
        </Text>
      ))}
      <EnlacePoliticaDatos nota="Lee la política completa antes de aceptar:" />
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { gap: espacio.s },
  texto: { color: colores.texto },
  // La fuente del texto, para que se pueda comprobar de dónde sale.
  fuente: { color: colores.textoSecundario },
});
