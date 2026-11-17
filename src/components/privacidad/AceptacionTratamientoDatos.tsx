/**
 * Autorización de tratamiento de datos personales (#225, CA2).
 *
 * Aparece la primera vez que alguien inicia sesión en este celular, y también cuando la
 * Universidad publica otra política: sin la aceptación no se puede usar la app con cuenta,
 * porque las pantallas con sesión manejan datos personales. No se cierra tocando fuera ni con
 * el botón atrás de Android: hay que aceptar o salir de la sesión.
 *
 * La aceptación queda guardada por usuario en la sesión (src/store/sesion.ts), con la fecha de
 * la política y el momento en que se aceptó, que es la prueba de la autorización. No se vuelve
 * a pedir hasta que cambie la política.
 *
 * EL TEXTO LEGAL NO ES NUESTRO. Se transcribe literal del Acuerdo 019 del 5 de octubre de 2020
 * de la UPC: el formato «Autorización para el tratamiento de datos personales» de las páginas 18
 * y 19 (puntos I a VI y la frase de autorización). Se copia tal cual, con su puntuación, sin
 * corregirlo ni resumirlo: corregirlo ya sería redactar el texto de la Universidad.
 *
 * Los datos del responsable (NIT) y los plazos de respuesta van aparte, como información de
 * contacto: son del Acuerdo (numeral 2, literal b, y numerales 9.3 y 9.4) y no forman parte del
 * formato de autorización.
 */
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Button, Checkbox, Dialog, Portal, Text } from 'react-native-paper';

import { useCerrarSesion } from '@/hooks/useAutenticacion';
import { useSesion } from '@/store/sesion';
import { colores, espacio, fuentes } from '@/theme';
import {
  DIAS_HABILES_CONSULTA,
  DIAS_HABILES_RECLAMO,
  NIT_UNIVERSIDAD,
  VERSION_POLITICA_DATOS,
} from '@/utils/constantes';
import { aceptoPoliticaVigente } from '@/utils/privacidad';

import { EnlacePoliticaDatos } from './EnlacePoliticaDatos';

const MENSAJE_AL_SALIR =
  'Cerramos tu sesión. Sin la autorización no podemos tratar tus datos personales, pero puedes seguir explorando la app sin cuenta.';

const ENCABEZADO_POLITICA = 'Tratamiento de datos personales';

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

const NUMERALES = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;

