/**
 * Inicio de la comunidad (HU-01): portada pública con las categorías de servicio.
 * Sin sesión (visitantes y egresados) muestra la bienvenida y la invitación a iniciar sesión;
 * con sesión, el saludo. Muestra las categorías destacadas (el resto, en "Ver todos"): cada
 * una abre el detalle de su servicio o, si tiene varios, sus opciones en la pestaña Servicios.
 *
 * Patrón de datos: useServicios() (src/hooks) → obtenerServicios() (src/api) → mock o API.
 * Contempla los tres estados: cargando, error y vacío.
 */
import { router } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Card, Icon, Text } from 'react-native-paper';

import { TarjetaCategoria } from '@/components/servicios/TarjetaCategoria';
import { EstadoCarga, EstadoError, EstadoVacio, Pantalla } from '@/components/ui';
import { useServicios } from '@/hooks/useServicios';
import { useSesion } from '@/store/sesion';
import { colores, espacio, fuentes, radio } from '@/theme';
import {
  agruparServiciosActivos,
  CATEGORIAS_INICIO,
  type GrupoServicios,
} from '@/utils/servicios';

/** Desde este ancho (tablets) la cuadrícula pasa a 3 columnas. */
const ANCHO_TABLET = 600;
/** Con la letra ampliada por encima de este factor, la cuadrícula pasa a 1 columna. */
const ESCALA_LETRA_GRANDE = 1.3;

export default function Inicio() {
  const usuario = useSesion((estado) => estado.usuario);
  const { data: servicios, isPending, isError, isRefetching, refetch } = useServicios();

  let contenido;
  if (isPending) {
    contenido = <EstadoCarga mensaje="Cargando servicios…" />;
  } else if (isError) {
    contenido = <EstadoError onReintentar={() => refetch()} />;
  } else {
    const grupos = agruparServiciosActivos(servicios);
    contenido =
      grupos.length === 0 ? (
        <EstadoVacio mensaje="Todavía no hay servicios publicados." />
      ) : (
        <CuadriculaCategorias grupos={destacadas(grupos)} />
      );
  }

  return (
    <Pantalla
      titulo={usuario ? `Hola, ${usuario.nombre.split(' ')[0]}` : '¡Bienvenido!'}
      subtitulo={
        usuario
          ? 'Servicios de la biblioteca'
          : 'Consulta servicios, horarios y el catálogo de la biblioteca, abiertos a la comunidad upecista y a visitantes.'
      }
      recarga={{ recargando: isRefetching, onRecargar: () => refetch() }}
    >
      {usuario ? null : (
        <>
          <EtiquetaAccesoPublico />
          <InvitacionSesion />
        </>
      )}
      <View style={estilos.encabezadoSeccion}>
        <Icon source="room-service-outline" size={24} color={colores.primario} />
        <Text variant="titleMedium" style={estilos.tituloSeccion} accessibilityRole="header">
          Servicios ofertados
        </Text>
        <Button
          mode="text"
          icon="chevron-right"
          contentStyle={estilos.botonVerTodos}
          onPress={() => router.navigate('/servicios')}
          accessibilityRole="button"
          accessibilityLabel="Ver todos los servicios"
        >
          Ver todos
        </Button>
      </View>
      {contenido}
    </Pantalla>
  );
}

function EtiquetaAccesoPublico() {
  return (
    <View style={estilos.etiqueta}>
      <View style={estilos.punto} />
      <Text variant="labelMedium" style={estilos.textoEtiqueta}>
        Acceso público y visitantes
      </Text>
    </View>
  );
}

