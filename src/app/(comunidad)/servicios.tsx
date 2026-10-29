/**
 * Servicios de la biblioteca (HU-01): servicios activos agrupados por categoría,
 * y "deslizar hacia abajo para recargar".
 *
 * La categoría puede venir en la URL (/servicios?categoria=prestamo): así Inicio abre
 * solo las opciones de una categoría, con "Ver todos los servicios".
 * Un valor desconocido muestra todas.
 *
 * Patrón de datos: useServicios() (src/hooks) → obtenerServicios() (src/api) → mock o API.
 * Arriba va el acceso a las guías sin conexión (HU-29), fuera de la lista para que se abra
 * aunque los servicios no carguen por falta de internet.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { AccesoGuias } from '@/components/guias/AccesoGuias';
import { IconoCategoria } from '@/components/servicios/IconoCategoria';
import { TarjetaServicio } from '@/components/servicios/TarjetaServicio';
import { EstadoCarga, EstadoError, EstadoVacio, Pantalla } from '@/components/ui';
import { useServicios } from '@/hooks/useServicios';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { CategoriaServicio } from '@/types';
import { agruparServiciosActivos, CATEGORIAS_SERVICIO, type GrupoServicios } from '@/utils/servicios';

export default function Servicios() {
  const { categoria } = useLocalSearchParams<{ categoria?: string }>();
  const { data: servicios, isPending, isError, isRefetching, refetch } = useServicios();

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
      // Categoría desconocida o sin servicios (por ejemplo, tras recargar): todas.
      const elegido = grupos.find((g) => g.categoria === categoria);
      const visibles = elegido ? [elegido] : grupos;
      const presentacion = elegido ? CATEGORIAS_SERVICIO[elegido.categoria].presentacion : undefined;

      contenido = (
        <>
          {elegido && presentacion ? (
            <Presentacion categoria={elegido.categoria} texto={presentacion} />
          ) : null}
          {visibles.map((grupo) => (
            <SeccionCategoria key={grupo.categoria} grupo={grupo} />
          ))}
          {elegido ? (
            <Button
              mode="outlined"
              onPress={() => router.setParams({ categoria: undefined })}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel="Ver todos los servicios"
            >
              Ver todos los servicios
            </Button>
          ) : null}
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
      <AccesoGuias />
      {contenido}
    </Pantalla>
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
  contenidoBoton: { paddingVertical: espacio.xs },
});
