/**
 * Ilustraciones del tutorial (#261), hechas con piezas de la app y el tema:
 * - IlustracionTutorial: lo que se dibuja en la banda oscura de cada paso (servicios, catálogo,
 *   solicitudes, el menú o la portada). Es decorativa: el texto del paso dice lo mismo.
 * - UbicacionTutorial: dónde está eso en la app. El texto ("Lo encuentras en…") se lee; la
 *   barra de pestañas o el encabezado en miniatura son decorativos.
 * Los datos de las tarjetas son de ejemplo y no salen de la API.
 */
import { StyleSheet, View } from 'react-native';
import { Badge, Icon, Text } from 'react-native-paper';

import { EtiquetaEstado, Upecito } from '@/components/ui';
import { acentoServicio, colores, espacio, fondoServicio, fuentes, radio } from '@/theme';
import type { CategoriaServicio, EstadoSolicitud } from '@/types';
import { NOMBRE_APP } from '@/utils/constantes';
import { CATEGORIAS_SERVICIO } from '@/utils/servicios';

import type { IlustracionPaso, PestanaComunidad, UbicacionPaso } from './pasos';

const TAMANO_ICONO = 20;

/** Lo decorativo no llega al lector de pantalla. */
const DECORATIVO = {
  accessible: false,
  importantForAccessibility: 'no-hide-descendants',
  accessibilityElementsHidden: true,
} as const;

export function IlustracionTutorial({ ilustracion }: { ilustracion: IlustracionPaso }) {
  return (
    <View style={estilos.ilustracion} {...DECORATIVO}>
      {ilustracion === 'portada' ? <Portada /> : null}
      {ilustracion === 'servicios' ? <Servicios /> : null}
      {ilustracion === 'catalogo' ? <Catalogo /> : null}
      {ilustracion === 'solicitudes' ? <Solicitudes /> : null}
      {ilustracion === 'menu' ? <Menu /> : null}
    </View>
  );
}

function Portada() {
  return (
    <View style={estilos.portada}>
      <Text variant="headlineMedium" style={estilos.nombreApp}>
        {NOMBRE_APP}
      </Text>
      <Text variant="bodyLarge" style={estilos.textoClaro}>
        Biblioteca de la Universidad Popular del Cesar
      </Text>
    </View>
  );
}

