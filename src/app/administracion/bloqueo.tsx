/**
 * Bloquear un espacio (HU-20), con ?espacioId=. Se abre desde Gestión → Espacios.
 *
 * 1. El personal arma el bloqueo por franja, día o rango, con su motivo.
 * 2. "Revisar reservas afectadas" muestra las reservas que el bloqueo cancelaría (CA1).
 * 3. Al confirmar, con afectadas se cancelan y se notifica a cada solicitante (CA2);
 *    sin afectadas, el bloqueo se aplica directo (CA3).
 * Cambiar un campo después de revisar descarta la revisión: se confirma solo lo que se vio.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { FilaReserva } from '@/components/espacios/FilaReserva';
import { FormularioBloqueo } from '@/components/espacios/FormularioBloqueo';
import { SinPermiso } from '@/components/personal/SinPermiso';
import {
  AvisoError,
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import { useBloqueos, useConfirmarBloqueo, usePrevisualizarBloqueo } from '@/hooks/useBloqueos';
import { useEspaciosAdministracion } from '@/hooks/useEspacios';
import { useRol } from '@/hooks/useRol';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Bloqueo, Reserva } from '@/types';
import { aDatosBloqueo, periodoLegible, type DatosFormularioBloqueo } from '@/utils/bloqueos';
import { mensajeErrorGuardar } from '@/utils/errores';

type DatosBloqueo = Omit<Bloqueo, 'id'>;

/** Bloqueo revisado y sus reservas afectadas, a la espera de confirmar. */
type Revision = { datos: DatosBloqueo; afectadas: Reserva[] };

/** Bloqueo aplicado y cuántas reservas canceló. */
type Resultado = { bloqueo: Bloqueo; canceladas: number };

export default function BloquearEspacio() {
  const { espacioId } = useLocalSearchParams<{ espacioId?: string }>();
  const { tienePermiso } = useRol();

  return (
    <>
      <EncabezadoApilado titulo="Bloquear espacio" />
      <Pantalla titulo="Bloquear espacio" conEncabezado conTeclado>
        {!tienePermiso('espacios') ? (
          <SinPermiso />
        ) : espacioId ? (
          <GestionBloqueo espacioId={espacioId} />
        ) : (
          <EstadoVacio mensaje="Elige un espacio desde Gestión → Espacios." />
        )}
      </Pantalla>
    </>
  );
}

function GestionBloqueo({ espacioId }: { espacioId: string }) {
  const espacios = useEspaciosAdministracion();
  const bloqueos = useBloqueos(espacioId);
  const previsualizar = usePrevisualizarBloqueo();
  const confirmar = useConfirmarBloqueo();
  const [revision, setRevision] = useState<Revision | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  /** Cambia para montar un formulario vacío después de aplicar un bloqueo. */
  const [intento, setIntento] = useState(0);

  const descartarRevision = () => {
    if (!revision && !previsualizar.error && !confirmar.error) return;
    setRevision(null);
    previsualizar.reset();
    confirmar.reset();
  };

  if (espacios.isPending) return <EstadoCarga mensaje="Cargando el espacio…" />;
  if (espacios.isError) {
    return (
      <EstadoError mensaje="No pudimos cargar el espacio." onReintentar={() => espacios.refetch()} />
    );
  }
  const actual = espacios.data.find((e) => e.id === espacioId);
  if (!actual) return <EstadoVacio mensaje="Este espacio ya no existe." />;

  const revisar = (formulario: DatosFormularioBloqueo) => {
    const datos = aDatosBloqueo(espacioId, formulario);
    confirmar.reset();
    previsualizar.mutate(datos, { onSuccess: (afectadas) => setRevision({ datos, afectadas }) });
  };

  const aplicar = () => {
    if (!revision) return;
    confirmar.mutate(revision.datos, {
      onSuccess: ({ bloqueo, canceladas }) => {
        setRevision(null);
        setResultado({ bloqueo, canceladas: canceladas.length });
      },
    });
  };

  const nuevoBloqueo = () => {
    setResultado(null);
    descartarRevision();
    setIntento((n) => n + 1);
  };

  const error = previsualizar.error ?? confirmar.error;

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.encabezadoEspacio}>
        <Icon source="office-building-outline" size={24} color={colores.primario} />
        <View style={estilos.textos}>
          <Text variant="titleMedium" style={estilos.nombre}>
            {actual.nombre}
          </Text>
          <Text variant="bodySmall" style={estilos.secundario}>
            {actual.horario}
          </Text>
        </View>
      </View>

      {resultado ? (
        <View style={estilos.exito} accessibilityLiveRegion="polite">
          <View style={estilos.fila}>
            <Icon source="check-circle-outline" size={24} color={colores.primarioOscuro} />
            <Text variant="titleMedium" style={estilos.tituloExito}>
              Bloqueo aplicado
            </Text>
          </View>
          <Text variant="bodyMedium" style={estilos.texto}>
            {`${actual.nombre} quedó bloqueado ${periodoLegible(resultado.bloqueo)}.`}
          </Text>
          <Text variant="bodyMedium" style={estilos.texto}>
            {resultado.canceladas > 0
              ? `Se ${resultado.canceladas === 1 ? 'canceló 1 reserva' : `cancelaron ${resultado.canceladas} reservas`} y se notificó a los solicitantes.`
              : 'No había reservas afectadas.'}
          </Text>
          <View style={estilos.acciones}>
            <Button
              mode="contained"
              icon="arrow-left"
              onPress={() => router.back()}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel="Volver a Espacios"
            >
              Volver a Espacios
            </Button>
            <Button
              mode="outlined"
              icon="plus"
              onPress={nuevoBloqueo}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel="Crear otro bloqueo para este espacio"
            >
              Otro bloqueo
            </Button>
          </View>
        </View>
      ) : (
        <>
          <FormularioBloqueo
            key={intento}
            ocupado={previsualizar.isPending || confirmar.isPending}
            onRevisar={revisar}
            onCambio={descartarRevision}
          />

          {error ? <AvisoError mensaje={mensajeErrorGuardar(error)} /> : null}

          {revision ? (
            <PanelRevision
              revision={revision}
              aplicando={confirmar.isPending}
              onAplicar={aplicar}
            />
          ) : null}
        </>
      )}

      <View style={estilos.grupo}>
        <Text variant="titleSmall" style={estilos.nombre}>
          Bloqueos registrados
        </Text>
        {bloqueos.isPending ? (
          <EstadoCarga mensaje="Cargando bloqueos…" />
        ) : bloqueos.isError ? (
          <EstadoError
            mensaje="No pudimos cargar los bloqueos."
            onReintentar={() => bloqueos.refetch()}
          />
        ) : bloqueos.data.length === 0 ? (
          <EstadoVacio mensaje="Este espacio no tiene bloqueos." />
        ) : (
          [...bloqueos.data]
            .sort((a, b) => a.desde.localeCompare(b.desde))
            .map((bloqueo) => (
              <View key={bloqueo.id} style={estilos.bloqueo}>
                <Text variant="labelLarge" style={estilos.periodo}>
                  {periodoLegible(bloqueo)}
                </Text>
                <Text variant="bodyMedium" style={estilos.secundario}>
                  {bloqueo.motivo}
                </Text>
              </View>
            ))
        )}
      </View>
    </View>
  );
}

