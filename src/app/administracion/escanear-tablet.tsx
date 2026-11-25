/**
 * Escanear una tablet (HU-31). Se abre con el botón flotante "Escanear tablet" de Gestión →
 * Préstamos. Usa la cámara de la app (EscanerCodigos), que pide el permiso y explica para qué;
 * no el escáner de Google, que la primera vez se descarga y se ve como otra app.
 *
 * Lo que pasa con la tablet leída sale de `accionDeTablet()`:
 * - prestada: esta pantalla se cambia por su devolución (CA1);
 * - libre (#310): "¿A quién se la entregas?", con los préstamos por entregar en los que cabe; al
 *   tocar uno se abre su entrega con esa tablet ya elegida;
 * - si no, el aviso sale aquí y se puede escanear otra (CA2).
 * Lo leído con la cámara llega marcado como verificado. Sin cámara, sin permiso o con la
 * etiqueta dañada, el código se escribe (CA3).
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Icon, Text, TextInput, TouchableRipple } from 'react-native-paper';

import { EscanerCodigos } from '@/components/camara/EscanerCodigos';
import { SinPermiso } from '@/components/personal/SinPermiso';
import { AvisoError, EncabezadoApilado, EstadoCarga, EstadoError, Pantalla } from '@/components/ui';
import { TIPOS_BARRAS } from '@/hooks/useEscanerSistema';
import { useRol } from '@/hooks/useRol';
import { useBuscarTabletPorCodigo, usePrestamos, useTablets } from '@/hooks/useTablets';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Prestamo, Tablet } from '@/types';
import { accionDeTablet } from '@/utils/escanerTablet';
import { hoyISO } from '@/utils/fechas';
import { franjaDelPrestamo } from '@/utils/prestamos';

const TITULO = 'Escanear tablet';

export default function EscanearTablet() {
  const { tienePermiso } = useRol();

  return (
    <>
      <EncabezadoApilado titulo={TITULO} />
      <Pantalla titulo={TITULO} conEncabezado conTeclado>
        {tienePermiso('tablets') ? <Escaner /> : <SinPermiso />}
      </Pantalla>
    </>
  );
}

/** El mensaje de la API si el código no sirve (400 o 404); si no, uno de conexión. */
function mensajeBusqueda(error: Error): string {
  if ('estado' in error && (error.estado === 400 || error.estado === 404)) return error.message;
  return 'No pudimos buscar la tablet. Revisa tu conexión e inténtalo de nuevo.';
}

type Eleccion = { tablet: Tablet; prestamos: Prestamo[]; escaneada: boolean };

