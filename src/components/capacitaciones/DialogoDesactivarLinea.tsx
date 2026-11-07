/**
 * Confirmación para desactivar una línea de formación (HU-09, CA3): dice cuántas solicitudes
 * activas tiene y quiénes las pidieron. Las solicitudes no se cancelan: se siguen atendiendo en
 * Gestión → Solicitudes (HU-12). No guarda: la pantalla desactiva con onConfirmar.
 *
 * La pantalla pide las solicitudes con useSolicitudesActivasLinea() y las pasa en
 * `solicitudes`: el Portal de Paper queda fuera del QueryClientProvider, así que aquí no se
 * puede llamar a un hook de TanStack Query (lo mismo que en HU-16).
 */
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { AvisoError, EstadoCarga, EstadoError, EtiquetaEstado } from '@/components/ui';
import type { useSolicitudesActivasLinea } from '@/hooks/useCapacitaciones';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { LineaFormacion } from '@/types';
import { fechaLegible } from '@/utils/fechas';

type Props = {
  /** El diálogo se muestra mientras no sea null. */
  linea: LineaFormacion | null;
  /** Consulta de useSolicitudesActivasLinea(linea.id), hecha por la pantalla. */
  solicitudes: ReturnType<typeof useSolicitudesActivasLinea>;
  guardando: boolean;
  mensajeError: string | null;
  onConfirmar: () => void;
  onCerrar: () => void;
};

export function DialogoDesactivarLinea({ linea, solicitudes, guardando, mensajeError, onConfirmar, onCerrar }: Props) {
  return (
    <Portal>
      <Dialog visible={linea != null} onDismiss={onCerrar} style={estilos.dialogo}>
        {linea ? (
          <Contenido
            key={linea.id}
            linea={linea}
            solicitudes={solicitudes}
            guardando={guardando}
            mensajeError={mensajeError}
            onConfirmar={onConfirmar}
            onCerrar={onCerrar}
          />
        ) : null}
      </Dialog>
    </Portal>
  );
}

function Contenido({
  linea,
  solicitudes: consulta,
  guardando,
  mensajeError,
  onConfirmar,
  onCerrar,
}: Props & { linea: LineaFormacion }) {
  const { data: solicitudes, isPending, isError, refetch } = consulta;
  const cantidad = solicitudes?.length ?? 0;

  let detalle;
  if (isPending) {
    detalle = <EstadoCarga mensaje="Revisando solicitudes activas…" />;
  } else if (isError) {
    detalle = <EstadoError mensaje="No pudimos revisar las solicitudes activas." onReintentar={() => refetch()} />;
  } else if (cantidad === 0) {
    detalle = (
      <Text variant="bodyMedium" style={estilos.texto}>
        No tiene solicitudes activas. Dejará de ofrecerse para solicitar capacitación.
      </Text>
    );
  } else {
    detalle = (
      <>
        <AvisoError
          mensaje={`Tiene ${cantidad} ${cantidad === 1 ? 'solicitud activa' : 'solicitudes activas'}. No se cancelan: se siguen atendiendo en Gestión → Solicitudes, pero nadie más podrá pedir esta línea.`}
        />
        {solicitudes.map((solicitud) => (
          <View
            key={solicitud.id}
            style={estilos.solicitud}
            accessible
            accessibilityLabel={`${solicitud.solicitante.nombre}, ${fechaLegible(solicitud.fecha)} a las ${solicitud.hora}`}
          >
            <Text variant="labelLarge" style={estilos.fecha}>
              {`${fechaLegible(solicitud.fecha)} · ${solicitud.hora}`}
            </Text>
            <Text variant="bodyMedium" style={estilos.texto}>
              {`${solicitud.solicitante.nombre} · ${solicitud.grupo}`}
            </Text>
            <EtiquetaEstado estado={solicitud.estado} />
          </View>
        ))}
      </>
    );
  }

  return (
    <>
      <Dialog.Title style={estilos.titulo}>{`¿Desactivar ${linea.nombre}?`}</Dialog.Title>
      <Dialog.ScrollArea style={estilos.area}>
        <ScrollView contentContainerStyle={estilos.contenido}>
          {detalle}
          {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}
        </ScrollView>
      </Dialog.ScrollArea>
      <Dialog.Actions style={estilos.acciones}>
        <Button
          mode="text"
          onPress={onCerrar}
          disabled={guardando}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Cancelar"
        >
          Cancelar
        </Button>
        <Button
          mode="contained"
          onPress={onConfirmar}
          loading={guardando}
          disabled={guardando || isPending || isError}
          buttonColor={cantidad > 0 ? colores.error : undefined}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Desactivar la línea ${linea.nombre}`}
        >
          {cantidad > 0 ? 'Desactivar de todas formas' : 'Desactivar'}
        </Button>
      </Dialog.Actions>
    </>
  );
}

const estilos = StyleSheet.create({
  dialogo: { backgroundColor: colores.superficie, maxHeight: '90%' },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  area: { paddingHorizontal: 0 },
  contenido: { gap: espacio.s, paddingHorizontal: espacio.l, paddingVertical: espacio.s },
  texto: { color: colores.texto },
  fecha: { color: colores.texto, fontFamily: fuentes.seminegrita },
  solicitud: { gap: espacio.xs, padding: espacio.s, borderRadius: radio.boton, backgroundColor: colores.superficieVariante },
  // Con letra grande, los botones pasan a otra línea en vez de cortarse.
  acciones: { flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
