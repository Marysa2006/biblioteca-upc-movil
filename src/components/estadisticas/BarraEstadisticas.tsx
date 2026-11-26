/**
 * Barra de Estadísticas (#307), arriba de todas las pestañas:
 * - «Filtros» abre el panel (FiltrosIndicadores) y dice cuántos filtros hay activos.
 * - «Exportar» abre un menú: para Excel (el CSV de los registros, HU-26 CA2) o PDF (los
 *   indicadores con los filtros, #260). Antes eran dos botones grandes encima de los datos.
 * - Debajo, los filtros activos con ✕, aunque el panel esté cerrado.
 * El resultado de exportar se avisa en un Snackbar, como en el resto de la app.
 * Los filtros los guarda la pantalla; la barra solo los muestra y los cambia.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Chip, Menu, Portal, Snackbar } from 'react-native-paper';

import { FiltrosIndicadores } from '@/components/estadisticas/FiltrosIndicadores';
import { usaApi } from '@/api/cliente';
import { servicioEstadistico } from '@/api/backend/estadisticas';
import {
  useExportarEstadisticas,
  useExportarPdf,
  useIndicadores,
  useRegistrosUso,
} from '@/hooks/useEstadisticas';
import { colores, espacio, fuentes } from '@/theme';
import type { FiltrosEstadisticas } from '@/types';
import {
  CAMPOS_FILTRO,
  filtrosActivos,
  opcionesFiltros,
  textoOperaciones,
} from '@/utils/filtrosEstadisticas';

/**
 * El aviso cuando falla una exportación. En desarrollo (Expo Go) también dice el error técnico y
 * lo deja en la consola de `npx expo start`, para encontrar la causa; en el APK, solo el aviso.
 */
function mensajeDeError(aviso: string, error: unknown): string {
  if (!__DEV__) return `${aviso} Inténtalo de nuevo.`;
  console.warn(aviso, error);
  return `${aviso} (${error instanceof Error ? error.message : String(error)})`;
}

/** Como en las demás pantallas con Snackbar. */
const DURACION_AVISO_MS = 4000;

type Props = {
  filtros: FiltrosEstadisticas;
  onCambiar: (filtros: FiltrosEstadisticas) => void;
};