function Escaner() {
  const prestamos = usePrestamos('todas');
  const tablets = useTablets();
  const buscar = useBuscarTabletPorCodigo();
  const [codigo, setCodigo] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);
  const [eleccion, setEleccion] = useState<Eleccion | null>(null);
  const mensaje = buscar.error ? mensajeBusqueda(buscar.error) : aviso;
  const limpio = codigo.trim();

  // AvisoError ya trae accessibilityLiveRegion (Android); en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && mensaje) AccessibilityInfo.announceForAccessibility(mensaje);
  }, [mensaje]);
  useEffect(() => {
    if (Platform.OS === 'ios' && eleccion) {
      AccessibilityInfo.announceForAccessibility(
        `${eleccion.tablet.codigo} está libre. Elige a quién se la entregas.`,
      );
    }
  }, [eleccion]);

  // `escaneada`: solo lo que leyó la cámara se marca "Verificada con el escáner".
  const alLeer = (leido: string, escaneada: boolean) => {
    setAviso(null);
    setEleccion(null);
    buscar.mutate(leido, {
      onSuccess: (tablet) => {
        const accion = accionDeTablet(tablet, prestamos.data ?? [], tablets.data ?? [], hoyISO());
        if (accion.tipo === 'aviso') {
          setAviso(accion.mensaje);
        } else if (accion.tipo === 'elegir') {
          setEleccion({ tablet: accion.tablet, prestamos: accion.prestamos, escaneada });
        } else {
          router.replace({
            pathname: '/administracion/prestamo',
            params: escaneada
              ? { id: accion.prestamoId, modo: accion.modo, verificada: '1' }
              : { id: accion.prestamoId, modo: accion.modo },
          });
        }
      },
    });
  };

  const entregarA = (prestamo: Prestamo, { tablet, escaneada }: Eleccion) =>
    router.replace({
      pathname: '/administracion/prestamo',
      params: escaneada
        ? { id: prestamo.id, modo: 'entrega', tabletId: tablet.id, verificada: '1' }
        : { id: prestamo.id, modo: 'entrega', tabletId: tablet.id },
    });

  if (prestamos.isPending || tablets.isPending) {
    return <EstadoCarga mensaje="Cargando los préstamos…" />;
  }
  if (prestamos.isError || tablets.isError) {
    return (
      <EstadoError
        mensaje="No pudimos cargar los préstamos."
        onReintentar={() => {
          prestamos.refetch();
          tablets.refetch();
        }}
      />
    );
  }

  return (
    <View style={estilos.contenedor}>
      <Text variant="bodyMedium" style={estilos.texto}>
        Apunta al código de barras de la etiqueta. Si la tablet está prestada, se abre su
        devolución; si está libre, eliges a quién se la entregas.
      </Text>
      <EscanerCodigos tipos={TIPOS_BARRAS} onLeido={(lectura) => alLeer(lectura.datos, true)} />
      {mensaje ? <AvisoError mensaje={mensaje} /> : null}

      {eleccion ? (
        <View style={estilos.eleccion} accessibilityLiveRegion="polite">
          <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
            {`¿A quién le entregas ${eleccion.tablet.codigo}?`}
          </Text>
          <Text variant="bodySmall" style={estilos.secundario}>
            {`${eleccion.tablet.modelo}. Estos préstamos por entregar tienen la tablet libre en sus horas.`}
          </Text>
          {eleccion.prestamos.map((prestamo) => (
            <View key={prestamo.id} style={estilos.opcion}>
              <TouchableRipple
                onPress={() => entregarA(prestamo, eleccion)}
                accessibilityRole="button"
                accessibilityLabel={`Entregar ${eleccion.tablet.codigo} a ${prestamo.solicitante}, ${franjaDelPrestamo(prestamo)}`}
              >
                <View style={estilos.contenidoOpcion}>
                  <View style={estilos.textosOpcion}>
                    <Text variant="titleSmall" style={estilos.titulo}>
                      {prestamo.solicitante}
                    </Text>
                    <Text variant="bodySmall" style={estilos.secundario}>
                      {franjaDelPrestamo(prestamo)}
                    </Text>
                  </View>
                  <Icon source="chevron-right" size={24} color={colores.textoSecundario} />
                </View>
              </TouchableRipple>
            </View>
          ))}
        </View>
      ) : null}

      <Text variant="labelLarge" style={estilos.separador}>
        O escribe el código
      </Text>
      <TextInput
        mode="outlined"
        label="Código de la tablet"
        placeholder="Por ejemplo: TAB-001"
        value={codigo}
        onChangeText={setCodigo}
        onSubmitEditing={() => limpio && alLeer(limpio, false)}
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="search"
        disabled={buscar.isPending}
        accessibilityLabel="Escribir el código de la tablet"
      />
      <Button
        mode="contained-tonal"
        icon="magnify"
        onPress={() => alLeer(limpio, false)}
        loading={buscar.isPending}
        disabled={buscar.isPending || limpio === ''}
        style={estilos.boton}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Buscar la tablet con el código escrito"
      >
        Buscar
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.s },
  texto: { color: colores.texto },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  secundario: { color: colores.textoSecundario },
  eleccion: { gap: espacio.s, marginTop: espacio.s },
  // overflow: 'hidden' recorta el ripple a la tarjeta.
  opcion: {
    borderRadius: radio.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
    overflow: 'hidden',
  },
  contenidoOpcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
    padding: espacio.m,
  },
  textosOpcion: { flex: 1, gap: espacio.xs },
  separador: {
    marginTop: espacio.m,
    color: colores.textoSecundario,
    fontFamily: fuentes.seminegrita,
  },
  boton: { alignSelf: 'flex-start' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
