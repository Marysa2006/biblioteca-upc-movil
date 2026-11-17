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
 * El texto legal no es nuestro: es el Acuerdo 019 del 5 de octubre de 2020 de la UPC, que
 * desarrolla la Ley 1581 de 2012. Aquí se resume y se enlaza; no se redacta ni se interpreta.
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
import { CORREO_DATOS_PERSONALES, VERSION_POLITICA_DATOS } from '@/utils/constantes';
import { aceptoPoliticaVigente } from '@/utils/privacidad';

import { EnlacePoliticaDatos } from './EnlacePoliticaDatos';

const MENSAJE_AL_SALIR =
  'Cerramos tu sesión. Sin la autorización no podemos tratar tus datos personales, pero puedes seguir explorando la app sin cuenta.';

export function AceptacionTratamientoDatos() {
  const usuario = useSesion((estado) => estado.usuario);
  const hidratada = useSesion((estado) => estado.hidratada);
  const aceptaciones = useSesion((estado) => estado.aceptaciones);
  const aceptar = useSesion((estado) => estado.aceptarTratamientoDatos);
  const cerrarSesion = useCerrarSesion();
  // El texto se desplaza dentro del diálogo: en un celular bajo o con letra grande, ocupa menos.
  const { height } = useWindowDimensions();
  const altoTexto = Math.max(160, Math.min(380, Math.round(height * 0.42)));

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
            <Dialog.Title style={estilos.titulo}>Tratamiento de datos personales</Dialog.Title>
            <Dialog.ScrollArea style={[estilos.area, { maxHeight: altoTexto }]}>
              <ScrollView contentContainerStyle={estilos.contenido}>
                <Text variant="bodyMedium" style={estilos.texto}>
                  La Universidad Popular del Cesar es la responsable del tratamiento de tus datos
                  personales. Su política es el Acuerdo 019 del 5 de octubre de 2020, que desarrolla
                  la Ley 1581 de 2012.
                </Text>
                <Text variant="bodyMedium" style={estilos.texto}>
                  Esta app maneja tu nombre, correo institucional, tipo de usuario y programa, y los
                  datos que escribas al pedir un servicio, como el teléfono de contacto. Se usan
                  para prestarte los servicios de la biblioteca y cumplir las obligaciones de la
                  Universidad, dentro de las finalidades de la política.
                </Text>
                <Text variant="bodyMedium" style={estilos.texto}>
                  {`Puedes conocer, actualizar, rectificar o pedir la supresión de tus datos, y revocar esta autorización, escribiendo a ${CORREO_DATOS_PERSONALES}.`}
                </Text>
                <EnlacePoliticaDatos nota="Lee la política completa antes de aceptar:" />
                <Checkbox.Item
                  label="He leído y acepto la autorización para el tratamiento de mis datos personales del Acuerdo 019 de 2020."
                  status={aceptada ? 'checked' : 'unchecked'}
                  onPress={alternarCasilla}
                  position="leading"
                  style={estilos.casilla}
                  labelStyle={estilos.etiquetaCasilla}
                  accessibilityLabel="Acepto la autorización para el tratamiento de mis datos personales"
                />
              </ScrollView>
            </Dialog.ScrollArea>
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
  casilla: { paddingHorizontal: 0, marginTop: espacio.xs },
  etiquetaCasilla: { color: colores.texto },
  // Con letra grande, los botones pasan a otra línea en vez de cortarse.
  acciones: { flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
