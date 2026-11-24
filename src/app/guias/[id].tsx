/**
 * Leer una guía (HU-29). Con conexión se descarga y queda guardada en el celular (CA2); si la
 * biblioteca la actualizó, se guarda la versión nueva (CA3). Sin conexión se lee la copia
 * guardada; si no hay copia, explica que hace falta internet para descargarla (CA4).
 * useGuia() hace todo eso: la pantalla solo muestra lo que devuelve.
 *
 * Versión 1.1 (#258): si la guía tiene enlace (Drive o una página), el botón "Abrir guía" la abre
 * en el navegador integrado, con la nota de que necesita conexión. Las escritas se siguen
 * guardando y leyendo sin conexión.
 *
 * Desde el #303, si la guía es un PDF, se guarda en el celular como las escritas, y "Abrir guía"
 * lo abre con el visor del celular, también sin conexión.
 */
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { AvisoError, EncabezadoApilado, EstadoCarga, EstadoError, Pantalla } from '@/components/ui';
import { useAbrirPdfGuia, useEliminarGuia, useGuia, useGuiasGuardadas } from '@/hooks/useGuias';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import { fechaLegible } from '@/utils/fechas';
import { bloquesDeGuia, textoTamano } from '@/utils/guias';
import { abrirEnNavegador } from '@/utils/navegador';

export default function LeerGuia() {
  const { id = '' } = useLocalSearchParams<{ id?: string }>();
  const guia = useGuia(id);
  const guardadas = useGuiasGuardadas();
  const eliminar = useEliminarGuia();
  const abrirPdf = useAbrirPdfGuia();
  const [quitada, setQuitada] = useState(false);
  const [sinAbrir, setSinAbrir] = useState(false);
  const titulo = guia.data?.titulo ?? 'Guía';

  const abrir = (enlace: string) => {
    setSinAbrir(false);
    abrirEnNavegador(enlace).catch(() => setSinAbrir(true));
  };

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
  } else if (guia.data.enlace && !guia.data.archivo) {
    // Con enlace (#258): se lee en el navegador; no hay nada que guardar en el celular.
    const { enlace } = guia.data;
    contenido = (
      <View style={estilos.contenedor}>
        <Text variant="bodyLarge" style={estilos.parrafo}>
          {guia.data.descripcion}
        </Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          {`Actualizada el ${fechaLegible(guia.data.actualizada.slice(0, 10))}`}
        </Text>

        {sinAbrir ? (
          <AvisoError mensaje="No pudimos abrir la guía. Revisa tu conexión e inténtalo de nuevo." />
        ) : null}

        <Button
          mode="contained"
          icon="open-in-new"
          onPress={() => abrir(enlace)}
          style={estilos.boton}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="link"
          accessibilityLabel={`Abrir ${guia.data.titulo} en el navegador. Necesitas conexión`}
        >
          Abrir guía
        </Button>
        <View style={[estilos.marca, estilos.marcaSinGuardar]}>
          <Icon source="wifi" size={18} color={coloresEstado.cancelada.texto} />
          <Text variant="labelLarge" style={estilos.textoSinGuardar}>
            Necesitas conexión: la guía está en Drive o en una página web y se abre en el navegador.
          </Text>
        </View>
      </View>
    );
  } else {
    const datos = guia.data;
    const { archivo } = datos;
    const guardada = (guardadas.data ?? []).includes(datos.id);
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
          {`Actualizada el ${fechaLegible(datos.actualizada.slice(0, 10))} · ${datos.descripcion}`}
        </Text>

        {archivo ? (
          // PDF (#303): se abre con el visor del celular, también sin conexión.
          <>
            <View
              style={estilos.archivo}
              accessible
              accessibilityLabel={`Guía en PDF: ${archivo.nombre}, ${textoTamano(archivo.bytes)}`}
            >
              <Icon source="file-pdf-box" size={32} color={colores.primario} />
              <View style={estilos.textosArchivo}>
                <Text variant="bodyLarge" style={estilos.nombreArchivo} numberOfLines={2}>
                  {archivo.nombre}
                </Text>
                <Text variant="bodySmall" style={estilos.secundario}>
                  {`PDF · ${textoTamano(archivo.bytes)}`}
                </Text>
              </View>
            </View>

            {abrirPdf.isError ? (
              <AvisoError mensaje="No pudimos abrir el PDF. Revisa que tu celular tenga una app para leer PDF." />
            ) : null}

            <Button
              mode="contained"
              icon="book-open-variant"
              onPress={() => abrirPdf.mutate(datos)}
              loading={abrirPdf.isPending}
              disabled={!guardada || abrirPdf.isPending}
              style={estilos.boton}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${datos.titulo}, guardada en tu celular`}
            >
              Abrir guía
            </Button>
          </>
        ) : (
          <View style={estilos.texto}>
            {bloquesDeGuia(datos.contenido).map((bloque, indice) => (
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
        )}

        {guardada ? (
          <Button
            mode="outlined"
            icon="delete-outline"
            onPress={() => eliminar.mutate(datos.id, { onSuccess: () => setQuitada(true) })}
            loading={eliminar.isPending}
            disabled={eliminar.isPending}
            style={estilos.boton}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${datos.titulo} del celular para liberar espacio`}
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
  archivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  textosArchivo: { flex: 1, gap: espacio.xs },
  nombreArchivo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  boton: { alignSelf: 'flex-start' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
