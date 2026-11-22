/**
 * Solicitar la reserva de un espacio (HU-18). Pantalla apilada; se llega desde el calendario
 * de HU-17 al tocar una franja disponible, con la fecha y la hora en la ruta.
 * Reservar pide cuenta: sin sesión, invita a iniciarla y vuelve aquí después. Con sesión, solo
 * docentes y administrativos reservan (#240): a los demás se les explica en lugar del formulario.
 * Desde la 1.1 (#251), por pasos: la solicitud, tus datos (prellenados) y los términos.
 *
 * Patrón de datos: useEspacios() / useParametros() / usePerfil() / useSolicitarReserva() (src/hooks)
 * → src/api → mock o API.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { FormularioSolicitudReserva } from '@/components/reservas/FormularioSolicitudReserva';
import { InvitarSesion } from '@/components/reservas/InvitarSesion';
import { ServicioNoPermitido } from '@/components/reservas/ServicioNoPermitido';
import { EncabezadoApilado, EstadoCarga, EstadoError, Pantalla } from '@/components/ui';
import { useEspacios } from '@/hooks/useEspacios';
import { useParametros } from '@/hooks/useParametros';
import { usePerfil } from '@/hooks/usePerfil';
import { useRol } from '@/hooks/useRol';
import { colores, espacio } from '@/theme';
import { MENSAJE_NO_RESERVA_ESPACIOS, puedeReservarEspacios } from '@/utils/roles';

const TITULO = 'Solicitar reserva';

export default function ReservarEspacio() {
  const { id, fecha, hora } = useLocalSearchParams<{ id: string; fecha?: string; hora?: string }>();
  const { usuario } = useRol();
  const espacios = useEspacios();
  const parametros = useParametros();
  // Prellena el celular (#224). Sin sesión no consulta; si falla, no bloquea: se escribe.
  const perfil = usePerfil();
  const lugar = espacios.data?.find((e) => e.id === id);

  const reintentar = () => {
    if (espacios.isError) espacios.refetch();
    if (parametros.isError) parametros.refetch();
  };

  let contenido;
  if (espacios.isPending || parametros.isPending || (usuario != null && perfil.isPending)) {
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
  } else if (!puedeReservarEspacios(usuario.tipo)) {
    contenido = <ServicioNoPermitido mensaje={MENSAJE_NO_RESERVA_ESPACIOS} tipo={usuario.tipo} />;
  } else {
    contenido = (
      <FormularioSolicitudReserva
        espacio={lugar}
        parametros={parametros.data}
        usuario={usuario}
        perfil={perfil.data}
        fecha={fecha}
        hora={hora}
      />
    );
  }

  const subtitulo = lugar
    ? `${lugar.nombre} · unas ${lugar.capacidad} personas · ${lugar.horario}`
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
