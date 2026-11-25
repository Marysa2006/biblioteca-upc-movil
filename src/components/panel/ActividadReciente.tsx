/**
 * «Por atender» del Dashboard (#306), la Actividad reciente del mockup: las solicitudes que esperan
 * la respuesta del personal, la más próxima primero, con chips por tipo (solo los tipos que hay).
 * Se ven las primeras 5; «Ver todo» lleva a Gestión. Cada tarjeta abre su detalle de siempre: el
 * Dashboard no aprueba ni rechaza, para no repetir esa lógica.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text, TouchableRipple } from 'react-native-paper';

import { ChipsFiltro, EstadoVacio } from '@/components/ui';
import { colores, espacio, fuentes, radio } from '@/theme';
import { fechaLegible } from '@/utils/fechas';
import { NOMBRE_TIPO_PENDIENTE, type Pendiente, type TipoPendiente } from '@/utils/panel';

/** Cuántas se ven en el Dashboard; el resto, en Gestión. */
const MAXIMO = 5;

const TODOS = 'todos';

const ICONO: Record<TipoPendiente, string> = {
  reserva: 'door-open',
  asesoria: 'account-voice',
  capacitacion: 'school-outline',
};

type Props = {
  pendientes: Pendiente[];
  onAbrir: (pendiente: Pendiente) => void;
  onVerTodo: () => void;
};

export function ActividadReciente({ pendientes, onAbrir, onVerTodo }: Props) {
  const [filtro, setFiltro] = useState<TipoPendiente | typeof TODOS>(TODOS);
  const tipos = (Object.keys(NOMBRE_TIPO_PENDIENTE) as TipoPendiente[]).filter((tipo) =>
    pendientes.some((pendiente) => pendiente.tipo === tipo),
  );
  // Si el tipo elegido ya no tiene pendientes (se atendieron), se vuelve a «Todos».
  const elegido = filtro === TODOS || tipos.includes(filtro) ? filtro : TODOS;
  const visibles = pendientes.filter(
    (pendiente) => elegido === TODOS || pendiente.tipo === elegido,
  );

  return (
    <View style={estilos.seccion}>
      <View style={estilos.encabezado}>
        <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
          Por atender
        </Text>
        {pendientes.length > 0 ? (
          <Button
            mode="text"
            onPress={onVerTodo}
            accessibilityLabel={`Ver las ${pendientes.length} solicitudes por atender en Gestión`}
          >
            Ver todo
          </Button>
        ) : null}
      </View>

      {pendientes.length === 0 ? (
        <EstadoVacio mensaje="No hay solicitudes por atender. ¡Todo al día!" />
      ) : (
        <>
          {tipos.length > 1 ? (
            <ChipsFiltro
              opciones={[
                { valor: TODOS, etiqueta: 'Todos', cantidad: pendientes.length },
                ...tipos.map((tipo) => ({
                  valor: tipo,
                  etiqueta: NOMBRE_TIPO_PENDIENTE[tipo],
                  cantidad: pendientes.filter((pendiente) => pendiente.tipo === tipo).length,
                })),
              ]}
              valor={elegido}
              onCambiar={(valor) => setFiltro(valor as TipoPendiente | typeof TODOS)}
              descripcion="Filtrar lo que hay por atender por tipo"
            />
          ) : null}
          {visibles.slice(0, MAXIMO).map((pendiente) => (
            <TarjetaPendiente
              key={`${pendiente.tipo}-${pendiente.id}`}
              pendiente={pendiente}
              onAbrir={() => onAbrir(pendiente)}
            />
          ))}
          {visibles.length > MAXIMO ? (
            <Text variant="bodySmall" style={estilos.resto}>
              {`Y ${visibles.length - MAXIMO} más en Gestión.`}
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
}

function TarjetaPendiente({ pendiente, onAbrir }: { pendiente: Pendiente; onAbrir: () => void }) {
  const tipo = NOMBRE_TIPO_PENDIENTE[pendiente.tipo];
  const cuando = `${fechaLegible(pendiente.fecha)}, ${pendiente.hora}`;
  return (
    <View style={estilos.tarjeta}>
      <TouchableRipple
        onPress={onAbrir}
        accessibilityRole="button"
        accessibilityLabel={`${tipo} pendiente: ${pendiente.titulo}. ${pendiente.persona}. ${cuando}. Abrir`}
      >
        <View style={estilos.contenido}>
          <View style={estilos.icono}>
            <Icon source={ICONO[pendiente.tipo]} size={20} color={colores.primario} />
          </View>
          <View style={estilos.textos}>
            <Text variant="labelMedium" style={estilos.tipo}>
              {`${tipo} · ${cuando}`}
            </Text>
            <Text variant="titleSmall" style={estilos.tituloTarjeta}>
              {pendiente.titulo}
            </Text>
            <Text variant="bodySmall" style={estilos.persona}>
              {pendiente.persona}
            </Text>
          </View>
          <Icon source="chevron-right" size={24} color={colores.textoSecundario} />
        </View>
      </TouchableRipple>
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: { gap: espacio.s },
  encabezado: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  resto: { color: colores.textoSecundario, textAlign: 'center' },
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  tarjeta: { borderRadius: radio.tarjeta, backgroundColor: colores.superficie, overflow: 'hidden' },
  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    padding: espacio.m,
    minHeight: 44,
  },
  icono: { padding: espacio.s, borderRadius: radio.boton, backgroundColor: colores.primarioSuave },
  textos: { flex: 1, gap: espacio.xs },
  tipo: { color: colores.textoSecundario, fontFamily: fuentes.seminegrita },
  tituloTarjeta: { color: colores.texto, fontFamily: fuentes.seminegrita },
  persona: { color: colores.textoSecundario },
});