type PropsRevision = {
  revision: Revision;
  aplicando: boolean;
  onAplicar: () => void;
};

/** Reservas afectadas por el bloqueo revisado (CA1) y la confirmación (CA2 o CA3). */
function PanelRevision({ revision, aplicando, onAplicar }: PropsRevision) {
  const { datos, afectadas } = revision;
  const cantidad = afectadas.length;

  return (
    <View style={estilos.panel} accessibilityLiveRegion="polite">
      <Text variant="titleSmall" style={estilos.nombre}>
        {`Bloqueo ${periodoLegible(datos)}`}
      </Text>

      {cantidad > 0 ? (
        <>
          <AvisoError
            mensaje={`${cantidad === 1 ? 'Hay 1 reserva afectada' : `Hay ${cantidad} reservas afectadas`}. Al confirmar se cancelan y se notifica a cada solicitante.`}
          />
          {afectadas.map((reserva) => (
            <FilaReserva key={reserva.id} reserva={reserva} />
          ))}
        </>
      ) : (
        <Text variant="bodyMedium" style={estilos.texto}>
          No hay reservas afectadas: el bloqueo se aplica directamente.
        </Text>
      )}

      <Button
        mode="contained"
        icon="lock-outline"
        onPress={onAplicar}
        loading={aplicando}
        disabled={aplicando}
        buttonColor={cantidad > 0 ? colores.error : undefined}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel={
          cantidad > 0
            ? `Bloquear y cancelar ${cantidad} ${cantidad === 1 ? 'reserva' : 'reservas'}`
            : 'Aplicar bloqueo'
        }
      >
        {cantidad > 0
          ? `Bloquear y cancelar ${cantidad === 1 ? '1 reserva' : `${cantidad} reservas`}`
          : 'Aplicar bloqueo'}
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.m },
  encabezadoEspacio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  textos: { flex: 1, gap: espacio.xs },
  nombre: { color: colores.texto, fontFamily: fuentes.negrita },
  secundario: { color: colores.textoSecundario },
  texto: { color: colores.texto },
  panel: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  exito: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioSuave,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  tituloExito: { color: colores.primarioOscuro, fontFamily: fuentes.negrita },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  grupo: { gap: espacio.s },
  bloqueo: {
    gap: espacio.xs,
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.superficie,
  },
  periodo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  contenidoBoton: { paddingVertical: espacio.xs },
});
