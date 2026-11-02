/**
 * Leer una guía (HU-29). Con conexión se descarga y queda guardada en el celular (CA2); si la
 * biblioteca la actualizó, se guarda la versión nueva (CA3). Sin conexión se lee la copia
 * guardada; si no hay copia, explica que hace falta internet para descargarla (CA4).
 * useGuia() hace todo eso: la pantalla solo muestra lo que devuelve.
 */
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { EncabezadoApilado, EstadoCarga, EstadoError, Pantalla } from '@/components/ui';
import { useEliminarGuia, useGuia, useGuiasGuardadas } from '@/hooks/useGuias';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import { fechaLegible } from '@/utils/fechas';
import { bloquesDeGuia } from '@/utils/guias';

export default function LeerGuia() {
  const { id = '' } = useLocalSearchParams<{ id?: string }>();
  const guia = useGuia(id);
  const guardadas = useGuiasGuardadas();
  const eliminar = useEliminarGuia();
  const [quitada, setQuitada] = useState(false);
  const titulo = guia.data?.titulo ?? 'Guía';

  let contenido;
  if (guia.isPending) {
    contenido = <EstadoCarga mensaje="Abriendo la guía…" />;
  } else if (guia.isError) {
    const noExiste = 'estado' in guia.error && guia.error.estado === 404;
    contenido = (
      <EstadoError
        mensaje={
          noExiste
            ? 'Esta guía ya no está publicada.'
            : 'Esta guía no está guardada en tu celular y no hay conexión. Necesitas internet para descargarla la primera vez; después se lee sin señal.'
        }
        onReintentar={noExiste ? undefined : () => guia.refetch()}
      />
    );
  } else {
    const guardada = (guardadas.data ?? []).includes(guia.data.id);
    contenido = (
      <View style={estilos.contenedor}>
        <View style={[estilos.marca, guardada ? estilos.marcaGuardada : estilos.marcaSinGuardar]} accessibilityLiveRegion="polite">
          <Icon
            source={guardada ? 'check-circle-outline' : 'cloud-outline'}
            size={18}
            color={guardada ? colores.primarioOscuro : coloresEstado.cancelada.texto}
          />
          <Text variant="labelLarge" style={guardada ? estilos.textoGuardada : estilos.textoSinGuardar}>
            {guardada
              ? 'Guardada en tu celular · disponible sin conexión'
              : quitada
                ? 'Quitada del celular: se vuelve a guardar la próxima vez que la abras con internet.'
                : 'Guardando en tu celular…'}
          </Text>
        </View>

        <Text variant="bodySmall" style={estilos.secundario}>
          {`Actualizada el ${fechaLegible(guia.data.actualizada)} · ${guia.data.descripcion}`}
        </Text>

        <View style={estilos.texto}>
          {bloquesDeGuia(guia.data.contenido).map((bloque, indice) => (
            <Text
              key={indice}
              variant={bloque.tipo === 'titulo' ? 'titleMedium' : 'bodyLarge'}
              style={bloque.tipo === 'titulo' ? estilos.subtitulo : bloque.tipo === 'paso' ? estilos.paso : estilos.parrafo}
              accessibilityRole={bloque.tipo === 'titulo' ? 'header' : 'text'}
            >
              {bloque.texto}
            </Text>
          ))}
        </View>

        {guardada ? (
          <Button
            mode="outlined"
            icon="delete-outline"
            onPress={() => eliminar.mutate(guia.data.id, { onSuccess: () => setQuitada(true) })}
            loading={eliminar.isPending}
            disabled={eliminar.isPending}
            style={estilos.boton}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${guia.data.titulo} del celular para liberar espacio`}
          >
            Quitar del celular
          </Button>
        ) : null}
      </View>
    );
  }

  return (
    <>
      <EncabezadoApilado titulo={titulo} />
      <Pantalla titulo={titulo} conEncabezado recarga={{ recargando: guia.isRefetching, onRecargar: () => guia.refetch() }}>
        {contenido}
      </Pantalla>
    </>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.m },
  marca: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.s,
    padding: espacio.s,
    borderRadius: radio.boton,
  },
  marcaGuardada: { backgroundColor: colores.primarioSuave },
  marcaSinGuardar: { backgroundColor: coloresEstado.cancelada.fondo },
  textoGuardada: { flex: 1, color: colores.primarioOscuro },
  textoSinGuardar: { flex: 1, color: coloresEstado.cancelada.texto },
  secundario: { color: colores.textoSecundario },
  texto: { gap: espacio.s, padding: espacio.m, borderRadius: radio.tarjeta, backgroundColor: colores.superficie },
  subtitulo: { color: colores.texto, fontFamily: fuentes.negrita },
  parrafo: { color: colores.texto },
  paso: { color: colores.texto, paddingLeft: espacio.s },
  boton: { alignSelf: 'flex-start' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
