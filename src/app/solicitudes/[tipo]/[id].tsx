/**
 * Detalle de una solicitud (HU-08, CA2). Pantalla apilada; se abre desde Mis solicitudes.
 * Arriba, el tipo, qué se pidió, cuándo y el estado; luego la información de su tipo
 * (InfoSolicitud) y el historial como línea de tiempo.
 * Pide cuenta: sin sesión, invita a iniciarla. Si la solicitud no es de la persona o ya no
 * existe, lo dice y ofrece volver.
 *
 * Patrón de datos: useMisSolicitudes() / useHistorialSolicitud() (src/hooks) → src/api → mock o API.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { IconoCategoria } from '@/components/servicios/IconoCategoria';
import { InvitarSesion } from '@/components/reservas/InvitarSesion';
import { InfoSolicitud } from '@/components/solicitudes/InfoSolicitud';
import { LineaTiempo } from '@/components/solicitudes/LineaTiempo';
import {
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  EtiquetaEstado,
  Pantalla,
} from '@/components/ui';
import { useRol } from '@/hooks/useRol';
import { useHistorialSolicitud, useMisSolicitudes } from '@/hooks/useSolicitudes';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { ResumenSolicitud } from '@/types';
import { esTipoSolicitud, textoFechaSolicitud, TIPOS_SOLICITUD } from '@/utils/solicitudes';

const TITULO = 'Detalle de la solicitud';

export default function DetalleSolicitud() {
  const { usuario } = useRol();
  const params = useLocalSearchParams<{ tipo: string; id: string }>();
  const tipo = esTipoSolicitud(params.tipo) ? params.tipo : '';
  const id = params.id ?? '';

  const solicitudes = useMisSolicitudes();
  // Sin sesión (por ejemplo, un enlace directo) no se consulta el historial: se muestra la invitación.
  const historial = useHistorialSolicitud(usuario ? tipo : '', usuario ? id : '');
  const solicitud = solicitudes.data?.find((actual) => actual.tipo === tipo && actual.id === id);

  const recargar = () => {
    solicitudes.refetch();
    if (tipo !== '' && id !== '') historial.refetch();
  };

  let contenido;
  if (!usuario) {
    contenido = (
      <InvitarSesion
        mensaje="Inicia sesión con tu cuenta institucional para ver tus solicitudes."
        etiqueta="Iniciar sesión para ver mis solicitudes"
      />
    );
  } else if (solicitudes.isPending) {
    contenido = <EstadoCarga mensaje="Cargando la solicitud…" />;
  } else if (solicitudes.isError) {
    contenido = <EstadoError mensaje="No pudimos cargar la solicitud." onReintentar={recargar} />;
  } else if (!solicitud) {
    contenido = <NoEncontrada />;
  } else {
    contenido = (
      <>
        <Encabezado solicitud={solicitud} />
        <InfoSolicitud solicitud={solicitud} />

        <View style={estilos.seccion}>
          <Text variant="titleSmall" style={estilos.tituloSeccion} accessibilityRole="header">
            Historial
          </Text>
          {historial.isPending ? (
            <EstadoCarga mensaje="Cargando el historial…" />
          ) : historial.isError ? (
            <EstadoError
              mensaje="No pudimos cargar el historial."
              onReintentar={() => historial.refetch()}
            />
          ) : historial.data.length === 0 ? (
            <EstadoVacio mensaje="Esta solicitud todavía no tiene cambios registrados." />
          ) : (
            <View style={estilos.tarjeta}>
              <LineaTiempo eventos={historial.data} />
            </View>
          )}
        </View>
      </>
    );
  }

  return (
    <>
      <EncabezadoApilado titulo={TITULO} />
      <Pantalla
        titulo={solicitud?.titulo ?? TITULO}
        conEncabezado
        recarga={
          usuario
            ? {
                recargando: solicitudes.isRefetching || historial.isRefetching,
                onRecargar: recargar,
              }
            : undefined
        }
      >
        {contenido}
      </Pantalla>
    </>
  );
}

/** Tipo con su ícono, cuándo y el estado; el título ya va arriba, en Pantalla. */
function Encabezado({ solicitud }: { solicitud: ResumenSolicitud }) {
  const tipo = TIPOS_SOLICITUD[solicitud.tipo];

  return (
    <View style={estilos.encabezado}>
      <IconoCategoria categoria={tipo.categoria} tamano={24} />
      <View style={estilos.textosEncabezado}>
        <Text variant="labelLarge" style={estilos.tipo}>
          {tipo.nombre}
        </Text>
        <Text variant="bodyMedium" style={estilos.texto}>
          {textoFechaSolicitud(solicitud.fecha, solicitud.hora)}
        </Text>
        <EtiquetaEstado estado={solicitud.estado} />
      </View>
    </View>
  );
}

function NoEncontrada() {
  const volver = () => (router.canGoBack() ? router.back() : router.replace('/solicitudes'));

  return (
    <View style={estilos.noEncontrada}>
      <EstadoVacio mensaje="No encontramos esta solicitud entre las tuyas. Puede que ya no exista." />
      <Button
        mode="outlined"
        onPress={volver}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Volver a Mis solicitudes"
      >
        Volver a Mis solicitudes
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  encabezado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  textosEncabezado: { flex: 1, gap: espacio.xs },
  tipo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  texto: { color: colores.texto },
  seccion: { gap: espacio.s },
  tituloSeccion: { color: colores.texto, fontFamily: fuentes.seminegrita },
  tarjeta: { padding: espacio.m, borderRadius: radio.tarjeta, backgroundColor: colores.superficie },
  noEncontrada: { gap: espacio.m },
  contenidoBoton: { paddingVertical: espacio.xs },
});
