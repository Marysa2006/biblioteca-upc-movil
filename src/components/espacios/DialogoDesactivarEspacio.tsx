/**
 * Confirmación para desactivar un espacio (HU-16, CA3): advierte las reservas futuras que tiene.
 * Las reservas no se cancelan solas: el personal las gestiona en la bandeja de Solicitudes (HU-19).
 * No guarda: la pantalla desactiva con onConfirmar.
 *
 * La pantalla pide las reservas con useReservasFuturas() y las pasa en `reservas`: el contenido
 * del Portal de Paper queda fuera del QueryClientProvider del layout raíz, así que aquí no se
 * puede llamar a un hook de TanStack Query.
 */
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { AvisoError, EstadoCarga, EstadoError } from '@/components/ui';
import type { useReservasFuturas } from '@/hooks/useEspacios';
import { colores, espacio, fuentes } from '@/theme';
import type { Espacio } from '@/types';

import { FilaReserva } from './FilaReserva';

type Props = {
  /** El diálogo se muestra mientras no sea null. */
  espacioActual: Espacio | null;
  /** Consulta de useReservasFuturas(espacioActual.id), hecha por la pantalla. */
  reservas: ReturnType<typeof useReservasFuturas>;
  guardando: boolean;
  mensajeError: string | null;
  onConfirmar: () => void;
  onCerrar: () => void;
};

export function DialogoDesactivarEspacio({
  espacioActual,
  reservas,
  guardando,
  mensajeError,
  onConfirmar,
  onCerrar,
}: Props) {
  return (
    <Portal>
      <Dialog visible={espacioActual != null} onDismiss={onCerrar} style={estilos.dialogo}>
        {espacioActual ? (
          <Contenido
            key={espacioActual.id}
            espacioActual={espacioActual}
            reservas={reservas}
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
  espacioActual,
  reservas: consulta,
  guardando,
  mensajeError,
  onConfirmar,
  onCerrar,
}: Props & { espacioActual: Espacio }) {
  const { data: reservas, isPending, isError, refetch } = consulta;
  const hayReservas = reservas != null && reservas.length > 0;

  let detalle;
  if (isPending) {
    detalle = <EstadoCarga mensaje="Revisando reservas futuras…" />;
  } else if (isError) {
    detalle = (
      <EstadoError
        mensaje="No pudimos revisar las reservas futuras."
        onReintentar={() => refetch()}
      />
    );
  } else if (!hayReservas) {
    detalle = (
      <Text variant="bodyMedium" style={estilos.texto}>
        No tiene reservas futuras. Dejará de ofrecerse a la comunidad para reservar.
      </Text>
    );
  } else {
    detalle = (
      <>
        <AvisoError
          mensaje={`Tiene ${reservas.length} ${reservas.length === 1 ? 'reserva futura' : 'reservas futuras'}. Seguirán registradas: revísalas en Gestión → Solicitudes para cancelarlas o moverlas.`}
        />
        {reservas.map((reserva) => (
          <FilaReserva key={reserva.id} reserva={reserva} />
        ))}
      </>
    );
  }

  return (
    <>
      <Dialog.Title style={estilos.titulo}>{`¿Desactivar ${espacioActual.nombre}?`}</Dialog.Title>
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
          buttonColor={hayReservas ? colores.error : undefined}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Desactivar ${espacioActual.nombre}`}
        >
          {hayReservas ? 'Desactivar de todas formas' : 'Desactivar'}
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
  // Con letra grande, los botones pasan a otra línea en vez de cortarse.
  acciones: { flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