export function BarraEstadisticas({ filtros, onCambiar }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [menu, setMenu] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // Las opciones de cada lista salen del periodo (solo desde y hasta): así cada opción dice
  // cuántas operaciones tiene. Los registros y los indicadores usan todos los filtros.
  const periodo = useRegistrosUso({ desde: filtros.desde, hasta: filtros.hasta });
  const conApi = usaApi('estadisticas');
  const resumenPeriodo = useIndicadores(
    { desde: filtros.desde, hasta: filtros.hasta },
    conApi && abierto,
  );
  const registros = useRegistrosUso(filtros);
  const indicadores = useIndicadores(filtros);
  const exportar = useExportarEstadisticas();
  const exportarPdf = useExportarPdf();
  const exportando = exportar.isPending || exportarPdf.isPending;
  const activos = filtrosActivos(filtros);
  const total = (conApi ? indicadores.data?.total : registros.data?.length) ?? 0;
  const sinDatos = total === 0;
  const opciones = opcionesFiltros(periodo.data ?? [], filtros);
  const resumen = resumenPeriodo.data;
  if (conApi && resumen) {
    for (const [campo, filas] of [
      ['servicio', resumen.porServicio],
      ['programa', resumen.porPrograma],
      ['facultad', resumen.porFacultad],
      ['sede', resumen.porSede],
    ] as const) {
      opciones[campo] = [
        { valor: 'todos', etiqueta: 'Todos', cantidad: resumen.total },
        ...filas.flatMap((fila) => {
          const valor = campo === 'servicio' ? servicioEstadistico(fila.etiqueta) : fila.etiqueta;
          return valor ? [{ ...fila, valor }] : [];
        }),
      ];
    }
  }

  // El Snackbar ya trae accessibilityLiveRegion (Android); en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  const cambiar = (nuevos: FiltrosEstadisticas) => {
    onCambiar(nuevos);
    exportar.reset();
    exportarPdf.reset();
  };

  const alExportarExcel = () => {
    setMenu(false);
    const lista = registros.data;
    const datos = indicadores.data;
    if (!datos || (!conApi && !lista)) return;
    exportarPdf.reset();
    exportar.mutate(
      { registros: lista ?? [], filtros, indicadores: datos },
      {
        onSuccess: ({ archivo, compartido }) =>
          setAviso(
            compartido
              ? `Se exportaron ${textoOperaciones(total)} en ${archivo}.`
              : `El celular no permite compartir: el archivo ${archivo} quedó guardado en la app.`,
          ),
        onError: (error) => setAviso(mensajeDeError('No pudimos exportar el archivo.', error)),
      },
    );
  };

  const alExportarPdf = () => {
    setMenu(false);
    const datos = indicadores.data;
    if (!datos) return;
    exportar.reset();
    exportarPdf.mutate(
      { indicadores: datos, filtros },
      {
        onSuccess: ({ compartido, impresion }) =>
          setAviso(
            impresion
              ? 'Se abrió el diálogo para guardar el PDF.'
              : compartido
                ? `Se exportó el PDF con ${textoOperaciones(datos.total)} y los filtros aplicados.`
                : 'El celular no permite compartir: el PDF quedó generado en la app.',
          ),
        onError: (error) => setAviso(mensajeDeError('No pudimos exportar el PDF.', error)),
      },
    );
  };

  return (
    <View style={estilos.barra}>
      <View style={estilos.botones}>
        <Button
          mode={abierto ? 'contained' : 'contained-tonal'}
          icon={abierto ? 'chevron-up' : 'filter-variant'}
          onPress={() => setAbierto((actual) => !actual)}
          contentStyle={estilos.contenidoBoton}
          labelStyle={estilos.textoBoton}
          accessibilityLabel={
            activos.length > 0
              ? `Filtros, ${activos.length} activos`
              : 'Filtros, sin filtros: todas las operaciones'
          }
          accessibilityState={{ expanded: abierto }}
        >
          {activos.length > 0 ? `Filtros (${activos.length})` : 'Filtros'}
        </Button>
        <Menu
          visible={menu}
          onDismiss={() => setMenu(false)}
          anchor={
            <Button
              mode="outlined"
              icon="tray-arrow-down"
              onPress={() => setMenu(true)}
              loading={exportando}
              disabled={exportando || sinDatos}
              contentStyle={estilos.contenidoBoton}
              labelStyle={estilos.textoBoton}
              accessibilityLabel="Exportar: elige Excel o PDF"
            >
              Exportar
            </Button>
          }
          anchorPosition="bottom"
          contentStyle={estilos.menu}
        >
          <Menu.Item
            leadingIcon="microsoft-excel"
            title="Para Excel (CSV)"
            onPress={alExportarExcel}
            accessibilityLabel={`Exportar ${textoOperaciones(total)} para Excel`}
          />
          <Menu.Item
            leadingIcon="file-pdf-box"
            title="PDF con los indicadores"
            onPress={alExportarPdf}
            accessibilityLabel="Exportar los indicadores en PDF, con los filtros aplicados"
          />
        </Menu>
      </View>

      {activos.length > 0 ? (
        <View style={estilos.activos}>
          {activos.map((activo) => (
            <Chip
              key={activo.clave}
              onClose={() => cambiar({ ...filtros, ...activo.quitar })}
              closeIcon="close"
              style={estilos.chip}
              textStyle={estilos.textoChip}
              accessibilityLabel={activo.texto}
              closeIconAccessibilityLabel={`Quitar el filtro ${activo.texto}`}
            >
              {activo.texto}
            </Chip>
          ))}
        </View>
      ) : null}

      {abierto ? (
        <FiltrosIndicadores
          filtros={filtros}
          onCambiar={cambiar}
          opciones={opciones}
          campos={
            conApi
              ? CAMPOS_FILTRO.filter((campo) => campo !== 'tipoUsuario' && campo !== 'periodo')
              : CAMPOS_FILTRO
          }
        />
      ) : null}

      <Portal>
        <Snackbar
          visible={aviso != null}
          onDismiss={() => setAviso(null)}
          duration={DURACION_AVISO_MS}
        >
          {aviso ?? ''}
        </Snackbar>
      </Portal>
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: { gap: espacio.s },
  // Con letra grande, «Exportar» pasa debajo de «Filtros» en vez de cortarse.
  botones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: espacio.s,
  },
  contenidoBoton: { paddingVertical: espacio.xs },
  textoBoton: { fontFamily: fuentes.seminegrita },
  menu: { backgroundColor: colores.superficie },
  activos: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  chip: { backgroundColor: colores.primarioSuave },
  textoChip: { color: colores.primarioOscuro, fontFamily: fuentes.seminegrita },
});
