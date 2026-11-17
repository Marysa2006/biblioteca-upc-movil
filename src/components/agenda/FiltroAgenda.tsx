/**
 * Filtro por estado de la agenda (HU-15), en reemplazo del cuadro de convenciones.
 * - BotonFiltroAgenda: un embudo que despliega Todas, Pendiente, Aprobada y Realizada, cada una
 *   con el ícono y el color de su estado, así el menú sirve también de leyenda. Con un filtro
 *   activo, el embudo se rellena y el lector dice cuál.
 * - ChipFiltroAgenda: con un filtro activo, un chip "Solo aprobadas ✕" que lo quita, para que
 *   el filtro siempre se vea. Sin filtro y con citas por aprobar, un chip "3 por aprobar" que
 *   filtra las pendientes (#217, CA2); con ese filtro, "Solo pendientes (3)".
 * El filtro se aplica a las tres vistas (Hoy, Semana y Mes) y no vuelve a consultar.
 */
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Chip, Icon, IconButton, Menu } from 'react-native-paper';

import { colores, coloresEstado, espacio, fuentes } from '@/theme';
import type { EstadoSolicitud } from '@/types';
import { ESTADOS_AGENDA, ICONO_ESTADO_AGENDA, nombreEstadoAgenda } from '@/utils/agenda';

type Props = {
  /** El estado por el que se filtra, o null para ver todas. */
  filtro: EstadoSolicitud | null;
  onCambiar: (filtro: EstadoSolicitud | null) => void;
};

/** Con esto el área táctil del embudo (40 px) pasa de 44 px. */
const AMPLIAR_TOQUE = espacio.xs;

export function BotonFiltroAgenda({ filtro, onCambiar }: Props) {
  const [abierto, setAbierto] = useState(false);

  const elegir = (estado: EstadoSolicitud | null) => {
    setAbierto(false);
    onCambiar(estado);
  };

  return (
    <Menu
      visible={abierto}
      onDismiss={() => setAbierto(false)}
      anchorPosition="bottom"
      contentStyle={estilos.menu}
      anchor={
        <IconButton
          icon={filtro ? 'filter' : 'filter-outline'}
          iconColor={colores.primario}
          onPress={() => setAbierto(true)}
          style={estilos.boton}
          hitSlop={AMPLIAR_TOQUE}
          accessibilityRole="button"
          accessibilityLabel={
            filtro
              ? `Filtrar por estado. Mostrando solo citas ${nombreEstadoAgenda(filtro, 2)}`
              : 'Filtrar por estado. Mostrando todas las citas'
          }
        />
      }
    >
      <Menu.Item
        title="Todas"
        leadingIcon="calendar-blank-outline"
        trailingIcon={filtro == null ? 'check' : undefined}
        onPress={() => elegir(null)}
        accessibilityState={{ selected: filtro == null }}
        accessibilityLabel="Todas las citas"
      />
      {ESTADOS_AGENDA.map((estado) => {
        const { texto, etiqueta } = coloresEstado[estado];
        return (
          <Menu.Item
            key={estado}
            title={etiqueta}
            leadingIcon={({ size }) => (
              <Icon
                source={ICONO_ESTADO_AGENDA[estado] ?? 'circle-small'}
                size={size}
                color={texto}
              />
            )}
            trailingIcon={filtro === estado ? 'check' : undefined}
            onPress={() => elegir(estado)}
            accessibilityState={{ selected: filtro === estado }}
            accessibilityLabel={`Solo citas ${nombreEstadoAgenda(estado, 2)}`}
          />
        );
      })}
    </Menu>
  );
}

export function ChipFiltroAgenda({
  filtro,
  onCambiar,
  pendientes = 0,
}: Props & { pendientes?: number }) {
  if (!filtro) {
    if (pendientes === 0) return null;
    const { fondo, texto } = coloresEstado.pendiente;
    const citas = pendientes === 1 ? '1 cita espera' : `${pendientes} citas esperan`;
    return (
      <Chip
        icon={({ size }) => (
          <Icon source={ICONO_ESTADO_AGENDA.pendiente ?? 'circle-small'} size={size} color={texto} />
        )}
        onPress={() => onCambiar('pendiente')}
        style={[estilos.chip, { backgroundColor: fondo }]}
        textStyle={[estilos.textoChip, { color: texto }]}
        accessibilityRole="button"
        accessibilityLabel={`${citas} tu aprobación. Ver solo las pendientes`}
      >
        {`${pendientes} por aprobar`}
      </Chip>
    );
  }
  const { fondo, texto } = coloresEstado[filtro];
  const nombre = nombreEstadoAgenda(filtro, 2);
  const conCantidad = filtro === 'pendiente' ? ` (${pendientes})` : '';

  return (
    <Chip
      icon={({ size }) => (
        <Icon source={ICONO_ESTADO_AGENDA[filtro] ?? 'circle-small'} size={size} color={texto} />
      )}
      onClose={() => onCambiar(null)}
      closeIconAccessibilityLabel="Quitar el filtro y ver todas las citas"
      style={[estilos.chip, { backgroundColor: fondo }]}
      textStyle={[estilos.textoChip, { color: texto }]}
      accessibilityLabel={`Mostrando solo citas ${nombre}${conCantidad}`}
    >
      {`Solo ${nombre}${conCantidad}`}
    </Chip>
  );
}

const estilos = StyleSheet.create({
  boton: { margin: 0 },
  menu: { backgroundColor: colores.superficie },
  chip: { alignSelf: 'flex-start' },
  textoChip: { fontFamily: fuentes.seminegrita },
});
