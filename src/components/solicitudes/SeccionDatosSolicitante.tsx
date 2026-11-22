/**
 * «Tus datos» de una solicitud (#251; la usa primero la asesoría, #249): lo que la sesión y el
 * perfil ya saben, prellenado con datosSolicitanteDe() y editable. Las reglas son las de #224
 * (camposSolicitante y reglasSolicitante): nivel, facultad, programa y semestre son obligatorios
 * solo para estudiantes, y el semestre solo se pide a ellos.
 *
 * Es controlado y no depende de react-hook-form: recibe los valores y los errores, y avisa con
 * onCambiar. Así la pueden usar la asesoría, la capacitación, la reserva y la tablet.
 * El tipo de usuario sale de la sesión: se muestra, no se elige.
 */
import { StyleSheet, View, type KeyboardTypeOptions } from 'react-native';
import { Chip, HelperText, RadioButton, Text, TextInput } from 'react-native-paper';

import { SelectorSemestre } from '@/components/autenticacion/SelectorSemestre';
import { AvisoError } from '@/components/ui';
import { colores, espacio, fuentes } from '@/theme';
import type { TipoUsuario } from '@/types';
import { FACULTADES, NIVELES_FORMACION, NOMBRE_NIVEL_FORMACION } from '@/utils/constantes';
import { NOMBRE_TIPO } from '@/utils/roles';
import {
  LARGO_MAXIMO_DATO_ACADEMICO,
  LARGO_MAXIMO_NOMBRE,
  type ValoresSolicitante,
} from '@/utils/solicitante';

export type CampoSolicitante = keyof ValoresSolicitante;

type Props = {
  valores: ValoresSolicitante;
  onCambiar: (campo: CampoSolicitante, valor: string) => void;
  errores: Partial<Record<CampoSolicitante, string>>;
  /** La reserva pide la identificación; la asesoría y la capacitación no. */
  pedirIdentificacion?: boolean;
  deshabilitado?: boolean;
};

/** Lleva el chip a 48 px de área táctil sin cambiar su tamaño visible. */
const AREA_CHIP = { top: espacio.s, bottom: espacio.s };

export function SeccionDatosSolicitante({
  valores,
  onCambiar,
  errores,
  pedirIdentificacion = false,
  deshabilitado = false,
}: Props) {
  const esEstudiante = valores.tipo === 'estudiante';
  const opcional = esEstudiante ? '' : ' (opcional)';
  const nombreTipo = NOMBRE_TIPO[valores.tipo as TipoUsuario] ?? 'Sin tipo';
  // La facultad del perfil que no está en la lista también se ofrece, para no perderla.
  const facultades =
    valores.facultad && !FACULTADES.includes(valores.facultad)
      ? [...FACULTADES, valores.facultad]
      : FACULTADES;

  const texto = (
    campo: CampoSolicitante,
    etiqueta: string,
    opciones: {
      largoMaximo?: number;
      teclado?: KeyboardTypeOptions;
      autoCapitalize?: 'none' | 'words' | 'sentences';
      soloDigitos?: boolean;
      ayuda?: string;
    } = {},
  ) => (
    <CampoTexto
      etiqueta={etiqueta}
      valor={valores[campo]}
      onCambiar={(valor) =>
        onCambiar(campo, opciones.soloDigitos ? valor.replace(/\D/g, '') : valor)
      }
      mensajeError={errores[campo]}
      ayuda={opciones.ayuda}
      deshabilitado={deshabilitado}
      largoMaximo={opciones.largoMaximo}
      teclado={opciones.teclado}
      autoCapitalize={opciones.autoCapitalize}
    />
  );

  return (
    <View style={estilos.seccion}>
      <View
        style={estilos.tipo}
        accessible
        accessibilityLabel={`Tipo de usuario: ${nombreTipo}. Sale de tu cuenta`}
      >
        <Text variant="labelMedium" style={estilos.etiqueta}>
          Tipo de usuario
        </Text>
        <Text variant="bodyLarge" style={estilos.valor}>
          {nombreTipo}
        </Text>
      </View>
      {errores.tipo ? <AvisoError mensaje={errores.tipo} /> : null}

      {texto('nombreCompleto', 'Nombre completo', {
        largoMaximo: LARGO_MAXIMO_NOMBRE,
        autoCapitalize: 'words',
      })}
      {texto(
        'identificacion',
        pedirIdentificacion ? 'Número de identificación' : 'Número de identificación (opcional)',
        { largoMaximo: 15, teclado: 'number-pad', soloDigitos: true },
      )}
      {texto('correo', 'Correo institucional', {
        teclado: 'email-address',
        autoCapitalize: 'none',
        ayuda: 'El personal te escribe al correo solo si es estrictamente necesario.',
      })}
      {texto('celular', 'Celular', { largoMaximo: 10, teclado: 'phone-pad', soloDigitos: true })}

      <View style={estilos.grupo}>
        <Text variant="bodyMedium" style={estilos.etiquetaGrupo}>
          {`Nivel${opcional}`}
        </Text>
        <View style={estilos.chips} accessibilityRole="radiogroup" accessibilityLabel="Nivel">
          {NIVELES_FORMACION.map((nivel) => {
            const elegido = nivel === valores.nivel;
            return (
              <Chip
                key={nivel}
                selected={elegido}
                showSelectedCheck={false}
                onPress={() => onCambiar('nivel', nivel)}
                disabled={deshabilitado}
                style={elegido ? estilos.chipElegido : estilos.chip}
                selectedColor={elegido ? colores.superficie : colores.primarioOscuro}
                textStyle={elegido ? estilos.textoChipElegido : estilos.textoChip}
                hitSlop={AREA_CHIP}
                accessibilityRole="radio"
                accessibilityState={{ checked: elegido, disabled: deshabilitado }}
                accessibilityLabel={`Nivel: ${NOMBRE_NIVEL_FORMACION[nivel]}`}
              >
                {NOMBRE_NIVEL_FORMACION[nivel]}
              </Chip>
            );
          })}
        </View>
        <ErrorGrupo mensaje={errores.nivel} />
      </View>

      {/* Lista y no chips: los nombres de las facultades son largos y no deben cortarse. */}
      <View style={estilos.grupo}>
        <Text variant="bodyMedium" style={estilos.etiquetaGrupo}>
          {`Facultad${opcional}`}
        </Text>
        <RadioButton.Group
          value={valores.facultad}
          onValueChange={(facultad) => onCambiar('facultad', facultad)}
        >
          {facultades.map((facultad) => (
            <RadioButton.Item
              key={facultad}
              label={facultad}
              value={facultad}
              mode="android"
              position="leading"
              disabled={deshabilitado}
              color={colores.primario}
              uncheckedColor={colores.bordeFuerte}
              style={estilos.opcion}
              labelStyle={estilos.etiquetaOpcion}
              labelVariant="bodyMedium"
              accessibilityLabel={`Facultad: ${facultad}`}
            />
          ))}
        </RadioButton.Group>
        <ErrorGrupo mensaje={errores.facultad} />
      </View>

      {texto('programa', `Programa${opcional}`, { largoMaximo: LARGO_MAXIMO_DATO_ACADEMICO })}

      {esEstudiante ? (
        <SelectorSemestre
          valor={valores.semestre}
          onCambiar={(semestre) => onCambiar('semestre', semestre)}
          mensajeError={errores.semestre}
          deshabilitado={deshabilitado}
        />
      ) : null}
    </View>
  );
}

