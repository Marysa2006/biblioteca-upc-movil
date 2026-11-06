/**
 * Bandeja de solicitudes de capacitación del personal (HU-12), en Gestión → Solicitudes →
 * Capacitaciones (permiso `formacion`). Es la misma disposición de BandejaReservas: arriba, un
 * buscador por persona, línea o grupo; debajo, chips por estado con su cantidad.
 * Cada tarjeta abre el detalle (capacitaciones/[id]), donde se aprueba, se rechaza, se propone
 * otra fecha, se asigna el responsable y se cierra.
 *
 * Patrón de datos: useSolicitudesCapacitacion() (src/hooks) → src/api/capacitaciones.ts → mock o API.
 * Se refresca sola con cada mutación: todas cuelgan de ['capacitaciones', 'solicitudes'].
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Searchbar } from 'react-native-paper';

import {
  ChipsFiltro,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  ListaPaginada,
  type OpcionFiltro,
} from '@/components/ui';
import { useSolicitudesCapacitacion } from '@/hooks/useCapacitaciones';
import { colores, coloresEstado, espacio } from '@/theme';
import type { EstadoSolicitud } from '@/types';
import { buscarCapacitaciones } from '@/utils/capacitaciones';
import { ORDEN_ESTADOS } from '@/utils/reservas';

import { TarjetaSolicitudCapacitacion } from './TarjetaSolicitudCapacitacion';

type Filtro = EstadoSolicitud | 'todas';

export function BandejaCapacitaciones() {
  const { data: solicitudes, isPending, isError, refetch } = useSolicitudesCapacitacion('todas');
  const [filtroElegido, setFiltroElegido] = useState<Filtro | null>(null);
  const [busqueda, setBusqueda] = useState('');

  let contenido;
  if (isPending) {
    contenido = <EstadoCarga mensaje="Cargando solicitudes…" />;
  } else if (isError) {
    contenido = (
      <EstadoError mensaje="No pudimos cargar las solicitudes." onReintentar={() => refetch()} />
    );
  } else {
    const encontradas = buscarCapacitaciones(solicitudes, busqueda);
    const hay = (estado: EstadoSolicitud) => solicitudes.some((s) => s.estado === estado);
    const cantidad = (estado: EstadoSolicitud) =>
      encontradas.filter((s) => s.estado === estado).length;
    // Como en reservas: los chips son los estados que tienen solicitudes y la búsqueda solo
    // cambia los números, así no aparecen ni desaparecen mientras se escribe.
    const opciones: OpcionFiltro<Filtro>[] = [
      { valor: 'todas', etiqueta: 'Todas', cantidad: encontradas.length },
      ...ORDEN_ESTADOS.filter(hay).map((estado) => ({
        valor: estado,
        etiqueta: coloresEstado[estado].etiqueta,
        cantidad: cantidad(estado),
      })),
    ];
    // Empieza en Pendiente; si el estado elegido se queda sin solicitudes, vuelve a "Todas".
    const inicial: Filtro = hay('pendiente') ? 'pendiente' : 'todas';
    const filtro =
      filtroElegido && opciones.some((o) => o.valor === filtroElegido) ? filtroElegido : inicial;
    const visibles =
      filtro === 'todas' ? encontradas : encontradas.filter((s) => s.estado === filtro);

    let mensajeVacio = 'Todavía no hay solicitudes de capacitación.';
    if (busqueda.trim()) mensajeVacio = `Ninguna solicitud coincide con «${busqueda.trim()}».`;
    else if (filtro !== 'todas')
      mensajeVacio = `No hay solicitudes en estado «${coloresEstado[filtro].etiqueta}».`;

    contenido = (
      <>
        {solicitudes.length > 0 ? (
          <ChipsFiltro
            opciones={opciones}
            valor={filtro}
            onCambiar={setFiltroElegido}
            descripcion="Filtrar las solicitudes por estado"
          />
        ) : null}
        {visibles.length === 0 ? (
          <EstadoVacio mensaje={mensajeVacio} />
        ) : (
          // 10 por página (#161); el filtro o la búsqueda vuelven a la página 1.
          <ListaPaginada elementos={visibles} reinicio={`${filtro}|${busqueda.trim()}`}>
            {(solicitud) => (
              <TarjetaSolicitudCapacitacion
                key={solicitud.id}
                solicitud={solicitud}
                onAbrir={({ id }) =>
                  router.push({ pathname: '/capacitaciones/[id]', params: { id } })
                }
              />
            )}
          </ListaPaginada>
        )}
      </>
    );
  }

  return (
    <View style={estilos.bandeja}>
      <Searchbar
        placeholder="Buscar por persona, línea o grupo"
        value={busqueda}
        onChangeText={setBusqueda}
        style={estilos.buscador}
        accessibilityLabel="Buscar solicitudes de capacitación por persona, línea o grupo"
      />
      {contenido}
    </View>
  );
}

const estilos = StyleSheet.create({
  bandeja: { gap: espacio.s },
  buscador: { backgroundColor: colores.superficie },
});
