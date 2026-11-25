/**
 * Panel de filtros de Estadísticas (HU-26, CA1; #260 y #307). Lo abre «Filtros» de
 * BarraEstadisticas y vale para todas las pestañas, también Registros.
 * - El periodo: las dos fechas en una fila y tres atajos (Este mes, Este semestre y Todo), para no
 *   abrir los dos calendarios en lo más común.
 * - Servicio, tipo de usuario, programa, facultad, sede y periodo académico en listas
 *   desplegables (#307): con chips, las listas largas (programas, facultades) quedaban cortadas.
 *   Cada opción dice cuántas operaciones tiene, como antes.
 * No consulta datos: recibe las opciones y avisa los cambios.
 */
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';

import { SelectorFecha } from '@/components/espacios/SelectorFecha';
import { CampoDesplegable } from '@/components/ui';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { FiltrosEstadisticas } from '@/types';
import { sumarMeses } from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';
import {
  CAMPOS_FILTRO,
  fechasDePeriodoRapido,
  hayFiltros,
  periodoRapidoDe,
  TITULO_FILTRO,
  TODOS,
  type OpcionesFiltros,
  type PeriodoRapido,
} from '@/utils/filtrosEstadisticas';

/** Hasta cuántos meses atrás se ofrece el calendario del periodo. */
const MESES_ATRAS = 12;

const ATAJOS: { valor: PeriodoRapido; etiqueta: string }[] = [
  { valor: 'mes', etiqueta: 'Este mes' },
  { valor: 'semestre', etiqueta: 'Este semestre' },
  { valor: 'todo', etiqueta: 'Todo' },
];

/** Lleva el chip a 48 px de área táctil sin cambiar su tamaño visible. */
const AREA_CHIP = { top: espacio.s, bottom: espacio.s };

type Props = {
  filtros: FiltrosEstadisticas;
  onCambiar: (filtros: FiltrosEstadisticas) => void;
  opciones: OpcionesFiltros;
};

export function FiltrosIndicadores({ filtros, onCambiar, opciones }: Props) {
  const hoy = hoyISO();
  const atajo = periodoRapidoDe(filtros, hoy);
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
    <View style={estilos.panel}>
      <View style={estilos.encabezado}>
        <Text variant="titleSmall" style={estilos.titulo} accessibilityRole="header">
          Filtros
        </Text>
        {hayFiltros(filtros) ? (
          <Button
            mode="text"
            icon="filter-remove-outline"
            onPress={() => onCambiar({})}
            accessibilityLabel="Quitar todos los filtros"
          >
            Limpiar
          </Button>
        ) : null}
      </View>

      <Text variant="labelLarge" style={estilos.etiqueta}>
        Periodo
      </Text>
      <View
        style={estilos.atajos}
        accessibilityRole="radiogroup"
        accessibilityLabel="Periodo rápido"
      >
        {ATAJOS.map(({ valor, etiqueta }) => {
          const elegido = atajo === valor;
          return (
            <Chip
              key={valor}
              selected={elegido}
              showSelectedCheck={false}
              onPress={() => cambiar(fechasDePeriodoRapido(valor, hoy))}
              style={elegido ? estilos.chipElegido : estilos.chip}
              selectedColor={elegido ? colores.superficie : colores.primarioOscuro}
              textStyle={elegido ? estilos.textoChipElegido : estilos.textoChip}
              hitSlop={AREA_CHIP}
              accessibilityRole="radio"
              accessibilityState={{ checked: elegido }}
              accessibilityLabel={`Periodo: ${etiqueta}`}
            >
              {etiqueta}
            </Chip>
          );
        })}
      </View>

      {/* Las dos fechas en una fila; con letra grande, la segunda baja de línea. */}
      <View style={estilos.fechas}>
        <View style={estilos.fecha}>
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
        <View style={estilos.fecha}>
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

      {CAMPOS_FILTRO.map((campo) => {
        const lista = opciones[campo];
        const etiquetas = new Map(
          lista.map((opcion) => [opcion.valor, `${opcion.etiqueta} (${opcion.cantidad})`]),
        );
        return (
          <CampoDesplegable
            key={campo}
            etiqueta={TITULO_FILTRO[campo]}
            nombre={TITULO_FILTRO[campo]}
            opciones={lista.map((opcion) => opcion.valor)}
            valor={filtros[campo] ?? TODOS}
            etiquetaDe={(valor) => etiquetas.get(valor) ?? valor}
            // Los valores salen de los mismos registros, así que son del tipo del filtro.
            onCambiar={(valor) => cambiar({ [campo]: valor } as Partial<FiltrosEstadisticas>)}
            textoVacio="Todos"
          />
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  panel: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  encabezado: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.s,
  },
  titulo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  etiqueta: { color: colores.texto, fontFamily: fuentes.seminegrita },
  atajos: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  // Los mismos colores y pesos que ChipsFiltro.
  chip: { backgroundColor: colores.primarioSuave },
  chipElegido: { backgroundColor: colores.primarioOscuro },
  textoChip: { fontFamily: fuentes.seminegrita },
  textoChipElegido: { fontFamily: fuentes.negrita },
  fechas: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  // minWidth: con letra grande, las dos fechas no caben lado a lado y pasan a dos filas.
  fecha: { flexGrow: 1, flexBasis: 0, minWidth: 150 },
});
