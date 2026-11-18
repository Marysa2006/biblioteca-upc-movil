/**
 * Ilustraciones del tutorial (#261), hechas con piezas de la app y el tema:
 * - IlustracionTutorial: lo que se dibuja en la banda oscura de cada paso. En la comunidad
 *   (#261): servicios, catálogo, solicitudes, el menú o la portada. En el personal (#267): las
 *   secciones de Gestión que la persona tiene, Personal, Inventario, Estadísticas, el menú o la
 *   portada. Es decorativa: el texto del paso dice lo mismo.
 * - UbicacionTutorial: dónde está eso en la app. El texto ("Lo encuentras en…") se lee; la
 *   barra de pestañas (de la comunidad o del personal) o el encabezado en miniatura son
 *   decorativos.
 * Los datos de las tarjetas son de ejemplo y no salen de la API.
 */
import { StyleSheet, View } from 'react-native';
import { Badge, Icon, Text } from 'react-native-paper';

import { EtiquetaEstado, Upecito } from '@/components/ui';
import { acentoServicio, colores, espacio, fondoServicio, fuentes, radio } from '@/theme';
import type { CategoriaServicio, EstadoSolicitud } from '@/types';
import { NOMBRE_APP } from '@/utils/constantes';
import type { InfoSeccionGestion, ValorSeccionGestion } from '@/utils/gestion';
import { CATEGORIAS_SERVICIO } from '@/utils/servicios';

import type { IlustracionPaso, PestanaComunidad, PestanaPersonal, UbicacionPaso } from './pasos';

const TAMANO_ICONO = 20;

/** Lo decorativo no llega al lector de pantalla. */
const DECORATIVO = {
  accessible: false,
  importantForAccessibility: 'no-hide-descendants',
  accessibilityElementsHidden: true,
} as const;

type PropsIlustracion = {
  ilustracion: IlustracionPaso;
  /** Solo en el paso de Gestión: las secciones que la persona tiene. */
  secciones?: readonly InfoSeccionGestion[];
};

export function IlustracionTutorial({ ilustracion, secciones = [] }: PropsIlustracion) {
  return (
    <View style={estilos.ilustracion} {...DECORATIVO}>
      {ilustracion === 'portada' ? <Portada /> : null}
      {ilustracion === 'servicios' ? <Servicios /> : null}
      {ilustracion === 'catalogo' ? <Catalogo /> : null}
      {ilustracion === 'solicitudes' ? <Solicitudes /> : null}
      {ilustracion === 'menu' ? <Menu /> : null}
      {ilustracion === 'portadaPersonal' ? (
        <Portada subtitulo="Vista del personal de la biblioteca" />
      ) : null}
      {ilustracion === 'gestion' ? <Gestion secciones={secciones} /> : null}
      {ilustracion === 'equipo' ? <Equipo /> : null}
      {ilustracion === 'inventario' ? <Inventario /> : null}
      {ilustracion === 'estadisticas' ? <Estadisticas /> : null}
      {ilustracion === 'menuPersonal' ? <MenuPersonal /> : null}
    </View>
  );
}