/** Error bajo un grupo, que Android anuncia al aparecer. */
function ErrorGrupo({ mensaje }: { mensaje?: string }) {
  return (
    <View accessibilityLiveRegion="polite">
      <HelperText type="error" visible={mensaje != null}>
        {mensaje}
      </HelperText>
    </View>
  );
}

type CampoTextoProps = {
  etiqueta: string;
  valor: string;
  onCambiar: (valor: string) => void;
  mensajeError?: string;
  ayuda?: string;
  deshabilitado: boolean;
  largoMaximo?: number;
  teclado?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words' | 'sentences';
};

function CampoTexto({
  etiqueta,
  valor,
  onCambiar,
  mensajeError,
  ayuda,
  deshabilitado,
  largoMaximo,
  teclado,
  autoCapitalize,
}: CampoTextoProps) {
  return (
    <View>
      <TextInput
        mode="outlined"
        label={etiqueta}
        value={valor}
        onChangeText={onCambiar}
        error={mensajeError != null}
        disabled={deshabilitado}
        keyboardType={teclado}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        maxLength={largoMaximo}
        style={estilos.campo}
        accessibilityLabel={etiqueta}
      />
      <View accessibilityLiveRegion="polite">
        <HelperText
          type={mensajeError ? 'error' : 'info'}
          visible={mensajeError != null || ayuda != null}
        >
          {mensajeError ?? ayuda}
        </HelperText>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: { gap: espacio.s },
  tipo: { gap: espacio.xs },
  etiqueta: { color: colores.textoSecundario },
  valor: { color: colores.texto, fontFamily: fuentes.seminegrita },
  campo: { backgroundColor: colores.superficie },
  grupo: { gap: espacio.xs },
  etiquetaGrupo: { color: colores.texto },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  // Los mismos colores y pesos que ChipsFiltro.
  chip: { backgroundColor: colores.primarioSuave },
  chipElegido: { backgroundColor: colores.primarioOscuro },
  textoChip: { fontFamily: fuentes.seminegrita },
  textoChipElegido: { fontFamily: fuentes.negrita },
  // Sin el relleno lateral del ítem, el círculo se alinea con los campos.
  opcion: { paddingHorizontal: 0 },
  etiquetaOpcion: { color: colores.texto, textAlign: 'left' },
});
