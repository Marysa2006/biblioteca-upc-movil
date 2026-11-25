/**
 * «¿Cómo te pareció?» en el detalle de una asesoría o una capacitación realizada (#255).
 * - Sin calificar: cinco estrellas (cada una un botón de 44×44 que dice su valor y si está
 *   seleccionada), el nombre del puntaje en texto, un comentario opcional y Enviar.
 * - Ya calificada: "Calificaste con 4 de 5, Muy bueno" y el comentario.
 * - Si no está realizada o la persona no asistió, no se muestra (CA3).
 * Las reglas las decide la API (calificarSolicitud, #254); aquí solo se valida antes de enviar.
 *
 * Patrón de datos: useCalificarSolicitud() (src/hooks) → src/api → mock o API.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, HelperText, Icon, Text, TextInput, TouchableRipple } from 'react-native-paper';

import { AvisoError } from '@/components/ui';
import { useCalificarSolicitud, type TipoCalificable } from '@/hooks/useSolicitudes';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Calificacion } from '@/types';
import {
  LARGO_MAXIMO_COMENTARIO,
  porCalificar,
  problemaCalificacion,
  PUNTAJE_MAXIMO,
  textoPuntaje,
} from '@/utils/calificacion';
import { mensajeErrorGuardar } from '@/utils/errores';

const PUNTAJES = Array.from({ length: PUNTAJE_MAXIMO }, (_, i) => i + 1);
const TAMANO_ESTRELLA = 32;

type Props = {
  tipo: TipoCalificable;
  solicitud: { id: string; estado: string; calificacion?: Calificacion; asistio?: boolean };
};

export function SeccionCalificacion({ tipo, solicitud }: Props) {
  const calificar = useCalificarSolicitud();
  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState('');
  const [problema, setProblema] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // En Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) AccessibilityInfo.announceForAccessibility(aviso);
  }, [aviso]);

  const { calificacion } = solicitud;
  if (!calificacion && !porCalificar(solicitud)) return null;

  const enviar = () => {
    const datos = { puntaje, comentario };
    const error = problemaCalificacion(datos);
    setProblema(error);
    if (error) return;
    calificar.mutate(
      { tipo, id: solicitud.id, ...datos },
      { onSuccess: () => setAviso('¡Gracias por calificar! Tu opinión nos ayuda a mejorar.') },
    );
  };

  return (
    <View style={estilos.seccion}>
      <Text variant="titleSmall" style={estilos.titulo} accessibilityRole="header">
        ¿Cómo te pareció?
      </Text>

      {aviso ? (
        <View style={estilos.aviso} accessibilityLiveRegion="polite">
          <Icon source="check-circle-outline" size={20} color={colores.primario} />
          <Text variant="bodyMedium" style={estilos.textoAviso}>
            {aviso}
          </Text>
        </View>
      ) : null}

      <View style={estilos.tarjeta}>
        {calificacion ? (
          <Calificada calificacion={calificacion} />
        ) : (
          <>
            <Text variant="bodyMedium" style={estilos.texto}>
              Califica el servicio de 1 a 5. Solo se puede una vez.
            </Text>
            <View style={estilos.estrellas}>
              {PUNTAJES.map((valor) => {
                const elegida = valor === puntaje;
                return (
                  <TouchableRipple
                    key={valor}
                    onPress={() => {
                      setPuntaje(valor);
                      setProblema(null);
                    }}
                    disabled={calificar.isPending}
                    borderless
                    style={estilos.estrella}
                    accessibilityRole="button"
                    accessibilityLabel={textoPuntaje(valor)}
                    accessibilityState={{ selected: elegida, disabled: calificar.isPending }}
                  >
                    <Icon
                      source={valor <= puntaje ? 'star' : 'star-outline'}
                      size={TAMANO_ESTRELLA}
                      color={valor <= puntaje ? colores.primario : colores.bordeFuerte}
                    />
                  </TouchableRipple>
                );
              })}
            </View>
            {/* El valor también en texto, no solo en el color de las estrellas. */}
            <Text variant="labelLarge" style={estilos.valor}>
              {puntaje > 0 ? textoPuntaje(puntaje) : 'Sin puntaje todavía'}
            </Text>

            <View>
              <TextInput
                mode="outlined"
                label="Comentario (opcional)"
                value={comentario}
                onChangeText={setComentario}
                disabled={calificar.isPending}
                multiline
                maxLength={LARGO_MAXIMO_COMENTARIO}
                accessibilityLabel="Comentario sobre el servicio, opcional"
              />
              <HelperText type="info" visible>
                {`${comentario.length} de ${LARGO_MAXIMO_COMENTARIO} caracteres`}
              </HelperText>
            </View>

            {problema ? <AvisoError mensaje={problema} /> : null}
            {calificar.error ? <AvisoError mensaje={mensajeErrorGuardar(calificar.error)} /> : null}

            <Button
              mode="contained"
              icon="send"
              onPress={enviar}
              loading={calificar.isPending}
              disabled={calificar.isPending}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel={
                puntaje > 0
                  ? `Enviar la calificación: ${textoPuntaje(puntaje)}`
                  : 'Enviar la calificación'
              }
            >
              Enviar
            </Button>
          </>
        )}
      </View>
    </View>
  );
}

/** Solo lectura: las estrellas son decorativas y el texto dice el puntaje. */
function Calificada({ calificacion }: { calificacion: Calificacion }) {
  return (
    <>
      <View
        style={estilos.estrellasLectura}
        accessible
        accessibilityLabel={`Calificaste con ${textoPuntaje(calificacion.puntaje)}`}
      >
        {PUNTAJES.map((valor) => (
          <Icon
            key={valor}
            source={valor <= calificacion.puntaje ? 'star' : 'star-outline'}
            size={24}
            color={valor <= calificacion.puntaje ? colores.primario : colores.bordeFuerte}
          />
        ))}
      </View>
      <Text variant="bodyMedium" style={estilos.valor}>
        {`Calificaste con ${textoPuntaje(calificacion.puntaje)}`}
      </Text>
      {calificacion.comentario ? (
        <Text variant="bodyMedium" style={estilos.texto}>
          {`«${calificacion.comentario}»`}
        </Text>
      ) : null}
    </>
  );
}

const estilos = StyleSheet.create({
  seccion: { gap: espacio.s },
  titulo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  tarjeta: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  texto: { color: colores.texto },
  valor: { color: colores.texto, fontFamily: fuentes.seminegrita },
  // Con letra grande, las estrellas pasan a la siguiente línea en vez de salirse.
  estrellas: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.xs },
  // 44×44 de área táctil, como en la Agenda.
  estrella: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radio.tarjeta,
  },
  estrellasLectura: { flexDirection: 'row', gap: espacio.xs },
  // Sobre el fondo de color, el texto va en colores.texto (contraste AA).
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioSuave,
  },
  textoAviso: { flexShrink: 1, color: colores.texto },
  contenidoBoton: { paddingVertical: espacio.xs },
});
