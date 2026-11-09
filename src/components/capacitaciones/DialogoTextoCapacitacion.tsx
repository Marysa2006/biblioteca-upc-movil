/**
 * Diálogo con un texto obligatorio para una solicitud de capacitación (HU-12):
 * - `rechazar`: el motivo del rechazo (CA2). Sin motivo no se envía, y la API lo vuelve a validar.
 * - `cerrar`: marcarla como realizada con el resultado (CA3), después de dictarla. Dice quién
 *   es el responsable, que se asigna antes. En la API es cerrarCapacitacion().
 * El usuario recibe el texto en la notificación. No guarda: el detalle llama a la mutación con
 * onConfirmar. Va en un Portal, fuera del QueryClientProvider: recibe todo por props.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, Portal, Text, TextInput } from 'react-native-paper';
import { z } from 'zod';

import { AvisoError } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes } from '@/theme';
import type { SolicitudCapacitacion } from '@/types';
import { esquemaResultado, LARGO_MAXIMO_RESULTADO } from '@/utils/capacitaciones';
import { fechaLegible } from '@/utils/fechas';
import { esquemaMotivo } from '@/utils/reservas';

export type TipoTextoCapacitacion = 'rechazar' | 'cerrar';

type Props = {
  /** El diálogo se muestra mientras no sea null. */
  tipo: TipoTextoCapacitacion | null;
  solicitud: SolicitudCapacitacion;
  guardando: boolean;
  mensajeError: string | null;
  onConfirmar: (texto: string) => void;
  onCerrar: () => void;
};

const TEXTOS: Record<
  TipoTextoCapacitacion,
  { titulo: string; explicacion?: string; etiqueta: string; placeholder: string; boton: string }
> = {
  rechazar: {
    titulo: 'Rechazar la solicitud',
    etiqueta: 'Motivo',
    placeholder: 'Por ejemplo: no hay facilitador disponible esa semana',
    boton: 'Rechazar',
  },
  cerrar: {
    titulo: 'Registrar el resultado',
    explicacion:
      'Hazlo después de dictar la capacitación. La solicitud queda Realizada y el usuario recibe el resultado.',
    etiqueta: `Resultado (hasta ${LARGO_MAXIMO_RESULTADO} caracteres)`,
    placeholder: 'Por ejemplo: asistieron 22 personas y se entregó la guía',
    boton: 'Marcar como realizada',
  },
};

export function DialogoTextoCapacitacion({ tipo, ...props }: Props) {
  return (
    <Portal>
      <Dialog visible={tipo != null} onDismiss={props.onCerrar} style={estilos.dialogo}>
        {tipo ? (
          // key: al abrirlo para otra acción, el texto vuelve a empezar.
          <Contenido key={tipo} tipo={tipo} {...props} />
        ) : null}
      </Dialog>
    </Portal>
  );
}

type Valores = { texto: string };

function Contenido({
  tipo,
  solicitud,
  guardando,
  mensajeError,
  onConfirmar,
  onCerrar,
}: Omit<Props, 'tipo'> & { tipo: TipoTextoCapacitacion }) {
  const rechazar = tipo === 'rechazar';
  const textos = TEXTOS[tipo];
  const { control, handleSubmit } = useForm<Valores>({
    // Cada acción usa la regla de su esquema (motivo o resultado) sobre el mismo campo.
    resolver: zodResolver(
      z.object({
        texto: rechazar ? esquemaMotivo.shape.motivo : esquemaResultado.shape.resultado,
      }),
    ),
    defaultValues: { texto: '' },
  });

  return (
    <>
      <Dialog.Title style={estilos.titulo}>{textos.titulo}</Dialog.Title>
      <Dialog.Content style={estilos.contenido}>
        <Text variant="bodyMedium" style={estilos.texto}>
          {`${solicitud.solicitante.nombre} · ${solicitud.linea}, ${fechaLegible(solicitud.fecha)}`}
        </Text>
        {textos.explicacion ? (
          <Text variant="bodyMedium" style={estilos.texto}>
            {textos.explicacion}
          </Text>
        ) : null}
        {!rechazar && solicitud.responsable ? (
          <Text variant="bodyMedium" style={estilos.texto}>
            {`Responsable: ${solicitud.responsable}`}
          </Text>
        ) : null}
        <Controller
          control={control}
          name="texto"
          render={({ field: { ref, value, onChange, onBlur }, fieldState: { error } }) => (
            <View>
              <TextInput
                ref={ref}
                mode="outlined"
                label={textos.etiqueta}
                placeholder={textos.placeholder}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={error != null}
                disabled={guardando}
                multiline
                accessibilityLabel={
                  rechazar ? 'Motivo del rechazo' : 'Resultado de la capacitación'
                }
              />
              <HelperText type="error" visible={error != null}>
                {error?.message}
              </HelperText>
            </View>
          )}
        />
        {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}
      </Dialog.Content>

      <Dialog.Actions style={estilos.acciones}>
        <Button
          mode="text"
          onPress={onCerrar}
          disabled={guardando}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Volver sin guardar"
        >
          Volver
        </Button>
        <Button
          mode="contained"
          onPress={() => handleSubmit(({ texto }) => onConfirmar(texto.trim()))()}
          loading={guardando}
          disabled={guardando}
          buttonColor={rechazar ? coloresEstado.rechazada.texto : undefined}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`${textos.boton}: solicitud de ${solicitud.solicitante.nombre}`}
        >
          {textos.boton}
        </Button>
      </Dialog.Actions>
    </>
  );
}

const estilos = StyleSheet.create({
  dialogo: { backgroundColor: colores.superficie },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  contenido: { gap: espacio.s },
  texto: { color: colores.texto },
  // Con letra grande, los botones pasan a otra línea en vez de cortarse.
  acciones: { flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
