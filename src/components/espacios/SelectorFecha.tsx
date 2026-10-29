/**
 * Campo de fecha con calendario (HU-20): al tocarlo se abre un mes de lunes a domingo y se
 * elige el día. Los días que no se pueden elegir se ven atenuados, tachados y no se presionan;
 * el lector de pantalla dice por qué. Sin paquetes de calendario: usa src/utils/calendario.ts
 * como la vista mensual de HU-17. Entrega la fecha como texto 'AAAA-MM-DD'.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, Icon, IconButton, Portal, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import { fechaCompleta, grillaMes, inicioMes, numeroDia, sumarMeses, tituloMes } from '@/utils/calendario';
import { esFechaValida } from '@/utils/fechas';

/** Iniciales de lunes a domingo; X es miércoles, para no repetir la M de martes. */
const INICIALES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type Props = {
  etiqueta: string;
  /** 'AAAA-MM-DD' o vacío. */
  valor: string;
  onCambiar: (fecha: string) => void;
  /** Por qué un día no se puede elegir, o null si se puede. */
  motivoNoElegible: (fecha: string) => string | null;
  /** Primer y último mes que se pueden mostrar ('AAAA-MM-DD' de cualquier día del mes). */
  mesMinimo: string;
  mesMaximo: string;
  /** Debajo del campo: el error, o si no hay, una descripción del día elegido. */
  mensajeError?: string;
  descripcion?: string;
  deshabilitado?: boolean;
  /** Campos opcionales: el calendario ofrece "Quitar fecha" para dejarlo vacío. */
  permiteQuitar?: boolean;
};

