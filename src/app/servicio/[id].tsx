/**
 * Detalle de un servicio (HU-01).
 * Va fuera de las pestañas: se apila encima de Servicios con botón de atrás.
 * El encabezado se configura aquí con <Stack.Screen />, sin tocar el layout raíz.
 *
 * Inactivo o inexistente (404) se muestran igual, como "no disponible":
 * el mock responde 404 en los dos casos.
 */
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Icon, Text } from 'react-native-paper';

import { IconoCategoria } from '@/components/servicios/IconoCategoria';
import { EstadoCarga, EstadoError, Pantalla } from '@/components/ui';
import { useServicio } from '@/hooks/useServicios';
import { colores, espacio, fondoServicio, fuentes, radio } from '@/theme';
import type { Servicio } from '@/types';
import { CATEGORIAS_SERVICIO } from '@/utils/servicios';

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
          // Se llega desde Servicios o por enlace: solo la flecha, sin el nombre de la pantalla anterior.
          headerBackButtonDisplayMode: 'minimal',
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

  return (
    <Pantalla titulo={servicio.nombre} conEncabezado>
      <View style={[estilos.encabezado, { backgroundColor: fondoServicio[categoria] }]}>
        <IconoCategoria categoria={categoria} />
        <View style={estilos.textosEncabezado}>
          <Text variant="labelLarge" style={estilos.categoria}>
            {CATEGORIAS_SERVICIO[categoria].nombre}
          </Text>
          {servicio.requiereCuenta ? (
            <Text variant="bodySmall" style={estilos.textoSecundario}>
              Requiere cuenta institucional
            </Text>
          ) : null}
        </View>
      </View>

      <Card mode="contained" style={estilos.tarjeta}>
        <Card.Content style={estilos.secciones}>
          <Seccion titulo="Descripción" texto={servicio.descripcion} />
          <Seccion titulo="Público objetivo" texto={servicio.publico} />
          <Seccion titulo="Forma de solicitud" texto={servicio.formaSolicitud} />
          <Seccion titulo="Horarios" texto={servicio.horario} />
        </Card.Content>
      </Card>

      {/* HU-17: la disponibilidad de los espacios se consulta sin cuenta. */}
      {categoria === 'espacios' ? (
        <Button
          mode="contained"
          icon="calendar-month-outline"
          onPress={() => router.push('/espacios')}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Ver la disponibilidad de los espacios"
        >
          Ver disponibilidad
        </Button>
      ) : null}

      {/* HU-14: los temas se consultan sin cuenta; la sesión se pide al confirmar la cita. */}
      {categoria === 'asesorias' ? (
        <>
          <Button
            mode="contained"
            icon="calendar-account-outline"
            onPress={() => router.push('/asesorias')}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel="Agendar una asesoría"
          >
            Agendar asesoría
          </Button>
          <Button
            mode="outlined"
            icon="calendar-check-outline"
            onPress={() => router.push('/asesorias/mis-citas')}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel="Ver mis citas de asesoría"
          >
            Mis citas
          </Button>
        </>
      ) : null}

      {/* HU-22: pide cuenta; sin sesión, la pantalla solo invita a iniciarla. */}
      {categoria === 'tablets' ? (
        <Button
          mode="contained"
          icon="tablet"
          onPress={() => router.push('/tablets/solicitar')}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Solicitar el préstamo de una tablet"
        >
          Solicitar tablet
        </Button>
      ) : null}
    </Pantalla>
  );
}

function Seccion({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <View style={estilos.seccion}>
      <Text variant="titleSmall" style={estilos.tituloSeccion} accessibilityRole="header">
        {titulo}
      </Text>
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
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
  },
  textosEncabezado: { flex: 1, gap: espacio.xs },
  textoSecundario: { color: colores.textoSecundario },
  // Sobre el fondo de la categoría, su nombre va en color de texto (el acento bajaría del AA).
  categoria: { color: colores.texto, fontFamily: fuentes.seminegrita },
  tarjeta: { backgroundColor: colores.superficie, borderRadius: radio.tarjeta },
  secciones: { gap: espacio.l },
  seccion: { gap: espacio.xs },
  tituloSeccion: { color: colores.texto, fontFamily: fuentes.seminegrita },
  texto: { color: colores.texto },
  noDisponible: {
    alignItems: 'center',
    gap: espacio.s,
    paddingVertical: espacio.xl,
  },
  textoNoDisponible: { color: colores.textoSecundario, textAlign: 'center' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
