/**
 * Tarjeta "Recordatorios" de la pantalla de notificaciones (HU-27), según el permiso:
 * - por activar: explica para qué sirven y solo entonces pide el permiso;
 * - concedido: cuántos hay programados, "Probar un recordatorio" (CA2) y, si la
 *   sincronización falló, el error con "Reintentar" (CA3);
 * - bloqueado: la app sigue funcionando y explica cómo activarlo, con "Abrir ajustes".
 * El estado siempre va en texto, no solo en color.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Linking, Platform, StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { AvisoError, EstadoCarga } from '@/components/ui';
import { useParametros } from '@/hooks/useParametros';
import { probarRecordatorio, SEGUNDOS_PRUEBA, usePermisoRecordatorios } from '@/hooks/useRecordatorios';
import { useEstadoRecordatorios } from '@/store/recordatorios';
import { colores, espacio, fuentes, radio } from '@/theme';
import { ejemploRecordatorio } from '@/utils/recordatorios';

/** Si los parámetros no cargan, el ejemplo usa este texto. */
const TEXTO_POR_DEFECTO = 'Recuerda tu compromiso con la biblioteca.';

export function TarjetaRecordatorios() {
  const { estado, pedir } = usePermisoRecordatorios();
  const { data: parametros } = useParametros();
  const { programados, error, reintentar } = useEstadoRecordatorios();
  const [aviso, setAviso] = useState<string | null>(null);
  const [falla, setFalla] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  // En Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  const activar = async () => {
    setFalla(null);
    setOcupado(true);
    try {
      await pedir();
    } catch {
      setFalla('No pudimos pedir el permiso de notificaciones. Inténtalo de nuevo.');
    } finally {
      setOcupado(false);
    }
  };

  const probar = async () => {
    setFalla(null);
    setOcupado(true);
    try {
      const textoRecordatorio = parametros?.textoRecordatorio ?? TEXTO_POR_DEFECTO;
      await probarRecordatorio(ejemploRecordatorio(textoRecordatorio));
      setAviso(`Listo: el recordatorio de prueba llega en ${SEGUNDOS_PRUEBA} segundos.`);
    } catch {
      setFalla('No pudimos programar el recordatorio de prueba. Inténtalo de nuevo.');
    } finally {
      setOcupado(false);
    }
  };

  if (estado === 'cargando') {
    return <EstadoCarga mensaje="Revisando los recordatorios…" />;
  }

  let icono: string;
  let titulo: string;
  let texto: string;
  let acciones: ReactNode;

  if (estado === 'por_activar') {
    icono = 'bell-ring-outline';
    titulo = 'Activa los recordatorios';
    texto =
      'Te avisaremos en el celular 24 horas y 1 hora antes de cada reserva aprobada, aunque la app esté cerrada.';
    acciones = (
      <Boton
        etiqueta="Activar recordatorios"
        icono="bell-check-outline"
        onPress={activar}
        cargando={ocupado}
        principal
      />
    );
  } else if (estado === 'bloqueado') {
    icono = 'bell-off-outline';
    titulo = 'Recordatorios desactivados';
    texto =
      'La app sigue funcionando y verás tus avisos aquí. Para recibir los recordatorios, activa las notificaciones en Ajustes → Notificaciones.';
    acciones = (
      <Boton etiqueta="Abrir ajustes" icono="cog-outline" onPress={() => Linking.openSettings()} principal />
    );
  } else {
    icono = 'bell-check-outline';
    titulo = 'Recordatorios activos';
    texto =
      programados === null
        ? 'Te avisaremos 24 horas y 1 hora antes de cada reserva aprobada.'
        : `Te avisaremos 24 horas y 1 hora antes de cada reserva aprobada. Programados: ${programados}.`;
    acciones = (
      <Boton etiqueta="Probar un recordatorio" icono="bell-outline" onPress={probar} cargando={ocupado} />
    );
  }

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <Icon source={icono} size={24} color={colores.primario} />
        <Text variant="titleSmall" style={estilos.titulo} accessibilityRole="header">
          {titulo}
        </Text>
      </View>
      <Text variant="bodyMedium" style={estilos.texto}>
        {texto}
      </Text>

      {estado === 'concedido' && error ? (
        // CA3: el error de la sincronización queda a la vista y se puede reintentar.
        <AvisoError mensaje={`No pudimos programar tus recordatorios: ${error}`}>
          <Button
            mode="outlined"
            onPress={reintentar}
            style={estilos.alinear}
            accessibilityRole="button"
            accessibilityLabel="Reintentar la programación de los recordatorios"
          >
            Reintentar
          </Button>
        </AvisoError>
      ) : null}
      {falla ? <AvisoError mensaje={falla} /> : null}
      {aviso ? (
        <Text variant="bodySmall" style={estilos.texto} accessibilityLiveRegion="polite">
          {aviso}
        </Text>
      ) : null}

      <View style={estilos.acciones}>{acciones}</View>
    </View>
  );
}

function Boton({
  etiqueta,
  icono,
  onPress,
  cargando = false,
  principal = false,
}: {
  etiqueta: string;
  icono: string;
  onPress: () => void;
  cargando?: boolean;
  principal?: boolean;
}) {
  return (
    <Button
      mode={principal ? 'contained' : 'contained-tonal'}
      icon={icono}
      onPress={onPress}
      loading={cargando}
      disabled={cargando}
      contentStyle={estilos.contenidoBoton}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
    >
      {etiqueta}
    </Button>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  titulo: { flex: 1, color: colores.texto, fontFamily: fuentes.seminegrita },
  texto: { color: colores.texto },
  alinear: { alignSelf: 'flex-start' },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