export function SelectorFecha({
  etiqueta,
  valor,
  onCambiar,
  motivoNoElegible,
  mesMinimo,
  mesMaximo,
  mensajeError,
  descripcion,
  deshabilitado = false,
  permiteQuitar = false,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [mes, setMes] = useState(() => inicioMes(esFechaValida(valor) ? valor : mesMinimo));
  const valido = esFechaValida(valor);

  const abrir = () => {
    setMes(inicioMes(valido ? valor : mesMinimo));
    setAbierto(true);
  };

  const elegir = (fecha: string) => {
    onCambiar(fecha);
    setAbierto(false);
  };

  const quitar = () => {
    onCambiar('');
    setAbierto(false);
  };

  // La leyenda de los días tachados solo se muestra si este mes tiene alguno.
  const hayNoElegibles = grillaMes(mes).some((semana) =>
    semana.some((fecha) => fecha != null && motivoNoElegible(fecha) != null),
  );

  const puedeAnterior = mes > inicioMes(mesMinimo);
  const puedeSiguiente = mes < inicioMes(mesMaximo);

  return (
    <View>
      <TouchableRipple
        onPress={abrir}
        disabled={deshabilitado}
        style={[estilos.campo, mensajeError ? estilos.campoError : null]}
        accessibilityRole="button"
        accessibilityLabel={`${etiqueta}: ${valido ? fechaCompleta(valor) : 'sin elegir'}. Abrir calendario`}
        accessibilityState={{ disabled: deshabilitado }}
      >
        <View style={estilos.contenidoCampo}>
          <Icon source="calendar-month-outline" size={24} color={colores.primario} />
          <View style={estilos.textosCampo}>
            <Text variant="labelMedium" style={estilos.etiqueta}>
              {etiqueta}
            </Text>
            <Text variant="bodyLarge" style={valido ? estilos.valor : estilos.sinValor}>
              {valido ? fechaCompleta(valor) : 'Toca para elegir'}
            </Text>
          </View>
          <Icon source="chevron-down" size={24} color={colores.textoSecundario} />
        </View>
      </TouchableRipple>
      {mensajeError ? (
        <HelperText type="error" visible>
          {mensajeError}
        </HelperText>
      ) : (
        <HelperText type="info" visible={Boolean(descripcion)}>
          {descripcion ?? ''}
        </HelperText>
      )}

      <Portal>
        <Dialog visible={abierto} onDismiss={() => setAbierto(false)} style={estilos.dialogo}>
          <Dialog.Title style={estilos.tituloDialogo}>{etiqueta}</Dialog.Title>
          <Dialog.Content style={estilos.contenidoDialogo}>
            <View style={estilos.navegacion}>
              <IconButton
                icon="chevron-left"
                size={24}
                onPress={() => setMes(sumarMeses(mes, -1))}
                disabled={!puedeAnterior}
                iconColor={colores.primario}
                accessibilityLabel="Mes anterior"
              />
              <Text
                variant="titleMedium"
                style={estilos.tituloMes}
                accessibilityRole="header"
                accessibilityLiveRegion="polite"
              >
                {tituloMes(mes)}
              </Text>
              <IconButton
                icon="chevron-right"
                size={24}
                onPress={() => setMes(sumarMeses(mes, 1))}
                disabled={!puedeSiguiente}
                iconColor={colores.primario}
                accessibilityLabel="Mes siguiente"
              />
            </View>

            {/* Las iniciales son visuales: cada día ya dice su nombre al lector de pantalla. */}
            <View
              style={estilos.fila}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden
            >
              {INICIALES.map((inicial, i) => (
                <Text key={i} variant="labelMedium" style={estilos.inicial}>
                  {inicial}
                </Text>
              ))}
            </View>

            {grillaMes(mes).map((semana, i) => (
              <View key={i} style={estilos.fila}>
                {semana.map((fecha, j) =>
                  fecha ? (
                    <CeldaDia
                      key={fecha}
                      fecha={fecha}
                      elegida={fecha === valor}
                      motivo={motivoNoElegible(fecha)}
                      onPress={() => elegir(fecha)}
                    />
                  ) : (
                    <View key={`vacio-${j}`} style={estilos.celda} />
                  ),
                )}
              </View>
            ))}

            {hayNoElegibles ? (
              <Text variant="bodySmall" style={estilos.leyenda}>
                Los días tachados no se pueden elegir: ya pasaron, son festivos, no hay atención o ya
                tienen un bloqueo.
              </Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            {permiteQuitar && valido ? (
              <Button
                mode="text"
                onPress={quitar}
                contentStyle={estilos.contenidoBoton}
                accessibilityRole="button"
                accessibilityLabel={`Quitar la fecha de ${etiqueta.toLowerCase()}`}
              >
                Quitar fecha
              </Button>
            ) : null}
            <Button
              mode="text"
              onPress={() => setAbierto(false)}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel="Cerrar el calendario"
            >
              Cerrar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

function CeldaDia({
  fecha,
  elegida,
  motivo,
  onPress,
}: {
  fecha: string;
  elegida: boolean;
  motivo: string | null;
  onPress: () => void;
}) {
  if (motivo) {
    return (
      <View
        style={estilos.celda}
        accessible
        accessibilityLabel={`${fechaCompleta(fecha)}, no disponible: ${motivo}`}
      >
        <View style={estilos.contenidoCelda}>
          <Text variant="bodyMedium" style={estilos.numeroNoElegible}>
            {numeroDia(fecha)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[estilos.celda, elegida ? estilos.celdaElegida : estilos.celdaElegible]}>
      <TouchableRipple
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: elegida }}
        accessibilityLabel={`${fechaCompleta(fecha)}${elegida ? ', elegida' : ''}`}
      >
        <View style={estilos.contenidoCelda}>
          <Text variant="bodyMedium" style={elegida ? estilos.numeroElegido : estilos.numero}>
            {numeroDia(fecha)}
          </Text>
        </View>
      </TouchableRipple>
    </View>
  );
}

const estilos = StyleSheet.create({
  campo: {
    borderWidth: 1,
    borderColor: colores.bordeFuerte,
    borderRadius: radio.boton,
    backgroundColor: colores.superficie,
  },
  campoError: { borderColor: colores.error, borderWidth: 2 },
  contenidoCampo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    minHeight: 56,
    paddingHorizontal: espacio.m,
    paddingVertical: espacio.s,
  },
  textosCampo: { flex: 1 },
  etiqueta: { color: colores.textoSecundario },
  valor: { color: colores.texto },
  sinValor: { color: colores.textoSecundario },
  dialogo: { backgroundColor: colores.superficie },
  tituloDialogo: { color: colores.texto, fontFamily: fuentes.negrita },
  contenidoDialogo: { gap: espacio.xs, paddingHorizontal: espacio.m },
  navegacion: { flexDirection: 'row', alignItems: 'center' },
  tituloMes: { flex: 1, textAlign: 'center', color: colores.texto, fontFamily: fuentes.seminegrita },
  fila: { flexDirection: 'row', gap: espacio.xs },
  inicial: { flex: 1, textAlign: 'center', color: colores.textoSecundario },
  celda: { flex: 1, borderRadius: radio.boton, overflow: 'hidden' },
  celdaElegible: { backgroundColor: colores.primarioSuave },
  celdaElegida: { backgroundColor: colores.primario },
  // 44 de alto: área táctil mínima.
  contenidoCelda: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  numero: { color: colores.primarioOscuro, fontFamily: fuentes.seminegrita },
  numeroElegido: { color: colores.superficie, fontFamily: fuentes.negrita },
  numeroNoElegible: {
    color: colores.textoSecundario,
    fontFamily: fuentes.regular,
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  leyenda: { color: colores.textoSecundario, marginTop: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
