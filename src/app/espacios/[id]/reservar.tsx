/**
 * Solicitar la reserva de un espacio (HU-18). Pantalla apilada; se llega desde el calendario
 * de HU-17 al tocar una franja disponible, con la fecha y la hora en la ruta.
 * Reservar pide cuenta: sin sesión, invita a iniciarla y vuelve aquí después.
 *
 * Patrón de datos: useEspacios() / useParametros() / useSolicitarReserva() (src/hooks)
 * → src/api → mock o API.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { FormularioSolicitudReserva } from '@/components/reservas/FormularioSolicitudReserva';
import { InvitarSesion } from '@/components/reservas/InvitarSesion';
import { EncabezadoApilado, EstadoCarga, EstadoError, Pantalla } from '@/components/ui';
import { useEspacios } from '@/hooks/useEspacios';
import { useParametros } from '@/hooks/useParametros';
import { useRol } from '@/hooks/useRol';
import { colores, espacio } from '@/theme';

const TITULO = 'Solicitar reserva';

export default function ReservarEspacio() {
  const { id, fecha, hora } = useLocalSearchParams<{ id: string; fecha?: string; hora?: string }>();
  const { usuario } = useRol();
  const espacios = useEspacios();
  const parametros = useParametros();
  const lugar = espacios.data?.find((e) => e.id === id);

  const reintentar = () => {
    if (espacios.isError) espacios.refetch();
    if (parametros.isError) parametros.refetch();
  };

  let contenido;
  if (espacios.isPending || parametros.isPending) {
    contenido = <EstadoCarga mensaje="Cargando el espacio…" />;
  } else if (espacios.isError || parametros.isError) {
    contenido = <EstadoError mensaje="No pudimos cargar el espacio." onReintentar={reintentar} />;
  } else if (!lugar) {
    contenido = <NoDisponible />;
  } else if (!usuario) {
    contenido = (
      <InvitarSesion
        mensaje={`Inicia sesión con tu cuenta institucional para solicitar ${lugar.nombre}.`}
        etiqueta="Iniciar sesión para solicitar la reserva"
      />
    );
  } else {
    contenido = (
      <FormularioSolicitudReserva
        espacio={lugar}
        parametros={parametros.data}
        fecha={fecha}
        hora={hora}
      />
    );
  }

  const subtitulo = lugar
    ? `${lugar.nombre} · hasta ${lugar.capacidad} personas · ${lugar.horario}`
    : undefined;

  return (
    <>
      <EncabezadoApilado titulo={TITULO} />
      <Pantalla titulo={TITULO} subtitulo={subtitulo} conEncabezado conTeclado>
        {contenido}
      </Pantalla>
    </>
  );
}

function NoDisponible() {
  const volver = () => (router.canGoBack() ? router.back() : router.replace('/espacios'));

  return (
    <View style={estilos.noDisponible} accessibilityLiveRegion="polite">
      <Icon source="eye-off-outline" size={40} color={colores.textoSecundario} />
      <Text variant="bodyMedium" style={estilos.textoNoDisponible}>
        Este espacio no está disponible o no existe.
      </Text>
      <Button
        mode="outlined"
        onPress={volver}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Volver a los espacios"
      >
        Volver a los espacios
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  noDisponible: { alignItems: 'center', gap: espacio.s, paddingVertical: espacio.xl },
  textoNoDisponible: { color: colores.textoSecundario, textAlign: 'center' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
