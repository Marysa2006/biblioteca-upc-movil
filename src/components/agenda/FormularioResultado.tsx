/**
 * Registrar cómo fue una cita que ya terminó (HU-15, CA3): el resultado, o que la persona
 * no asistió. Se valida antes de enviar; "No asistió" pide confirmación en DialogoInasistencia.
 * No guarda: la pantalla del detalle llama a los hooks de la cita con onGuardar y onNoAsistio.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { CampoFormulario } from '@/components/reservas/CampoFormulario';
import { AvisoError } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import { esquemaResultado, type DatosResultado } from '@/utils/agenda';

type Props = {
  guardando: boolean;
  /** Error de la API al guardar, con mensajeErrorGuardar(). */
  mensajeError: string | null;
  onGuardar: (resultado: string) => void;
  onNoAsistio: () => void;
};

export function FormularioResultado({ guardando, mensajeError, onGuardar, onNoAsistio }: Props) {
  const { control, handleSubmit } = useForm<DatosResultado>({
    resolver: zodResolver(esquemaResultado),
    defaultValues: { resultado: '' },
  });

  return (
    <View style={estilos.tarjeta}>
      <Text variant="titleSmall" style={estilos.titulo} accessibilityRole="header">
        Registrar la asesoría
      </Text>
      <Text variant="bodyMedium" style={estilos.texto}>
        Cuenta qué se trabajó y qué queda pendiente. Si la persona no llegó, registra la inasistencia.
      </Text>

      <CampoFormulario
        control={control}
        nombre="resultado"
        etiqueta="Resultado de la asesoría"
        placeholder="Por ejemplo: revisamos las normas APA y quedó pendiente la bibliografía"
        multilinea
        deshabilitado={guardando}
      />

      {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}

      <View style={estilos.acciones}>
        <Button
          mode="contained"
          onPress={handleSubmit(({ resultado }) => onGuardar(resultado.trim()))}
          loading={guardando}
          disabled={guardando}
          style={estilos.boton}
          contentStyle={estilos.contenidoBoton}
          labelStyle={estilos.textoBoton}
          accessibilityRole="button"
          accessibilityLabel="Guardar el resultado de la asesoría"
        >
          Guardar resultado
        </Button>
        <Button
          mode="outlined"
          onPress={onNoAsistio}
          disabled={guardando}
          textColor={coloresEstado.rechazada.texto}
          style={estilos.boton}
          contentStyle={estilos.contenidoBoton}
          labelStyle={estilos.textoBoton}
          accessibilityRole="button"
          accessibilityLabel="Registrar que la persona no asistió"
        >
          No asistió
        </Button>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  titulo: { color: colores.primario, fontFamily: fuentes.seminegrita },
  texto: { color: colores.texto },
  // Los botones se reparten la fila y, con letra grande, pasan a la siguiente.
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  boton: { flexGrow: 1 },
  contenidoBoton: { paddingVertical: espacio.xs },
  textoBoton: { fontFamily: fuentes.seminegrita },
});
