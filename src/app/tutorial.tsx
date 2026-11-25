/**
 * Tutorial con Upecito. Pantalla completa, fuera de las pestañas. Tiene dos recorridos:
 * - el de la comunidad (#261), por defecto;
 * - el del personal (#267), con ?vista=personal y una sesión del personal: sus pasos dependen
 *   de los permisos de la persona (pasosPersonal) y se marca como visto aparte.
 * - Lo abre AbrirTutorial la primera vez que se usa la app en el celular (CA1), después de la
 *   autorización de datos si hay una sesión que todavía no la aceptó.
 * - Se repite desde el menú de usuario → Ver tutorial (CA2).
 * - Terminar o saltar lo marca como visto en las preferencias del celular, sin tocar la sesión
 *   (CA3). El botón atrás de Android vuelve al paso anterior y, en el primero, cuenta como saltar.
 *
 * Cada paso tiene una banda oscura con la ilustración de la función y Upecito asomado (siempre
 * del mismo tamaño y sin voltear), y debajo el texto y dónde se encuentra en la app.
 * No usa datos de la API: los pasos están en src/components/tutorial/ (pasos.ts y
 * pasosPersonal.ts).
 */
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, BackHandler, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { IlustracionTutorial, UbicacionTutorial } from '@/components/tutorial/IlustracionTutorial';
import { PASOS_COMUNIDAD, type PasoTutorial } from '@/components/tutorial/pasos';
import { pasosPersonal } from '@/components/tutorial/pasosPersonal';
import { Pantalla, Upecito, useSubirAlInicio } from '@/components/ui';
import { usePreferencias } from '@/store/preferencias';
import { useSesion } from '@/store/sesion';
import { colores, espacio, fuentes, radio, tamanoLogo } from '@/theme';
import { NOMBRE_APP } from '@/utils/constantes';
import { esPersonal } from '@/utils/roles';

/** Lo que el borde de la banda le tapa a Upecito: las piernas. Así se ve asomado. */
const UPECITO_TAPADO = tamanoLogo.app * 1.5 * 0.3;

export default function Tutorial() {
  const { vista } = useLocalSearchParams<{ vista?: string }>();
  const usuario = useSesion((estado) => estado.usuario);
  // El del personal solo con una sesión del personal; si no, el de la comunidad.
  const delPersonal = vista === 'personal' && usuario != null && esPersonal(usuario);
  const pasos = delPersonal ? pasosPersonal(usuario) : PASOS_COMUNIDAD;

  const [elegido, setPaso] = useState(0);
  // Si los pasos cambian mientras está abierto (por ejemplo, al cerrar sesión), no se sale del rango.
  const paso = Math.min(elegido, pasos.length - 1);
  const marcarComunidad = usePreferencias((estado) => estado.marcarTutorialVisto);
  const marcarPersonal = usePreferencias((estado) => estado.marcarTutorialPersonalVisto);
  const marcarTutorialVisto = delPersonal ? marcarPersonal : marcarComunidad;
  const ultimo = paso === pasos.length - 1;

  const cerrar = () => {
    marcarTutorialVisto();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  // Android: atrás vuelve al paso anterior; en el primero se cierra como si se saltara.
  useFocusEffect(
    useCallback(() => {
      const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
        if (paso > 0) {
          setPaso(paso - 1);
          return true;
        }
        marcarTutorialVisto();
        return false;
      });
      return () => suscripcion.remove();
    }, [paso, marcarTutorialVisto]),
  );

  const saltar = (
    <View style={estilos.marca}>
      <Text variant="titleMedium" style={estilos.nombreApp}>
        {NOMBRE_APP}
      </Text>
      {ultimo ? null : (
        <Button
          mode="text"
          onPress={cerrar}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Saltar el tutorial"
        >
          Saltar
        </Button>
      )}
    </View>
  );

  const acciones = (
    <View style={estilos.acciones}>
      {paso > 0 ? (
        <Button
          mode="outlined"
          icon="arrow-left"
          onPress={() => setPaso(paso - 1)}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Paso anterior"
        >
          Atrás
        </Button>
      ) : null}
      <Button
        mode="contained"
        icon={ultimo ? 'check' : 'arrow-right'}
        onPress={ultimo ? cerrar : () => setPaso(paso + 1)}
        style={estilos.principal}
        contentStyle={[estilos.contenidoBoton, ultimo ? null : estilos.iconoDerecha]}
        accessibilityRole="button"
        accessibilityLabel={ultimo ? 'Empezar a usar la app' : 'Paso siguiente'}
      >
        {ultimo ? 'Empezar' : 'Siguiente'}
      </Button>
    </View>
  );

  return (
    <Pantalla
      titulo={delPersonal ? 'Conoce tu vista' : 'Conoce la app'}
      sinMenuUsuario
      marcaPropia={saltar}
      pie={acciones}
    >
      <Paso pasos={pasos} indice={paso} />
    </Pantalla>
  );
}

