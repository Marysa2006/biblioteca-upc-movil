/**
 * Guías de la biblioteca (HU-29, función plus). Pantalla apilada que se abre desde Servicios.
 *
 * - CA1: con conexión, la lista de guías publicadas; cada una se abre.
 * - CA2: cada tarjeta dice si está guardada en el celular. Sin conexión, la lista muestra las
 *   guardadas, que se leen completas.
 * - CA3: al volver la conexión, las guardadas con versión nueva se guardan solas.
 * Patrón de datos: hooks de src/hooks/useGuias.ts → src/api o la copia del celular.
 */
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { TarjetaGuia } from '@/components/guias/TarjetaGuia';
import { AvisoError, EncabezadoApilado, EstadoCarga, EstadoVacio, Pantalla } from '@/components/ui';
import { useGuardarGuia, useGuias, useGuiasGuardadasCompletas } from '@/hooks/useGuias';
import { colores, espacio, radio } from '@/theme';
import { estadoGuia, guiasDesactualizadas } from '@/utils/guias';

export default function Guias() {
  const guias = useGuias();
  const guardadas = useGuiasGuardadasCompletas();
  const { mutate: guardar } = useGuardarGuia();

  // CA3: con conexión, las guardadas que tienen versión nueva se actualizan solas. Después de
  // guardar, la lista de guardadas se refresca y ya no quedan desactualizadas.
  useEffect(() => {
    if (!guias.data || !guardadas.data) return;
    for (const guia of guiasDesactualizadas(guias.data, guardadas.data)) {
      guardar(guia);
    }
  }, [guias.data, guardadas.data, guardar]);

  const abrir = (id: string) => router.push({ pathname: '/guias/[id]', params: { id } });
  const recargar = () => {
    guias.refetch();
    guardadas.refetch();
  };

  let contenido;
  if (guias.isPending || guardadas.isPending) {
    contenido = <EstadoCarga mensaje="Cargando guías…" />;
  } else if (guias.isError) {
    // Sin conexión (o la API no responde): solo las guardadas en el celular (CA2).
    const copias = guardadas.data ?? [];
    contenido = (
      <>
        <AvisoError mensaje="No hay conexión. Estas son las guías guardadas en tu celular: se leen completas sin internet." />
        {copias.length === 0 ? (
          <EstadoVacio mensaje="No tienes guías guardadas todavía. Con internet, abre una guía y quedará guardada." />
        ) : (
          copias.map(({ guia }) => (
            <TarjetaGuia key={guia.id} guia={guia} estado="guardada" onAbrir={() => abrir(guia.id)} />
          ))
        )}
      </>
    );
  } else if (guias.data.length === 0) {
    contenido = <EstadoVacio mensaje="La biblioteca todavía no ha publicado guías." />;
  } else {
    contenido = guias.data.map((guia) => (
      <TarjetaGuia
        key={guia.id}
        guia={guia}
        estado={estadoGuia(guia, guardadas.data ?? [])}
        onAbrir={() => abrir(guia.id)}
      />
    ));
  }

  return (
    <>
      <EncabezadoApilado titulo="Guías de la biblioteca" />
      <Pantalla
        titulo="Guías de la biblioteca"
        subtitulo="Ábrelas una vez con internet y quedan guardadas para leerlas sin conexión."
        conEncabezado
        recarga={{ recargando: guias.isRefetching, onRecargar: recargar }}
      >
        <View style={estilos.ayuda}>
          <Icon source="cloud-off-outline" size={20} color={colores.primarioOscuro} />
          <Text variant="bodySmall" style={estilos.textoAyuda}>
            Disponible sin conexión: al abrir una guía se guarda en tu celular, y si la biblioteca
            la actualiza, se guarda la versión nueva cuando vuelvas a tener internet.
          </Text>
        </View>
        <View style={estilos.lista}>{contenido}</View>
      </Pantalla>
    </>
  );
}

const estilos = StyleSheet.create({
  ayuda: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioSuave,
  },
  textoAyuda: { flex: 1, color: colores.texto },
  lista: { gap: espacio.s },
});
