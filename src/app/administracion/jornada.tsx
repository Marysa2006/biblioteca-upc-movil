/**
 * Crear o editar una jornada de asesoría (HU-13). Sin ?id= crea; con ?id= edita.
 *
 * - CA1: al guardar se generan las franjas; la pantalla dice cuántas quedaron.
 * - CA2: si se traslapa con otra jornada del facilitador, el formulario pide ajustarla (y la
 *   API lo vuelve a revisar).
 * - CA3: las fechas excluidas no generan franjas.
 * El formulario valida con los parámetros de HU-28, los temas, las jornadas y los
 * facilitadores, así que la pantalla espera a tenerlos antes de mostrarlo.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { FormularioJornada } from '@/components/asesorias/FormularioJornada';
import { SinPermiso } from '@/components/personal/SinPermiso';
import {
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import { useGuardarJornada, useJornadas, useTemas } from '@/hooks/useAsesorias';
import { useParametros } from '@/hooks/useParametros';
import { useRol } from '@/hooks/useRol';
import { useUsuarios } from '@/hooks/useUsuarios';
import { colores, espacio, fuentes, radio } from '@/theme';
import { mensajeErrorGuardar } from '@/utils/errores';
import { tieneRol } from '@/utils/roles';

export default function EditarJornada() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { tienePermiso } = useRol();
  const titulo = id ? 'Editar jornada' : 'Nueva jornada';

  return (
    <>
      <EncabezadoApilado titulo={titulo} />
      <Pantalla titulo={titulo} conEncabezado conTeclado>
        {tienePermiso('asesorias') ? <Formulario id={id} /> : <SinPermiso />}
      </Pantalla>
    </>
  );
}

function Formulario({ id }: { id?: string }) {
  const parametros = useParametros();
  const temas = useTemas();
  const jornadas = useJornadas();
  const usuarios = useUsuarios();
  const guardar = useGuardarJornada();
  const [franjasGeneradas, setFranjasGeneradas] = useState<number | null>(null);

  const consultas = [parametros, temas, jornadas, usuarios];
  if (consultas.some((c) => c.isPending)) {
    return <EstadoCarga mensaje="Cargando temas, facilitadores y horarios…" />;
  }
  if (!parametros.data || !temas.data || !jornadas.data || !usuarios.data) {
    return (
      <EstadoError
        mensaje="No pudimos cargar los datos para la jornada."
        onReintentar={() => consultas.forEach((c) => c.refetch())}
      />
    );
  }

  const original = id ? jornadas.data.find((jornada) => jornada.id === id) : undefined;
  if (id && !original) return <EstadoVacio mensaje="Esta jornada ya no existe." />;

  if (franjasGeneradas != null) {
    return (
      <View style={estilos.exito} accessibilityLiveRegion="polite">
        <View style={estilos.fila}>
          <Icon source="check-circle-outline" size={24} color={colores.primarioOscuro} />
          <Text variant="titleMedium" style={estilos.tituloExito}>
            {original ? 'Jornada actualizada' : 'Jornada creada'}
          </Text>
        </View>
        <Text variant="bodyMedium" style={estilos.texto}>
          {franjasGeneradas > 0
            ? `Se ${franjasGeneradas === 1 ? 'generó 1 franja' : `generaron ${franjasGeneradas} franjas`} para agendar asesorías.`
            : 'La jornada quedó guardada, pero no generó franjas: está inactiva o sus fechas no son hábiles.'}
        </Text>
        <Button
          mode="contained"
          icon="arrow-left"
          onPress={() => router.back()}
          style={estilos.boton}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Volver a Asesorías y jornadas"
        >
          Volver a Asesorías y jornadas
        </Button>
      </View>
    );
  }

  const facilitadores = usuarios.data.filter(
    (usuario) => tieneRol(usuario, 'facilitador') || usuario.id === original?.facilitadorId,
  );

  return (
    <FormularioJornada
      parametros={parametros.data}
      temas={temas.data}
      jornadas={jornadas.data}
      facilitadores={facilitadores}
      original={original}
      guardando={guardar.isPending}
      mensajeError={guardar.error ? mensajeErrorGuardar(guardar.error) : null}
      onGuardar={(datos) => {
        guardar.reset();
        guardar.mutate(datos, {
          onSuccess: (resultado) => setFranjasGeneradas(resultado.franjasGeneradas),
        });
      }}
    />
  );
}

const estilos = StyleSheet.create({
  exito: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioSuave,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  tituloExito: { color: colores.primarioOscuro, fontFamily: fuentes.negrita },
  texto: { color: colores.texto },
  boton: { alignSelf: 'flex-start', marginTop: espacio.xs },
  contenidoBoton: { paddingVertical: espacio.xs },
});
