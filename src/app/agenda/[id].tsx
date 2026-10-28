/**
 * Detalle de una cita de la agenda (HU-15). Pantalla apilada; se abre desde Gestión → Agenda con
 * ?id, desde y hasta: reutiliza la consulta de la semana de la agenda, así que sale de la caché.
 * - CA2: quién pidió la cita (tipo y programa si se conocen), qué necesita y los datos de la cita.
 * - CA3: si la cita aprobada ya terminó, se registra el resultado o, con confirmación, que la
 *   persona no asistió. Al guardar, la agenda y el detalle se refrescan solos.
 * Solo con el permiso `asesorias`; la administración ve las citas de todos los facilitadores.
 *
 * Patrón de datos: useAgenda() / useRegistrarResultado() / useRegistrarInasistencia()
 * (src/hooks) → src/api/asesorias.ts → mock o API.
 */
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { DetalleCitaAgenda } from '@/components/agenda/DetalleCitaAgenda';
import { DialogoInasistencia } from '@/components/agenda/DialogoInasistencia';
import { FormularioResultado } from '@/components/agenda/FormularioResultado';
import { SinPermiso } from '@/components/personal/SinPermiso';
import { EncabezadoApilado, EstadoCarga, EstadoError, EstadoVacio, Pantalla } from '@/components/ui';
import { useAgenda, useRegistrarInasistencia, useRegistrarResultado } from '@/hooks/useAsesorias';
import { useRol } from '@/hooks/useRol';
import { colores, espacio, radio } from '@/theme';
import { puedeRegistrarResultado } from '@/utils/agenda';
import { mensajeErrorGuardar } from '@/utils/errores';

type Parametros = { id: string; desde: string; hasta: string };

const TITULO = 'Detalle de la cita';

export default function DetalleCita() {
  const { tienePermiso } = useRol();

  return (
    <>
      <EncabezadoApilado titulo="Agenda" />
      <Pantalla titulo={TITULO} conEncabezado conTeclado>
        {tienePermiso('asesorias') ? <Detalle /> : <SinPermiso />}
      </Pantalla>
    </>
  );
}

function Detalle() {
  const { id, desde, hasta } = useLocalSearchParams<Parametros>();
  const { esAdministrador } = useRol();
  const agenda = useAgenda(desde ?? '', hasta ?? '', esAdministrador ? 'todas' : undefined);
  const registrarResultado = useRegistrarResultado();
  const registrarInasistencia = useRegistrarInasistencia();
  const [preguntarInasistencia, setPreguntarInasistencia] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // En Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) AccessibilityInfo.announceForAccessibility(aviso);
  }, [aviso]);

  if (agenda.isPending) return <EstadoCarga mensaje="Cargando la cita…" />;
  if (agenda.isError) {
    return <EstadoError mensaje="No pudimos cargar la cita." onReintentar={() => agenda.refetch()} />;
  }
  const cita = agenda.data.find((actual) => actual.id === id);
  if (!cita) return <EstadoVacio mensaje="No encontramos esta cita en la agenda." />;

  const guardarResultado = (resultado: string) => {
    registrarResultado.mutate(
      { citaId: cita.id, resultado },
      { onSuccess: () => setAviso('Guardamos el resultado de la asesoría.') },
    );
  };

  const abrirInasistencia = () => {
    registrarInasistencia.reset();
    setPreguntarInasistencia(true);
  };

  const confirmarInasistencia = () => {
    registrarInasistencia.mutate(cita.id, {
      onSuccess: () => {
        setPreguntarInasistencia(false);
        setAviso('Registramos que la persona no asistió.');
      },
    });
  };

  return (
    <View style={estilos.contenido}>
      {aviso ? (
        <View style={estilos.aviso} accessibilityLiveRegion="polite">
          <Text variant="bodyMedium" style={estilos.textoAviso}>
            {aviso}
          </Text>
        </View>
      ) : null}

      <DetalleCitaAgenda cita={cita} />

      {puedeRegistrarResultado(cita) ? (
        <FormularioResultado
          guardando={registrarResultado.isPending}
          mensajeError={registrarResultado.error ? mensajeErrorGuardar(registrarResultado.error) : null}
          onGuardar={guardarResultado}
          onNoAsistio={abrirInasistencia}
        />
      ) : null}

      <DialogoInasistencia
        cita={preguntarInasistencia ? cita : null}
        guardando={registrarInasistencia.isPending}
        mensajeError={
          registrarInasistencia.error ? mensajeErrorGuardar(registrarInasistencia.error) : null
        }
        onConfirmar={confirmarInasistencia}
        onCerrar={() => setPreguntarInasistencia(false)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: espacio.m },
  // Sobre el fondo de color, el texto va en colores.texto (contraste AA).
  aviso: { padding: espacio.m, borderRadius: radio.tarjeta, backgroundColor: colores.primarioSuave },
  textoAviso: { color: colores.texto },
});
