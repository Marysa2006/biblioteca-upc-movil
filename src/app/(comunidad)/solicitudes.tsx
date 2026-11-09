/**
 * Mis solicitudes (HU-08): las reservas, citas, préstamos y capacitaciones del usuario en una
 * sola lista, la más reciente primero.
 * - CA1: cada tarjeta dice el tipo, qué se pidió, cuándo y su estado. Pestañas En curso ·
 *   Finalizadas · Todas (con cantidad; En curso con alerta si hay una nueva fecha propuesta) y
 *   chips por tipo, solo de los tipos que la persona tiene.
 * - CA2: cada tarjeta abre su detalle con el historial (solicitudes/[tipo]/[id]).
 * - CA3: sin solicitudes, un mensaje y el acceso a Servicios. Sin sesión, invita a iniciarla.
 * Los préstamos de tablet llegan como "Aprobada" mientras siguen en curso: la tarjeta aclara su
 * estado real con useMisPrestamos().
 *
 * Patrón de datos: useMisSolicitudes() / useMisPrestamos() (src/hooks) → src/api → mock o API.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';

import { InvitarSesion } from '@/components/reservas/InvitarSesion';
import { TarjetaMiSolicitud } from '@/components/solicitudes/TarjetaMiSolicitud';
import {
  ChipsFiltro,
  ListaPaginada,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
  PestanasFiltro,
  type OpcionFiltro,
  type OpcionPestana,
} from '@/components/ui';
import { useRol } from '@/hooks/useRol';
import { useMisSolicitudes, type ResumenSolicitud } from '@/hooks/useSolicitudes';
import { useMisPrestamos } from '@/hooks/useTablets';
import { espacio } from '@/theme';
import type { Prestamo } from '@/types';
import {
  enGrupo,
  filtrarSolicitudes,
  GRUPOS_SOLICITUDES,
  notaDePrestamo,
  ORDEN_TIPOS,
  TIPOS_SOLICITUD,
  type FiltroTipo,
  type GrupoSolicitudes,
} from '@/utils/solicitudes';

const VACIO_POR_GRUPO: Record<GrupoSolicitudes, string> = {
  en_curso: 'No tienes solicitudes en curso.',
  finalizadas: 'Todavía no tienes solicitudes finalizadas.',
  todas: 'No hay solicitudes con este filtro.',
};

export default function MisSolicitudes() {
  const { usuario } = useRol();
  // Sin sesión, los dos hooks no consultan.
  const solicitudes = useMisSolicitudes();
  // Opcional: si falla, las tarjetas de préstamo solo pierden la línea de su estado real.
  const prestamos = useMisPrestamos();

  const recargar = () => {
    solicitudes.refetch();
    prestamos.refetch();
  };

  return (
    <Pantalla
      titulo="Mis solicitudes"
      subtitulo="Estado e historial de tus trámites"
      recarga={usuario ? { recargando: solicitudes.isRefetching, onRecargar: recargar } : undefined}
    >
      {usuario ? (
        <ListaSolicitudes solicitudes={solicitudes} prestamos={prestamos.data} />
      ) : (
        <InvitarSesion
          mensaje="Inicia sesión con tu cuenta institucional para ver el estado de tus solicitudes."
          etiqueta="Iniciar sesión para ver mis solicitudes"
        />
      )}
    </Pantalla>
  );
}

/** Se monta solo con sesión. */
function ListaSolicitudes({
  solicitudes,
  prestamos,
}: {
  solicitudes: ReturnType<typeof useMisSolicitudes>;
  prestamos?: Prestamo[];
}) {
  const [grupo, setGrupo] = useState<GrupoSolicitudes>('en_curso');
  const [tipo, setTipo] = useState<FiltroTipo>('todos');

  if (solicitudes.isPending) {
    return <EstadoCarga mensaje="Cargando tus solicitudes…" />;
  }
  if (solicitudes.isError) {
    return (
      <EstadoError
        mensaje="No pudimos cargar tus solicitudes."
        onReintentar={() => solicitudes.refetch()}
      />
    );
  }

  const todas = solicitudes.data;
  if (todas.length === 0) {
    return (
      <View style={estilos.vacio}>
        <EstadoVacio mensaje="Todavía no tienes solicitudes. Cuando reserves un espacio, agendes una asesoría, pidas una tablet o una capacitación, las verás aquí." />
        <Button
          mode="contained"
          icon="view-grid-outline"
          onPress={() => router.navigate('/servicios')}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Ver los servicios de la biblioteca"
        >
          Ver servicios
        </Button>
      </View>
    );
  }

  const pestanas: OpcionPestana<GrupoSolicitudes>[] = GRUPOS_SOLICITUDES.map((opcion) => ({
    ...opcion,
    cantidad: todas.filter((solicitud) => enGrupo(solicitud, opcion.valor)).length,
    // Una nueva fecha propuesta espera la respuesta de la persona.
    alerta:
      opcion.valor === 'en_curso' && todas.some((solicitud) => solicitud.estado === 'nueva_fecha'),
  }));

  const enPestana = todas.filter((solicitud) => enGrupo(solicitud, grupo));
  const tiposPresentes = ORDEN_TIPOS.filter((valor) => todas.some((s) => s.tipo === valor));
  const chips: OpcionFiltro<FiltroTipo>[] = [
    { valor: 'todos', etiqueta: 'Todos', cantidad: enPestana.length },
    ...tiposPresentes.map((valor) => ({
      valor,
      etiqueta: TIPOS_SOLICITUD[valor].plural,
      cantidad: enPestana.filter((solicitud) => solicitud.tipo === valor).length,
    })),
  ];

  const visibles = filtrarSolicitudes(todas, grupo, tipo);
  const prestamoPorId = new Map((prestamos ?? []).map((prestamo) => [prestamo.id, prestamo]));

  const abrir = (solicitud: ResumenSolicitud) =>
    router.push({
      pathname: '/solicitudes/[tipo]/[id]',
      params: { tipo: solicitud.tipo, id: solicitud.id },
    });

  return (
    <View style={estilos.lista}>
      <PestanasFiltro
        opciones={pestanas}
        valor={grupo}
        onCambiar={setGrupo}
        descripcion="Filtrar mis solicitudes por estado"
      />
      {/* Con un solo tipo, los chips no filtran nada. */}
      {tiposPresentes.length > 1 ? (
        <ChipsFiltro
          opciones={chips}
          valor={tipo}
          onCambiar={setTipo}
          descripcion="Filtrar mis solicitudes por tipo"
        />
      ) : null}

      {visibles.length === 0 ? (
        <EstadoVacio mensaje={VACIO_POR_GRUPO[grupo]} />
      ) : (
        // 10 por página (#161); la pestaña o el tipo vuelven a la página 1.
        <ListaPaginada elementos={visibles} reinicio={`${grupo}|${tipo}`}>
          {(solicitud) => {
            const prestamo =
              solicitud.tipo === 'prestamo' ? prestamoPorId.get(solicitud.id) : undefined;
            return (
              <TarjetaMiSolicitud
                key={`${solicitud.tipo}-${solicitud.id}`}
                solicitud={solicitud}
                nota={prestamo ? notaDePrestamo(prestamo) : null}
                onAbrir={abrir}
              />
            );
          }}
        </ListaPaginada>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espacio.m },
  vacio: { gap: espacio.m },
  contenidoBoton: { paddingVertical: espacio.xs },
});