export function AceptacionTratamientoDatos() {
  const usuario = useSesion((estado) => estado.usuario);
  const hidratada = useSesion((estado) => estado.hidratada);
  const aceptaciones = useSesion((estado) => estado.aceptaciones);
  const aceptar = useSesion((estado) => estado.aceptarTratamientoDatos);
  const cerrarSesion = useCerrarSesion();
  // El texto se desplaza dentro del diálogo: en un celular bajo o con letra grande, ocupa menos.
  const { height } = useWindowDimensions();
  const altoTexto = Math.max(200, Math.min(460, Math.round(height * 0.55)));

  // La casilla vale para este usuario y esta política: si cambia cualquiera de los dos, vuelve a
  // estar desmarcada. Así la autorización siempre es expresa, sin reiniciarla desde un efecto.
  const claveAceptacion = usuario ? `${usuario.id}|${VERSION_POLITICA_DATOS}` : null;
  const [marcadaPara, setMarcadaPara] = useState<string | null>(null);
  const [avisoSalida, setAvisoSalida] = useState(false);
  const aceptada = claveAceptacion != null && marcadaPara === claveAceptacion;

  const visible = hidratada && usuario != null && !aceptoPoliticaVigente(aceptaciones, usuario.id);

  // En iOS el diálogo no se anuncia solo; en Android lo hace el propio Portal.
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    if (visible) {
      AccessibilityInfo.announceForAccessibility('Autorización de tratamiento de datos personales');
    } else if (avisoSalida) {
      AccessibilityInfo.announceForAccessibility(MENSAJE_AL_SALIR);
    }
  }, [visible, avisoSalida]);

  const alternarCasilla = () => {
    if (claveAceptacion == null) return;
    setMarcadaPara(aceptada ? null : claveAceptacion);
  };

  const aceptarPolitica = () => {
    setMarcadaPara(null);
    aceptar();
  };

  const noAceptar = () => {
    setMarcadaPara(null);
    cerrarSesion();
    setAvisoSalida(true);
    // La vista del personal vuelve al login sola al quedarse sin sesión; la comunidad sigue
    // donde estaba y puede explorar sin cuenta, que es lo que dice el aviso.
  };

  return (
    <>
      {usuario ? (
        <Portal>
          <Dialog
            visible={visible}
            // Sin cerrar por fuera ni con el botón atrás: hay que decidir.
            dismissable={false}
            dismissableBackButton={false}
            style={estilos.dialogo}
          >
            <Dialog.Icon icon="shield-account-outline" color={colores.primario} />
            <Dialog.Title style={estilos.titulo}>{ENCABEZADO_POLITICA}</Dialog.Title>
            <Dialog.ScrollArea style={[estilos.area, { maxHeight: altoTexto }]}>
              <ScrollView contentContainerStyle={estilos.contenido}>
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
                <EnlacePoliticaDatos nota="Lee la política completa antes de aceptar:" />
              </ScrollView>
            </Dialog.ScrollArea>
            {/* La casilla va fuera del texto desplazable: siempre se ve, aunque el texto sea largo. */}
            <Checkbox.Item
              label="He leído y acepto la autorización para el tratamiento de mis datos personales del Acuerdo 019 de 2020."
              status={aceptada ? 'checked' : 'unchecked'}
              onPress={alternarCasilla}
              position="leading"
              mode="android"
              color={colores.primario}
              uncheckedColor={colores.bordeFuerte}
              style={estilos.casilla}
              labelStyle={estilos.etiquetaCasilla}
              labelVariant="bodySmall"
              accessibilityLabel="Acepto la autorización para el tratamiento de mis datos personales"
            />
            <Dialog.Actions style={estilos.acciones}>
              <Button
                mode="text"
                onPress={noAceptar}
                contentStyle={estilos.contenidoBoton}
                accessibilityRole="button"
                accessibilityLabel="No acepto la autorización: cierra la sesión"
              >
                No acepto
              </Button>
              <Button
                mode="contained"
                onPress={aceptarPolitica}
                disabled={!aceptada}
                contentStyle={estilos.contenidoBoton}
                accessibilityRole="button"
                accessibilityLabel="Aceptar la autorización y continuar"
              >
                Aceptar y continuar
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      ) : null}

      <Portal>
        <Dialog visible={avisoSalida} onDismiss={() => setAvisoSalida(false)} style={estilos.dialogo}>
          <Dialog.Title style={estilos.titulo}>Sesión cerrada</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={estilos.texto}>
              {MENSAJE_AL_SALIR}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              mode="contained"
              onPress={() => setAvisoSalida(false)}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel="Entendido"
            >
              Entendido
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const estilos = StyleSheet.create({
  dialogo: { backgroundColor: colores.superficie },
  titulo: { textAlign: 'center', color: colores.texto, fontFamily: fuentes.negrita },
  area: { paddingHorizontal: 0 },
  contenido: { gap: espacio.s, paddingHorizontal: espacio.l, paddingBottom: espacio.s },
  texto: { color: colores.texto },
  // La fuente del texto, para que se pueda comprobar de dónde sale.
  fuente: { color: colores.textoSecundario },
  // Igual que la casilla de las condiciones de uso del préstamo de tablets.
  casilla: { paddingHorizontal: espacio.l, marginTop: espacio.xs },
  etiquetaCasilla: { color: colores.texto, textAlign: 'left' },
  // Con letra grande, los botones pasan a otra línea en vez de cortarse.
  acciones: { flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