function Portada({
  subtitulo = 'Biblioteca de la Universidad Popular del Cesar',
}: {
  subtitulo?: string;
}) {
  return (
    <View style={estilos.portada}>
      <Text variant="headlineMedium" style={estilos.nombreApp}>
        {NOMBRE_APP}
      </Text>
      <Text variant="bodyLarge" style={estilos.textoClaro}>
        {subtitulo}
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

// ── Personal (#267) ─────────────────────────────────────────────

/** Ícono y una línea de cada sección de Gestión, para la banda del tutorial. */
const SECCION_ILUSTRADA: Record<ValorSeccionGestion, { icono: string; linea: string }> = {
  solicitudes: {
    icono: 'clipboard-check-outline',
    linea: 'Aprobar, rechazar o proponer otra fecha',
  },
  agenda: { icono: 'calendar-clock', linea: 'Tus asesorías por día, semana y mes' },
  prestamos: { icono: 'tablet', linea: 'Entregar y recibir tablets' },
  vencidos: { icono: 'clock-alert-outline', linea: 'Las tablets que no se devolvieron a tiempo' },
  espacios: { icono: 'office-building-outline', linea: 'Crear espacios y bloquearlos' },
  portal: { icono: 'web', linea: 'Avisos, servicios y parámetros' },
};

/** Las secciones de Gestión que la persona tiene, cada una con su línea. */
function Gestion({ secciones }: { secciones: readonly InfoSeccionGestion[] }) {
  return (
    <View style={estilos.lista}>
      {secciones.map(({ valor, etiqueta }) => (
        <View key={valor} style={estilos.fila}>
          <View style={[estilos.cuadroIcono, estilos.cuadroPrimario]}>
            <Icon
              source={SECCION_ILUSTRADA[valor].icono}
              size={TAMANO_ICONO}
              color={colores.primario}
            />
          </View>
          <View style={estilos.textosFila}>
            <Text variant="titleSmall" style={estilos.textoFila} numberOfLines={1}>
              {etiqueta}
            </Text>
            <Text variant="bodySmall" style={estilos.secundario} numberOfLines={2}>
              {SECCION_ILUSTRADA[valor].linea}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Una persona del personal con sus roles, como en la pestaña Personal. Datos de ejemplo. */
function Equipo() {
  const roles = [
    { nombre: 'Facilitador', activo: true },
    { nombre: 'Gestor de espacios', activo: false },
  ];
  return (
    <View style={estilos.tarjetaSolicitud}>
      <View style={estilos.filaSinFondo}>
        <View style={estilos.iniciales}>
          <Text variant="labelLarge" style={estilos.textoIniciales}>
            JM
          </Text>
        </View>
        <Text variant="titleSmall" style={estilos.textoFila} numberOfLines={1}>
          Julián Mendoza
        </Text>
      </View>
      <View style={estilos.chips}>
        {roles.map(({ nombre, activo }) => (
          <View key={nombre} style={[estilos.chip, activo ? estilos.chipActivo : null]}>
            <Icon
              source={activo ? 'check' : 'plus'}
              size={14}
              color={activo ? colores.primario : colores.textoSecundario}
            />
            <Text
              variant="labelMedium"
              style={activo ? estilos.textoChipActivo : estilos.secundario}
              numberOfLines={1}
            >
              {nombre}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Los tres contadores de tablets de Inventario. Las cifras son de ejemplo. */
function Inventario() {
  const contadores = [
    { cantidad: 8, titulo: 'Disponibles' },
    { cantidad: 3, titulo: 'En préstamo' },
    { cantidad: 1, titulo: 'Mantenimiento' },
  ];
  return (
    <View style={estilos.contadores}>
      {contadores.map(({ cantidad, titulo }) => (
        <View key={titulo} style={estilos.contador}>
          <Text variant="headlineSmall" style={estilos.cifra}>
            {cantidad}
          </Text>
          <Text
            variant="labelSmall"
            style={estilos.secundario}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {titulo}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Barras por servicio, cada una con su número, y el botón de exportar. Cifras de ejemplo. */
function Estadisticas() {
  const barras = [
    { titulo: 'Asesorías', cantidad: 12 },
    { titulo: 'Espacios', cantidad: 9 },
    { titulo: 'Tablets', cantidad: 6 },
  ];
  const maximo = Math.max(...barras.map((barra) => barra.cantidad));
  return (
    <View style={estilos.tarjetaSolicitud}>
      {barras.map(({ titulo, cantidad }) => (
        <View key={titulo} style={estilos.filaBarra}>
          <Text variant="labelMedium" style={estilos.etiquetaBarra} numberOfLines={1}>
            {titulo}
          </Text>
          <View style={estilos.carril}>
            <View style={[estilos.barra, { width: `${(cantidad / maximo) * 100}%` }]} />
          </View>
          <Text variant="labelMedium" style={estilos.cifraBarra}>
            {cantidad}
          </Text>
        </View>
      ))}
      <View style={estilos.marca}>
        <Icon source="file-delimited-outline" size={14} color={colores.primario} />
        <Text variant="labelSmall" style={estilos.textoMarca}>
          Exportar CSV
        </Text>
      </View>
    </View>
  );
}

/** El menú de usuario del personal, con el cambio a la vista de la comunidad. */
function MenuPersonal() {
  const opciones = [
    { icono: 'home-variant-outline', titulo: 'Ver la vista de la comunidad' },
    { icono: 'account-circle-outline', titulo: 'Perfil' },
    { icono: 'bell-outline', titulo: 'Notificaciones', avisos: 2 },
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
            <Text variant="bodyMedium" style={estilos.textoFila} numberOfLines={2}>
              {titulo}
            </Text>
            {avisos ? <Badge size={espacio.m + espacio.xs}>{avisos}</Badge> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

type InfoPestana = { pestana: PestanaComunidad | PestanaPersonal; icono: string; titulo: string };

/** Las pestañas de la comunidad: los mismos íconos y nombres de (comunidad)/_layout.tsx. */
const PESTANAS_COMUNIDAD: InfoPestana[] = [
  { pestana: 'inicio', icono: 'home-variant-outline', titulo: 'Inicio' },
  { pestana: 'servicios', icono: 'room-service-outline', titulo: 'Servicios' },
  { pestana: 'catalogo', icono: 'book-search-outline', titulo: 'Catálogo' },
  { pestana: 'solicitudes', icono: 'clipboard-text-outline', titulo: 'Mis solicitudes' },
];

/** Las pestañas del personal: los mismos íconos y nombres de (personal)/_layout.tsx. */
const PESTANAS_PERSONAL: InfoPestana[] = [
  { pestana: 'panel', icono: 'view-dashboard-outline', titulo: 'Dashboard' },
  { pestana: 'gestion', icono: 'clipboard-text-outline', titulo: 'Gestión' },
  { pestana: 'equipo', icono: 'account-group-outline', titulo: 'Personal' },
  { pestana: 'inventario', icono: 'archive-outline', titulo: 'Inventario' },
  { pestana: 'estadisticas', icono: 'chart-bar', titulo: 'Estadísticas' },
];

export function UbicacionTutorial({ ubicacion }: { ubicacion: UbicacionPaso }) {
  const pestanas =
    ubicacion.tipo === 'pestana' && ubicacion.vista === 'personal'
      ? PESTANAS_PERSONAL
      : PESTANAS_COMUNIDAD;
  const texto =
    ubicacion.tipo === 'menu'
      ? 'Lo encuentras arriba a la derecha de cada pantalla.'
      : `Lo encuentras en la pestaña ${pestanas.find((p) => p.pestana === ubicacion.pestana)?.titulo}, abajo.`;

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
          {pestanas.map(({ pestana, icono, titulo }) => {
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
  // Personal (#267)
  cuadroPrimario: { backgroundColor: colores.primarioSuave },
  textosFila: { flex: 1, gap: espacio.xs / 2 },
  secundario: { color: colores.textoSecundario },
  iniciales: {
    width: espacio.xl,
    height: espacio.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: espacio.xl / 2,
    backgroundColor: colores.primarioOscuro,
  },
  textoIniciales: { color: colores.superficie, fontFamily: fuentes.negrita },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs / 2,
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs / 2,
    borderRadius: radio.boton,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  chipActivo: { borderColor: colores.primarioSuave, backgroundColor: colores.primarioSuave },
  textoChipActivo: { color: colores.primario, fontFamily: fuentes.seminegrita },
  contadores: { flexDirection: 'row', gap: espacio.s },
  contador: {
    flex: 1,
    alignItems: 'center',
    gap: espacio.xs / 2,
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.superficie,
  },
  cifra: { color: colores.texto, fontFamily: fuentes.negrita },
  filaBarra: { flexDirection: 'row', alignItems: 'center', gap: espacio.s, alignSelf: 'stretch' },
  etiquetaBarra: { width: '30%', color: colores.textoSecundario },
  carril: {
    flex: 1,
    height: espacio.s + espacio.xs,
    borderRadius: radio.boton,
    backgroundColor: colores.superficieVariante,
  },
  barra: { height: '100%', borderRadius: radio.boton, backgroundColor: colores.primario },
  cifraBarra: { color: colores.texto, fontFamily: fuentes.seminegrita },
  textoPestana: { fontFamily: fuentes.seminegrita },
});
