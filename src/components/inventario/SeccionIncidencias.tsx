import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Text, TextInput } from 'react-native-paper';

import { SelectorFecha } from '@/components/espacios/SelectorFecha';
import { EstadoCarga, EstadoError, EstadoVacio } from '@/components/ui';
import {
  TIPOS_INCIDENCIA_TABLET,
  useIncidenciasTablets,
  type FiltrosIncidenciasTablet,
} from '@/hooks/useTablets';
import { espacio } from '@/theme';
import { sumarMeses } from '@/utils/calendario';
import { fechaLegible, hoyISO } from '@/utils/fechas';
import { normalizarTexto } from '@/utils/texto';

export function SeccionIncidencias() {
  const [filtros, setFiltros] = useState<FiltrosIncidenciasTablet>({});
  const [busqueda, setBusqueda] = useState('');
  const consulta = useIncidenciasTablets(filtros);
  const texto = normalizarTexto(busqueda);
  const hoy = hoyISO();
  const incidencias = (consulta.data ?? []).filter((fila) =>
    normalizarTexto(
      [
        fila.prestamoId,
        fila.solicitudId,
        fila.tablet,
        fila.solicitante,
        fila.descripcion,
        fila.reporto,
      ].join(' '),
    ).includes(texto),
  );

  return (
    <View style={estilos.lista}>
      <TextInput
        mode="outlined"
        label="Buscar incidencias"
        value={busqueda}
        onChangeText={setBusqueda}
      />
      <View style={estilos.filtros}>
        <Chip selected={!filtros.tipo} onPress={() => setFiltros({ ...filtros, tipo: undefined })}>
          Todos
        </Chip>
        {Object.entries(TIPOS_INCIDENCIA_TABLET).map(([tipo, etiqueta]) => (
          <Chip
            key={tipo}
            selected={filtros.tipo === tipo}
            onPress={() =>
              setFiltros({ ...filtros, tipo: tipo as FiltrosIncidenciasTablet['tipo'] })
            }
          >
            {etiqueta}
          </Chip>
        ))}
      </View>
      <SelectorFecha
        etiqueta="Desde"
        valor={filtros.desde ?? ''}
        permiteQuitar
        onCambiar={(desde) => setFiltros({ ...filtros, desde: desde || undefined })}
        mesMinimo={sumarMeses(hoy, -120)}
        mesMaximo={hoy}
        mesInicial={hoy}
        motivoNoElegible={(fecha) =>
          filtros.hasta && fecha > filtros.hasta ? 'Es posterior a Hasta' : null
        }
      />
      <SelectorFecha
        etiqueta="Hasta"
        valor={filtros.hasta ?? ''}
        permiteQuitar
        onCambiar={(hasta) => setFiltros({ ...filtros, hasta: hasta || undefined })}
        mesMinimo={sumarMeses(hoy, -120)}
        mesMaximo={hoy}
        mesInicial={hoy}
        motivoNoElegible={(fecha) =>
          filtros.desde && fecha < filtros.desde ? 'Es anterior a Desde' : null
        }
      />
      {consulta.isPending ? (
        <EstadoCarga mensaje="Cargando incidencias…" />
      ) : consulta.isError ? (
        <EstadoError
          mensaje="No pudimos cargar las incidencias."
          onReintentar={() => void consulta.refetch()}
        />
      ) : incidencias.length === 0 ? (
        <EstadoVacio mensaje="No hay incidencias con estos filtros." />
      ) : (
        incidencias.map((fila) => (
          <Card key={fila.id} mode="outlined">
            <Card.Content style={estilos.lista}>
              <Text variant="titleMedium" accessibilityRole="header">
                {fila.etiqueta}
              </Text>
              <Text>
                {fila.solicitante} · Préstamo {fila.prestamoId}
              </Text>
              {fila.tablet ? <Text>Tablet {fila.tablet}</Text> : null}
              <Text>{fila.descripcion || 'Sin descripción'}</Text>
              <Text>Reportó: {fila.reporto ?? 'Sistema'}</Text>
              <Text>
                {fechaLegible(fila.fechaHora.slice(0, 10))} · {fila.fechaHora.slice(11, 16)}
              </Text>
            </Card.Content>
          </Card>
        ))
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espacio.s },
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
});