/** Un paso: la banda con la ilustración y Upecito, el indicador, el texto y dónde está. */
function Paso({ pasos, indice }: { pasos: readonly PasoTutorial[]; indice: number }) {
  const { pose, ilustracion, ubicacion, secciones, titulo, texto } = pasos[indice];
  const subirAlInicio = useSubirAlInicio();
  const indicador = `Paso ${indice + 1} de ${pasos.length}`;
  const portada = ilustracion === 'portada' || ilustracion === 'portadaPersonal';

  // Cada paso empieza arriba; en iOS se anuncia aquí (en Android lo hace accessibilityLiveRegion).
  useEffect(() => {
    subirAlInicio();
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(`${indicador}. ${titulo}. ${texto}`);
    }
  }, [subirAlInicio, indicador, titulo, texto]);

  return (
    <View style={estilos.paso}>
      {/* La banda es decorativa: el texto de abajo dice lo mismo. */}
      <View style={estilos.banda}>
        <IlustracionTutorial ilustracion={ilustracion} secciones={secciones} />
        <View style={[estilos.upecito, portada ? estilos.upecitoCentro : null]}>
          <Upecito pose={pose} tamano="tutorial" />
        </View>
      </View>

      <View style={estilos.cabecera}>
        <Text variant="labelLarge" style={estilos.indicador}>
          {indicador}
        </Text>
        {/* Los puntos son decorativos: el indicador en texto dice lo mismo. */}
        <View
          style={estilos.puntos}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          {pasos.map((_, i) => (
            <View key={i} style={[estilos.punto, i === indice ? estilos.puntoActual : null]} />
          ))}
        </View>
      </View>

      <View style={estilos.textos} accessibilityLiveRegion="polite">
        <Text variant="headlineSmall" style={estilos.titulo} accessibilityRole="header">
          {titulo}
        </Text>
        <Text variant="bodyLarge" style={estilos.texto}>
          {texto}
        </Text>
      </View>

      {ubicacion ? <UbicacionTutorial ubicacion={ubicacion} /> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.s,
  },
  nombreApp: { flex: 1, color: colores.primario, fontFamily: fuentes.negrita },
  paso: { gap: espacio.m, paddingTop: espacio.s },
  // Bloque oscuro tipo mockup; Upecito se asoma desde su borde de abajo.
  banda: {
    gap: espacio.m,
    paddingTop: espacio.m,
    paddingHorizontal: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioOscuro,
    overflow: 'hidden',
  },
  upecito: { alignSelf: 'flex-end', marginBottom: -UPECITO_TAPADO },
  upecitoCentro: { alignSelf: 'center' },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.s,
  },
  indicador: { color: colores.textoSecundario },
  puntos: { flexDirection: 'row', gap: espacio.xs },
  punto: {
    width: espacio.s,
    height: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.borde,
  },
  puntoActual: { width: espacio.l, backgroundColor: colores.primario },
  textos: { gap: espacio.s },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  texto: { color: colores.texto },
  // Con letra grande, Siguiente pasa debajo de Atrás en vez de cortarse.
  acciones: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: espacio.s },
  principal: { flexGrow: 1 },
  contenidoBoton: { paddingVertical: espacio.xs },
  // La flecha de Siguiente va a la derecha del texto, hacia donde avanza.
  iconoDerecha: { flexDirection: 'row-reverse' },
});
