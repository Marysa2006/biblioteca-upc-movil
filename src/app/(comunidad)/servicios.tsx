/**
 * Servicios de la biblioteca (HU-01): servicios activos agrupados por categoría,
 * con chips para filtrar y "deslizar hacia abajo para recargar".
 *
 * El filtro vive en la URL (/servicios?categoria=espacios): así Inicio puede abrir
 * esta pestaña con una categoría elegida. Un valor desconocido equivale a "Todos".
 *
 * Patrón de datos: useServicios() (src/hooks) → obtenerServicios() (src/api) → mock o API.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import { IconoCategoria } from '@/components/servicios/IconoCategoria';
import { TarjetaServicio } from '@/components/servicios/TarjetaServicio';
import { EstadoCarga, EstadoError, EstadoVacio, Pantalla } from '@/components/ui';
import { useServicios } from '@/hooks/useServicios';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { CategoriaServicio } from '@/types';
import { agruparServiciosActivos, CATEGORIAS_SERVICIO, type GrupoServicios } from '@/utils/servicios';

type Filtro = CategoriaServicio | 'todos';

/** Lleva el chip a 48 px de área táctil sin cambiar su tamaño visible. */
const AREA_CHIP = { top: espacio.s, bottom: espacio.s };

export default function Servicios() {
  const { categoria } = useLocalSearchParams<{ categoria?: string }>();
  const { data: servicios, isPending, isError, isRefetching, refetch } = useServicios();

  const cambiarFiltro = (filtro: Filtro) =>
    router.setParams({ categoria: filtro === 'todos' ? undefined : filtro });

  let contenido;
  if (isPending) {
    contenido = <EstadoCarga mensaje="Cargando servicios…" />;
  } else if (isError) {
    contenido = <EstadoError onReintentar={() => refetch()} />;
  } else {
    const grupos = agruparServiciosActivos(servicios);
    if (grupos.length === 0) {
      contenido = <EstadoVacio mensaje="Todavía no hay servicios publicados." />;
    } else {
      // Categoría desconocida o sin servicios (por ejemplo, tras recargar): "Todos".
      const elegido = grupos.find((g) => g.categoria === categoria);
      const filtro: Filtro = elegido ? elegido.categoria : 'todos';
      const visibles = elegido ? [elegido] : grupos;
      const presentacion = elegido ? CATEGORIAS_SERVICIO[elegido.categoria].presentacion : undefined;

      contenido = (
        <>
          <ChipsFiltro grupos={grupos} filtro={filtro} onCambiar={cambiarFiltro} />
          {elegido && presentacion ? (
            <Presentacion categoria={elegido.categoria} texto={presentacion} />
          ) : null}
          {visibles.map((grupo) => (
            <SeccionCategoria key={grupo.categoria} grupo={grupo} />
          ))}
        </>
      );
    }
  }

  return (
    <Pantalla
      titulo="Servicios"
      subtitulo="Servicios de la biblioteca: público, horarios y forma de solicitud"
      recarga={{ recargando: isRefetching, onRecargar: () => refetch() }}
    >
      {contenido}
    </Pantalla>
  );
}

type PropsChips = {
  grupos: GrupoServicios[];
  filtro: Filtro;
  onCambiar: (filtro: Filtro) => void;
};

function ChipsFiltro({ grupos, filtro, onCambiar }: PropsChips) {
  const total = grupos.reduce((suma, g) => suma + g.servicios.length, 0);
  const opciones = [
    { valor: 'todos' as Filtro, nombre: 'Todos', icono: 'view-grid-outline', cantidad: total },
    ...grupos.map((g) => ({
      valor: g.categoria as Filtro,
      nombre: CATEGORIAS_SERVICIO[g.categoria].nombre,
      icono: CATEGORIAS_SERVICIO[g.categoria].icono,
      cantidad: g.servicios.length,
    })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={estilos.chips}
      accessibilityLabel="Filtrar servicios por categoría"
    >
      {opciones.map((opcion) => {
        const elegido = opcion.valor === filtro;
        return (
          <Chip
            key={opcion.valor}
            icon={opcion.icono}
            selected={elegido}
            onPress={() => onCambiar(opcion.valor)}
            style={elegido ? estilos.chipElegido : estilos.chip}
            selectedColor={elegido ? colores.superficie : colores.primarioOscuro}
            textStyle={estilos.textoChip}
            hitSlop={AREA_CHIP}
            accessibilityRole="button"
            accessibilityState={{ selected: elegido }}
            accessibilityLabel={`${opcion.nombre}, ${opcion.cantidad} ${
              opcion.cantidad === 1 ? 'servicio' : 'servicios'
            }`}
          >
            {`${opcion.nombre} (${opcion.cantidad})`}
          </Chip>
        );
      })}
    </ScrollView>
  );
}

/** Texto que encabeza las opciones de una categoría con varios servicios (por ejemplo, Préstamo de libros). */
function Presentacion({ categoria, texto }: { categoria: CategoriaServicio; texto: string }) {
  return (
    <View style={estilos.presentacion}>
      <IconoCategoria categoria={categoria} tamano={24} />
      <Text variant="bodyMedium" style={estilos.textoPresentacion}>
        {texto}
      </Text>
    </View>
  );
}

function SeccionCategoria({ grupo }: { grupo: GrupoServicios }) {
  return (
    <View style={estilos.seccion}>
      <Text variant="titleMedium" style={estilos.tituloSeccion} accessibilityRole="header">
        {CATEGORIAS_SERVICIO[grupo.categoria].nombre}
      </Text>
      {grupo.servicios.map((servicio) => (
        <TarjetaServicio
          key={servicio.id}
          servicio={servicio}
          onPress={() => router.push({ pathname: '/servicio/[id]', params: { id: servicio.id } })}
        />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  chips: { gap: espacio.s, paddingVertical: espacio.xs },
  chip: { backgroundColor: colores.primarioSuave },
  chipElegido: { backgroundColor: colores.primarioOscuro },
  textoChip: { fontFamily: fuentes.seminegrita },
  seccion: { gap: espacio.s },
  tituloSeccion: { color: colores.texto, fontFamily: fuentes.negrita },
  presentacion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioSuave,
  },
  textoPresentacion: { flex: 1, color: colores.texto },
});
