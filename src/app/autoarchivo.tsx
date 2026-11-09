/**
 * Orientación de autoarchivo (HU-11): procedimiento, requisitos, formatos y metadatos para
 * depositar el trabajo de grado en el Repositorio Institucional. Se consulta sin cuenta.
 * Pantalla apilada que se abre desde el servicio "Depósito de trabajos de grado" y desde
 * Catálogo → Repositorio.
 *
 * "Ir al depósito" primero comprueba que el repositorio responde (CA3) y, si responde, lo abre
 * en el navegador integrado (CA2). Si no, muestra el aviso con Reintentar y no abre nada.
 * Patrón de datos: useOrientacionAutoarchivo() → obtenerOrientacionAutoarchivo() → mock.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { BloqueOrientacion, ListaVinetas } from '@/components/autoarchivo/BloqueOrientacion';
import { CaminoPasos } from '@/components/autoarchivo/CaminoPasos';
import { EtiquetasDatos } from '@/components/autoarchivo/EtiquetasDatos';
import {
  AvisoError,
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import { useOrientacionAutoarchivo } from '@/hooks/useAutoarchivo';
import { abrirRepositorio, useComprobarRepositorio } from '@/hooks/useRepositorio';
import { colores, espacio, fuentes } from '@/theme';
import { fechaLegible } from '@/utils/fechas';

const TITULO = 'Orientación de autoarchivo';

export default function Autoarchivo() {
  const orientacion = useOrientacionAutoarchivo();
  const comprobar = useComprobarRepositorio();
  const [aviso, setAviso] = useState<string | null>(null);

  // AvisoError ya trae accessibilityLiveRegion (Android); en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) AccessibilityInfo.announceForAccessibility(aviso);
  }, [aviso]);

  async function irAlDeposito() {
    setAviso(null);
    try {
      await comprobar.mutateAsync();
    } catch (error) {
      // CA3: el 503 trae un mensaje listo para la persona; se lee el código sin importar la clase.
      setAviso(
        error instanceof Error && 'estado' in error
          ? error.message
          : 'El repositorio no está disponible. Intenta más tarde.',
      );
      return;
    }
    try {
      await abrirRepositorio();
    } catch {
      setAviso('No se pudo abrir el repositorio. Intenta de nuevo.');
    }
  }

  let contenido;
  if (orientacion.isPending) {
    contenido = <EstadoCarga mensaje="Cargando la orientación…" />;
  } else if (orientacion.isError) {
    contenido = (
      <EstadoError
        mensaje="No pudimos cargar la orientación de autoarchivo."
        onReintentar={() => orientacion.refetch()}
      />
    );
  } else {
    const { actualizada, procedimiento, requisitos, formatos, metadatos } = orientacion.data;
    const vacia = [procedimiento, requisitos, formatos, metadatos].every((b) => b.length === 0);

    contenido = vacia ? (
      <EstadoVacio mensaje="La biblioteca todavía no ha publicado la orientación de autoarchivo." />
    ) : (
      <>
        <Text variant="bodySmall" style={estilos.secundario}>
          {`Actualizada el ${fechaLegible(actualizada)}`}
        </Text>

        {procedimiento.length > 0 ? (
          <BloqueOrientacion icono="format-list-numbered" titulo="Pasos">
            <CaminoPasos pasos={procedimiento} />
          </BloqueOrientacion>
        ) : null}

        {/* Requisitos: el único bloque en tarjeta, porque es lo que hay que revisar antes. */}
        {requisitos.length > 0 ? (
          <BloqueOrientacion icono="clipboard-check-outline" titulo="Antes de depositar" destacado>
            <Text variant="bodyLarge" style={estilos.introduccion}>
              Asegúrate de cumplir con lo siguiente:
            </Text>
            <ListaVinetas elementos={requisitos} />
          </BloqueOrientacion>
        ) : null}

        {formatos.length > 0 || metadatos.length > 0 ? (
          <BloqueOrientacion icono="file-document-outline" titulo="Prepara tu archivo y tus datos">
            {formatos.length > 0 ? (
              <View style={estilos.subbloque}>
                <Text variant="titleSmall" style={estilos.subtitulo} accessibilityRole="header">
                  Formatos
                </Text>
                <ListaVinetas elementos={formatos} />
              </View>
            ) : null}
            {metadatos.length > 0 ? (
              <View style={estilos.subbloque}>
                <Text variant="titleSmall" style={estilos.subtitulo} accessibilityRole="header">
                  Datos que te pedirán (metadatos)
                </Text>
                <EtiquetasDatos datos={metadatos} />
              </View>
            ) : null}
          </BloqueOrientacion>
        ) : null}

        <View style={estilos.deposito}>
          {aviso ? (
            <AvisoError mensaje={aviso}>
              <Button
                mode="outlined"
                onPress={() => irAlDeposito()}
                disabled={comprobar.isPending}
                style={estilos.reintentar}
                accessibilityRole="button"
                accessibilityLabel="Reintentar abrir el Repositorio Institucional"
              >
                Reintentar
              </Button>
            </AvisoError>
          ) : null}

          <Button
            mode="contained"
            icon="open-in-new"
            onPress={() => irAlDeposito()}
            loading={comprobar.isPending}
            disabled={comprobar.isPending}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="link"
            accessibilityLabel="Abrir el Repositorio Institucional para depositar tu trabajo"
          >
            Ir al depósito
          </Button>
          <Text variant="bodySmall" style={estilos.secundario}>
            El repositorio se abre en el navegador; para depositar necesitas tu cuenta de la
            Universidad. Al cerrarlo vuelves aquí.
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <EncabezadoApilado titulo={TITULO} />
      <Pantalla
        titulo={TITULO}
        subtitulo={orientacion.data?.titulo}
        conEncabezado
        recarga={{ recargando: orientacion.isRefetching, onRecargar: () => orientacion.refetch() }}
      >
        {contenido}
      </Pantalla>
    </>
  );
}

const estilos = StyleSheet.create({
  secundario: { color: colores.textoSecundario },
  introduccion: { color: colores.textoSecundario },
  subbloque: { gap: espacio.s },
  subtitulo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  deposito: { gap: espacio.s, marginTop: espacio.s },
  reintentar: { alignSelf: 'flex-start' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
