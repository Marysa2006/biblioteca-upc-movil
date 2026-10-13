/**
 * Detalle de un servicio (HU-01).
 * Va fuera de las pestañas: se apila encima de Inicio con botón de atrás.
 * El encabezado se configura aquí con <Stack.Screen />, sin tocar el layout raíz.
 *
 * Inactivo o inexistente (404) se muestran igual, como "no disponible":
 * el mock responde 404 en los dos casos.
 */
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Icon, Text } from 'react-native-paper';

import { EstadoCarga, EstadoError, Pantalla } from '@/components/ui';
import { useServicio } from '@/hooks/useServicios';
import { acentoServicio, colores, espacio, fuentes, radio } from '@/theme';
import type { Servicio } from '@/types';
import { CATEGORIAS_SERVICIO } from '@/utils/servicios';

/** Opacidad del tinte del acento detrás del ícono de la categoría. */
const OPACIDAD_TINTE = 0.12;

export default function DetalleServicio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: servicio, isPending, isError, error, refetch } = useServicio(id ?? '');

  // Las pantallas no importan de src/api: se lee el código del error (ErrorApi.estado) sin la clase.
  const noExiste = isError && 'estado' in error && error.estado === 404;

  let contenido;
  if (isPending) {
    contenido = (
      <Pantalla titulo="Servicio" conEncabezado>
        <EstadoCarga mensaje="Cargando servicio…" />
      </Pantalla>
    );
  } else if (noExiste || (servicio && !servicio.activo)) {
    contenido = (
      <Pantalla titulo="Servicio" conEncabezado>
        <NoDisponible />
      </Pantalla>
    );
  } else if (isError || !servicio) {
    contenido = (
      <Pantalla titulo="Servicio" conEncabezado>
        <EstadoError mensaje="No pudimos cargar el servicio." onReintentar={() => refetch()} />
      </Pantalla>
    );
  } else {
    contenido = <Detalle servicio={servicio} />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Detalle del servicio',
          headerBackTitle: 'Inicio',
          headerStyle: { backgroundColor: colores.superficie },
          headerTintColor: colores.primario,
          headerTitleStyle: { fontFamily: fuentes.seminegrita, color: colores.texto },
        }}
      />
      {contenido}
    </>
  );
}

function Detalle({ servicio }: { servicio: Servicio }) {
  const { categoria } = servicio;
  const info = CATEGORIAS_SERVICIO[categoria];
  const acento = acentoServicio[categoria];

  return (
    <Pantalla titulo={servicio.nombre} conEncabezado>
      <View style={estilos.encabezado}>
        <View style={estilos.cuadroIcono}>
          <View style={[StyleSheet.absoluteFill, estilos.tinte, { backgroundColor: acento }]} />
          <Icon source={info.icono} size={28} color={acento} />
        </View>
        <View style={estilos.textosEncabezado}>
          <Text variant="labelLarge" style={{ color: acento }}>
            {info.nombre}
          </Text>
          {servicio.requiereCuenta ? (
            <View style={estilos.fila}>
              <Icon source="account-lock-outline" size={16} color={colores.textoSecundario} />
              <Text variant="bodySmall" style={estilos.textoSecundario}>
                Requiere cuenta institucional
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <Card mode="contained" style={estilos.tarjeta}>
        <Card.Content style={estilos.secciones}>
          <Seccion icono="text-box-outline" titulo="Descripción" texto={servicio.descripcion} />
          <Seccion icono="account-group-outline" titulo="Público objetivo" texto={servicio.publico} />
          <Seccion
            icono="clipboard-text-outline"
            titulo="Forma de solicitud"
            texto={servicio.formaSolicitud}
          />
          <Seccion icono="clock-outline" titulo="Horarios" texto={servicio.horario} />
        </Card.Content>
      </Card>
    </Pantalla>
  );
}

function Seccion({ icono, titulo, texto }: { icono: string; titulo: string; texto: string }) {
  return (
    <View style={estilos.seccion}>
      <View style={estilos.fila}>
        <Icon source={icono} size={20} color={colores.primario} />
        <Text variant="titleSmall" style={estilos.tituloSeccion} accessibilityRole="header">
          {titulo}
        </Text>
      </View>
      <Text variant="bodyMedium" style={estilos.texto}>
        {texto}
      </Text>
    </View>
  );
}

function NoDisponible() {
  const volver = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={estilos.noDisponible} accessibilityLiveRegion="polite">
      <Icon source="eye-off-outline" size={40} color={colores.textoSecundario} />
      <Text variant="bodyMedium" style={estilos.textoNoDisponible}>
        Este servicio no está disponible o no existe.
      </Text>
      <Button
        mode="outlined"
        onPress={volver}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Volver a Inicio"
      >
        Volver a Inicio
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacio.m },
  cuadroIcono: {
    padding: espacio.s,
    borderRadius: radio.boton,
    overflow: 'hidden',
  },
  tinte: { opacity: OPACIDAD_TINTE },
  textosEncabezado: { flex: 1, gap: espacio.xs },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  textoSecundario: { flex: 1, color: colores.textoSecundario },
  tarjeta: { backgroundColor: colores.superficie, borderRadius: radio.tarjeta },
  secciones: { gap: espacio.l },
  seccion: { gap: espacio.xs },
  tituloSeccion: { flex: 1, color: colores.texto, fontFamily: fuentes.seminegrita },
  texto: { color: colores.texto },
  noDisponible: {
    alignItems: 'center',
    gap: espacio.s,
    paddingVertical: espacio.xl,
  },
  textoNoDisponible: { color: colores.textoSecundario, textAlign: 'center' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