function InvitacionSesion() {
  return (
    <Card mode="contained" style={estilos.invitacion}>
      <Card.Content style={estilos.contenidoInvitacion}>
        <View style={estilos.filaInvitacion}>
          <View style={estilos.cuadroIcono}>
            <Icon source="school-outline" size={24} color={colores.primario} />
          </View>
          <View style={estilos.textosInvitacion}>
            <Text variant="titleMedium" style={estilos.tituloInvitacion}>
              ¿Perteneces a la UPC?
            </Text>
            <Text variant="bodyMedium" style={estilos.textoSecundario}>
              Inicia sesión con tus credenciales institucionales para reservar cubículos, solicitar
              tablets y agendar asesorías especializadas.
            </Text>
          </View>
        </View>
        <Button
          mode="contained"
          icon="login"
          onPress={() => router.push('/login')}
          contentStyle={estilos.botonSesion}
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión institucional"
        >
          Iniciar sesión institucional
        </Button>
      </Card.Content>
    </Card>
  );
}

/**
 * Las categorías destacadas que tienen servicios activos, en su orden. Si ninguna tiene,
 * las primeras con servicios, para que Inicio no quede vacío habiendo servicios.
 */
function destacadas(grupos: GrupoServicios[]): GrupoServicios[] {
  const elegidas = CATEGORIAS_INICIO.flatMap((categoria) =>
    grupos.filter((grupo) => grupo.categoria === categoria),
  );
  return elegidas.length > 0 ? elegidas : grupos.slice(0, CATEGORIAS_INICIO.length);
}

/** Con un solo servicio activo abre su detalle; con varios, sus opciones en Servicios. */
function abrirCategoria({ categoria, servicios }: GrupoServicios) {
  if (servicios.length === 1) {
    router.push({ pathname: '/servicio/[id]', params: { id: servicios[0].id } });
  } else {
    router.navigate({ pathname: '/servicios', params: { categoria } });
  }
}

function CuadriculaCategorias({ grupos }: { grupos: GrupoServicios[] }) {
  const { width, fontScale } = useWindowDimensions();
  const columnas = fontScale > ESCALA_LETRA_GRANDE ? 1 : width >= ANCHO_TABLET ? 3 : 2;

  // Filas de igual número de celdas: la última se completa con espacios vacíos
  // para que todas las tarjetas tengan el mismo ancho.
  const filas: (GrupoServicios | null)[][] = [];
  for (let i = 0; i < grupos.length; i += columnas) {
    const fila: (GrupoServicios | null)[] = grupos.slice(i, i + columnas);
    while (fila.length < columnas) fila.push(null);
    filas.push(fila);
  }

  return (
    <View style={estilos.cuadricula}>
      {filas.map((fila, indice) => (
        <View key={indice} style={estilos.fila}>
          {fila.map((grupo, columna) =>
            grupo ? (
              <TarjetaCategoria
                key={grupo.categoria}
                categoria={grupo.categoria}
                cantidad={grupo.servicios.length}
                onPress={() => abrirCategoria(grupo)}
              />
            ) : (
              <View key={`vacio-${columna}`} style={estilos.celdaVacia} />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: espacio.s,
    paddingVertical: espacio.xs,
    paddingHorizontal: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.verdeClaroUpc,
  },
  punto: {
    width: espacio.s,
    aspectRatio: 1,
    borderRadius: espacio.xs,
    backgroundColor: colores.primarioOscuro,
  },
  textoEtiqueta: { color: colores.texto },
  invitacion: {
    backgroundColor: colores.superficie,
    borderRadius: radio.tarjeta,
    borderLeftWidth: 4,
    borderLeftColor: colores.primarioOscuro,
  },
  contenidoInvitacion: { gap: espacio.m },
  filaInvitacion: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.m },
  cuadroIcono: {
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  textosInvitacion: { flex: 1, gap: espacio.xs },
  tituloInvitacion: { color: colores.texto, fontFamily: fuentes.negrita },
  textoSecundario: { color: colores.textoSecundario },
  botonSesion: { paddingVertical: espacio.xs },
  encabezadoSeccion: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  tituloSeccion: { flex: 1, color: colores.texto, fontFamily: fuentes.negrita },
  botonVerTodos: { flexDirection: 'row-reverse', paddingVertical: espacio.xs },
  cuadricula: { gap: espacio.m },
  fila: { flexDirection: 'row', gap: espacio.m },
  celdaVacia: { flex: 1 },
});
