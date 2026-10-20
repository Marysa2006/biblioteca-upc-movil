/**
 * Notificaciones (HU-27). Pantalla apilada; se abre desde el menú de usuario.
 * - CA1: los avisos de las solicitudes (creada, aprobada, rechazada, otra fecha, cancelada),
 *   el más reciente primero; los no leídos dicen "Nuevo" y se marcan leídos al tocarlos.
 * - CA3: si la carga falla, se ofrece reintentar.
 * - CA2: arriba, la tarjeta de los recordatorios locales (permiso, cuántos hay y una prueba).
 * Sin sesión, invita a iniciarla: los avisos y los recordatorios son de cada persona.
 *
 * Patrón de datos: useNotificaciones() / useMarcarLeida() (src/hooks) → src/api → mock o API.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { TarjetaAviso } from '@/components/notificaciones/TarjetaAviso';
import { TarjetaRecordatorios } from '@/components/notificaciones/TarjetaRecordatorios';
import { AvisoError, EncabezadoApilado, EstadoCarga, EstadoVacio, Pantalla } from '@/components/ui';
import { useMarcarLeida, useNotificaciones } from '@/hooks/useNotificaciones';
import { useRol } from '@/hooks/useRol';
import { colores, espacio } from '@/theme';

const TITULO = 'Notificaciones';

export default function Notificaciones() {
  const { usuario } = useRol();
  const { data: avisos, isPending, isError, isRefetching, refetch } = useNotificaciones();
  const marcar = useMarcarLeida();

  let contenido;
  if (!usuario) {
    contenido = (
      <View style={estilos.sinSesion}>
        <Text variant="bodyLarge" style={estilos.texto}>
          Inicia sesión para ver los avisos de tus solicitudes.
        </Text>
        <Button
          mode="contained"
          onPress={() => router.push({ pathname: '/login', params: { volver: '1' } })}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión para ver tus notificaciones"
        >
          Iniciar sesión
        </Button>
      </View>
    );
  } else if (isPending) {
    contenido = <EstadoCarga mensaje="Cargando tus notificaciones…" />;
  } else if (isError) {
    // CA3: se informa el error y se reintenta.
    contenido = (
      <AvisoError mensaje="No pudimos cargar tus notificaciones.">
        <Button
          mode="outlined"
          onPress={() => refetch()}
          style={estilos.reintentar}
          accessibilityRole="button"
          accessibilityLabel="Reintentar la carga de las notificaciones"
        >
          Reintentar
        </Button>
      </AvisoError>
    );
  } else if (avisos.length === 0) {
    contenido = <EstadoVacio mensaje="Todavía no tienes notificaciones." />;
  } else {
    const sinLeer = avisos.filter((aviso) => !aviso.leida).length;
    contenido = (
      <>
        <Text variant="bodyMedium" style={estilos.resumen} accessibilityLiveRegion="polite">
          {sinLeer === 0
            ? 'Estás al día: ya leíste todas tus notificaciones.'
            : `Tienes ${sinLeer} ${sinLeer === 1 ? 'notificación' : 'notificaciones'} sin leer.`}
        </Text>
        {marcar.error ? <AvisoError mensaje="No pudimos marcar la notificación como leída." /> : null}
        <View style={estilos.lista}>
          {avisos.map((aviso) => (
            <TarjetaAviso key={aviso.id} aviso={aviso} onMarcarLeida={() => marcar.mutate(aviso.id)} />
          ))}
        </View>
      </>
    );
  }

  return (
    <>
      <EncabezadoApilado titulo={TITULO} />
      <Pantalla
        titulo={TITULO}
        subtitulo="Avisos de tus solicitudes y recordatorios."
        conEncabezado
        recarga={usuario ? { recargando: isRefetching, onRecargar: () => refetch() } : undefined}
      >
        {usuario ? <TarjetaRecordatorios /> : null}
        {contenido}
      </Pantalla>
    </>
  );
}

const estilos = StyleSheet.create({
  sinSesion: { alignItems: 'center', gap: espacio.m, paddingVertical: espacio.xl },
  texto: { color: colores.texto, textAlign: 'center' },
  contenidoBoton: { paddingVertical: espacio.xs },
  reintentar: { alignSelf: 'flex-start' },
  resumen: { color: colores.textoSecundario },
  lista: { gap: espacio.s },
});