/** Tres categorías con su ícono y su color, como en Inicio y en Servicios. */
function Servicios() {
  const categorias: CategoriaServicio[] = ['asesorias', 'espacios', 'tablets'];
  return (
    <View style={estilos.lista}>
      {categorias.map((categoria) => (
        <View key={categoria} style={estilos.fila}>
          <View style={[estilos.cuadroIcono, { backgroundColor: fondoServicio[categoria] }]}>
            <Icon
              source={CATEGORIAS_SERVICIO[categoria].icono}
              size={TAMANO_ICONO}
              color={acentoServicio[categoria]}
            />
          </View>
          <Text variant="titleSmall" style={estilos.textoFila} numberOfLines={1}>
            {CATEGORIAS_SERVICIO[categoria].nombre}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Las cuatro fuentes de la pestaña Catálogo, con la marca de las guías sin conexión. */
function Catalogo() {
  const fuentesCatalogo = [
    { icono: 'bookshelf', titulo: 'Catálogo de la biblioteca' },
    { icono: 'school-outline', titulo: 'Repositorio institucional' },
    { icono: 'database-outline', titulo: 'Bibliotecas en línea' },
    { icono: 'book-open-page-variant-outline', titulo: 'Guías', sinConexion: true },
  ];
  return (
    <View style={estilos.lista}>
      {fuentesCatalogo.map(({ icono, titulo, sinConexion }) => (
        <View key={titulo} style={estilos.fila}>
          <Icon source={icono} size={TAMANO_ICONO} color={colores.primario} />
          <Text variant="titleSmall" style={estilos.textoFila} numberOfLines={1}>
            {titulo}
          </Text>
          {sinConexion ? (
            <View style={estilos.marca}>
              <Icon source="cloud-off-outline" size={14} color={colores.primario} />
              <Text variant="labelSmall" style={estilos.textoMarca}>
                Sin conexión
              </Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/** Dos solicitudes de ejemplo, con el tipo y su estado, como en Mis solicitudes. */
function Solicitudes() {
  const solicitudes: { categoria: CategoriaServicio; titulo: string; estado: EstadoSolicitud }[] = [
    { categoria: 'asesorias', titulo: 'Asesoría · Normas APA', estado: 'pendiente' },
    { categoria: 'espacios', titulo: 'Sala de estudio grupal', estado: 'aprobada' },
  ];
  return (
    <View style={estilos.lista}>
      {solicitudes.map(({ categoria, titulo, estado }) => (
        <View key={titulo} style={estilos.tarjetaSolicitud}>
          <View style={estilos.filaSinFondo}>
            <View style={[estilos.cuadroIcono, { backgroundColor: fondoServicio[categoria] }]}>
              <Icon
                source={CATEGORIAS_SERVICIO[categoria].icono}
                size={TAMANO_ICONO}
                color={acentoServicio[categoria]}
              />
            </View>
            <Text variant="titleSmall" style={estilos.textoFila} numberOfLines={1}>
              {titulo}
            </Text>
          </View>
          <EtiquetaEstado estado={estado} />
        </View>
      ))}
    </View>
  );
}

/** El menú de usuario abierto, colgando del botón de arriba a la derecha. */
function Menu() {
  const opciones = [
    { icono: 'login', titulo: 'Iniciar sesión' },
    { icono: 'bell-outline', titulo: 'Notificaciones', avisos: 2 },
    { icono: 'calendar-month-outline', titulo: 'Mi calendario' },
    { icono: 'help-circle-outline', titulo: 'Ver tutorial' },
  ];
  return (
    <View style={estilos.menu}>
      <View style={estilos.botonMenu}>
        <Icon source="account-outline" size={TAMANO_ICONO} color={colores.superficie} />
      </View>
      <View style={estilos.listaMenu}>
        {opciones.map(({ icono, titulo, avisos }) => (
          <View key={titulo} style={estilos.filaSinFondo}>
            <Icon source={icono} size={TAMANO_ICONO} color={colores.textoSecundario} />
            <Text variant="bodyMedium" style={estilos.textoFila} numberOfLines={1}>
              {titulo}
            </Text>
            {avisos ? <Badge size={espacio.m + espacio.xs}>{avisos}</Badge> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

/** Las pestañas de la comunidad: los mismos íconos y nombres de (comunidad)/_layout.tsx. */
const PESTANAS: { pestana: PestanaComunidad; icono: string; titulo: string }[] = [
  { pestana: 'inicio', icono: 'home-variant-outline', titulo: 'Inicio' },
  { pestana: 'servicios', icono: 'room-service-outline', titulo: 'Servicios' },
  { pestana: 'catalogo', icono: 'book-search-outline', titulo: 'Catálogo' },
  { pestana: 'solicitudes', icono: 'clipboard-text-outline', titulo: 'Mis solicitudes' },
];

export function UbicacionTutorial({ ubicacion }: { ubicacion: UbicacionPaso }) {
  const texto =
    ubicacion.tipo === 'menu'
      ? 'Lo encuentras arriba a la derecha de cada pantalla.'
      : `Lo encuentras en la pestaña ${PESTANAS.find((p) => p.pestana === ubicacion.pestana)?.titulo}, abajo.`;

  return (
    <View style={estilos.ubicacion}>
      <View style={estilos.filaUbicacion}>
        <Icon source="map-marker-outline" size={TAMANO_ICONO} color={colores.primario} />
        <Text variant="bodyMedium" style={estilos.textoUbicacion}>
          {texto}
        </Text>
      </View>

      {ubicacion.tipo === 'menu' ? (
        // El encabezado en miniatura, con el botón del menú resaltado.
        <View style={estilos.miniatura} {...DECORATIVO}>
          <View style={estilos.filaSinFondo}>
            <Upecito tamano="encabezado" />
            <Text variant="titleSmall" style={estilos.nombreMiniatura} numberOfLines={1}>
              {NOMBRE_APP}
            </Text>
          </View>
          <View style={estilos.resaltado}>
            <View style={estilos.botonMenu}>
              <Icon source="account-outline" size={TAMANO_ICONO} color={colores.superficie} />
            </View>
          </View>
        </View>
      ) : (
        // La barra de pestañas en miniatura, con la pestaña del paso resaltada.
        <View style={[estilos.miniatura, estilos.miniaturaPestanas]} {...DECORATIVO}>
          {PESTANAS.map(({ pestana, icono, titulo }) => {
            const activa = pestana === ubicacion.pestana;
            const color = activa ? colores.primario : colores.textoSecundario;
            return (
              <View key={pestana} style={[estilos.pestana, activa ? estilos.pestanaActiva : null]}>
                <Icon source={icono} size={TAMANO_ICONO} color={color} />
                <Text
                  variant="labelSmall"
                  style={[estilos.textoPestana, { color }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {titulo}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  ilustracion: { alignSelf: 'stretch' },
  portada: { gap: espacio.xs, paddingVertical: espacio.s },
  nombreApp: { color: colores.superficie, fontFamily: fuentes.negrita },
  textoClaro: { color: colores.superficie },
  lista: { gap: espacio.s },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.superficie,
  },
  filaSinFondo: { flexDirection: 'row', alignItems: 'center', gap: espacio.s, flexShrink: 1 },
  cuadroIcono: { padding: espacio.xs + espacio.xs / 2, borderRadius: radio.boton },
  textoFila: { flexShrink: 1, flexGrow: 1, color: colores.texto, fontFamily: fuentes.seminegrita },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs / 2,
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs / 2,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  textoMarca: { color: colores.primario, fontFamily: fuentes.seminegrita },
  tarjetaSolicitud: {
    gap: espacio.s,
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.superficie,
    alignItems: 'flex-start',
  },
  menu: { alignItems: 'flex-end', gap: espacio.xs },
  botonMenu: {
    padding: espacio.s,
    borderRadius: radio.tarjeta * 2,
    backgroundColor: colores.primario,
  },
  listaMenu: {
    alignSelf: 'stretch',
    gap: espacio.m,
    padding: espacio.m,
    marginLeft: espacio.xl,
    borderRadius: radio.boton,
    backgroundColor: colores.superficie,
  },
  ubicacion: { gap: espacio.s },
  filaUbicacion: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  textoUbicacion: { flex: 1, color: colores.texto },
  miniatura: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.s,
    padding: espacio.s,
    borderRadius: radio.boton,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  miniaturaPestanas: { gap: espacio.xs, paddingHorizontal: espacio.xs },
  nombreMiniatura: { color: colores.primario, fontFamily: fuentes.negrita, flexShrink: 1 },
  resaltado: {
    padding: espacio.xs / 2,
    borderRadius: radio.tarjeta * 2,
    borderWidth: 2,
    borderColor: colores.primario,
  },
  pestana: {
    flex: 1,
    alignItems: 'center',
    gap: espacio.xs / 2,
    paddingVertical: espacio.xs,
    borderRadius: radio.boton,
  },
  pestanaActiva: { backgroundColor: colores.primarioSuave },
  textoPestana: { fontFamily: fuentes.seminegrita },
});
