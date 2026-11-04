/**
 * Filtros de los indicadores (HU-26, CA1): periodo (desde y hasta) y chips de servicio, tipo de
 * usuario y programa. Va plegado para que los gráficos queden a la vista; cerrado, muestra el
 * resumen de lo elegido. No consulta datos: recibe las opciones y avisa los cambios.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text, TouchableRipple } from 'react-native-paper';

import { SelectorFecha } from '@/components/espacios/SelectorFecha';
import { ChipsFiltro } from '@/components/ui';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { FiltrosEstadisticas } from '@/types';
import { sumarMeses } from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';
import {
  hayFiltros,
  resumenFiltros,
  TODOS,
  type CampoFiltro,
  type OpcionesFiltros,
} from '@/utils/filtrosEstadisticas';

/** Hasta cuántos meses atrás se ofrece el calendario del periodo. */
const MESES_ATRAS = 12;

const FILAS: { campo: CampoFiltro; titulo: string; descripcion: string }[] = [
  { campo: 'servicio', titulo: 'Servicio', descripcion: 'Filtrar por servicio' },
  { campo: 'tipoUsuario', titulo: 'Tipo de usuario', descripcion: 'Filtrar por tipo de usuario' },
  { campo: 'programa', titulo: 'Programa', descripcion: 'Filtrar por programa' },
];

type Props = {
  filtros: FiltrosEstadisticas;
  onCambiar: (filtros: FiltrosEstadisticas) => void;
  opciones: OpcionesFiltros;
};

export function FiltrosIndicadores({ filtros, onCambiar, opciones }: Props) {
  const [abierto, setAbierto] = useState(false);
  const hoy = hoyISO();
  const resumen = resumenFiltros(filtros);
  const conFiltros = hayFiltros(filtros);

  const cambiar = (cambio: Partial<FiltrosEstadisticas>) => onCambiar({ ...filtros, ...cambio });

  const motivoDesde = (fecha: string) => {
    if (fecha > hoy) return 'Es una fecha futura.';
    if (filtros.hasta && fecha > filtros.hasta) return 'Es después de la fecha final.';
    return null;
  };
  const motivoHasta = (fecha: string) => {
    if (fecha > hoy) return 'Es una fecha futura.';
    if (filtros.desde && fecha < filtros.desde) return 'Es antes de la fecha inicial.';
    return null;
  };

  return (
    <View style={estilos.bloque}>
      <TouchableRipple
        onPress={() => setAbierto((actual) => !actual)}
        style={estilos.cabecera}
        borderless
        accessibilityRole="button"
        accessibilityLabel={`Filtros. ${resumen}`}
        accessibilityHint={abierto ? 'Oculta los filtros' : 'Muestra los filtros'}
        accessibilityState={{ expanded: abierto }}
      >
        <View style={estilos.filaCabecera}>
          <Icon source="filter-variant" size={22} color={colores.primario} />
          <View style={estilos.textosCabecera}>
            <Text variant="titleSmall" style={estilos.tituloCabecera}>
              Filtros
            </Text>
            <Text variant="bodySmall" style={estilos.resumen}>
              {resumen}
            </Text>
          </View>
          <Icon
            source={abierto ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colores.textoSecundario}
          />
        </View>
      </TouchableRipple>

      {abierto ? (
        <View style={estilos.contenido}>
          <View style={estilos.periodo}>
            <View>
              <SelectorFecha
                etiqueta="Desde"
                valor={filtros.desde ?? ''}
                onCambiar={(fecha) => cambiar({ desde: fecha || undefined })}
                motivoNoElegible={motivoDesde}
                mesMinimo={sumarMeses(hoy, -MESES_ATRAS)}
                mesMaximo={hoy}
                mesInicial={filtros.hasta ?? hoy}
                permiteQuitar
              />
            </View>
            <View>
              <SelectorFecha
                etiqueta="Hasta"
                valor={filtros.hasta ?? ''}
                onCambiar={(fecha) => cambiar({ hasta: fecha || undefined })}
                motivoNoElegible={motivoHasta}
                mesMinimo={sumarMeses(hoy, -MESES_ATRAS)}
                mesMaximo={hoy}
                mesInicial={filtros.desde ?? hoy}
                permiteQuitar
              />
            </View>
          </View>

          {FILAS.map(({ campo, titulo, descripcion }) => (
            <View key={campo} style={estilos.filaChips}>
              <Text variant="labelLarge" style={estilos.tituloFila}>
                {titulo}
              </Text>
              <ChipsFiltro
                opciones={opciones[campo]}
                valor={filtros[campo] ?? TODOS}
                // Los valores salen de los mismos registros, así que son del tipo del filtro.
                onCambiar={(valor) => cambiar({ [campo]: valor } as Partial<FiltrosEstadisticas>)}
                descripcion={descripcion}
              />
            </View>
          ))}

          {conFiltros ? (
            <Button
              mode="text"
              icon="filter-remove-outline"
              onPress={() => onCambiar({})}
              style={estilos.quitar}
              accessibilityLabel="Quitar todos los filtros"
            >
              Quitar filtros
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { borderRadius: radio.tarjeta, backgroundColor: colores.superficie, overflow: 'hidden' },
  cabecera: { paddingHorizontal: espacio.m, paddingVertical: espacio.m },
  filaCabecera: { flexDirection: 'row', alignItems: 'center', gap: espacio.m },
  textosCabecera: { flex: 1, gap: espacio.xs },
  tituloCabecera: { color: colores.texto, fontFamily: fuentes.seminegrita },
  resumen: { color: colores.textoSecundario },
  contenido: { gap: espacio.m, paddingHorizontal: espacio.m, paddingBottom: espacio.m },
  periodo: { gap: espacio.s },
  filaChips: { gap: espacio.xs },
  tituloFila: { color: colores.texto, fontFamily: fuentes.seminegrita },
  quitar: { alignSelf: 'flex-start' },
});
