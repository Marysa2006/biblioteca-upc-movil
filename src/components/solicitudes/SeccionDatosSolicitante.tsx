/**
 * «Tus datos» de una solicitud (#251; la usa primero la asesoría, #249): lo que la sesión y el
 * perfil ya saben, prellenado con datosSolicitanteDe() y editable. Las reglas son las de #224
 * (camposSolicitante y reglasSolicitante): sede, nivel, facultad, programa y semestre son
 * obligatorios solo para estudiantes, y el semestre solo se pide a ellos.
 * La sede es la de la persona (Valledupar o Aguachica), no la del espacio. El programa se elige
 * de los de la facultad o, con «Otro programa», se escribe (#251; SelectorFacultadPrograma, #294).
 *
 * Es controlado y no depende de react-hook-form: recibe los valores y los errores, y avisa con
 * onCambiar. Así la pueden usar la asesoría, la capacitación, la reserva y la tablet.
 * El tipo de usuario sale de la sesión: se muestra, no se elige. La identificación también sale
 * de la cuenta: el campo solo aparece si la reserva la exige y la cuenta no la tiene (#251).
 */
import { StyleSheet, View, type KeyboardTypeOptions } from 'react-native';
import { Chip, HelperText, Text, TextInput } from 'react-native-paper';

import { SelectorSemestre } from '@/components/autenticacion/SelectorSemestre';
import { AvisoError } from '@/components/ui';
import { colores, espacio, fuentes } from '@/theme';
import type { TipoUsuario } from '@/types';
import { NIVELES_FORMACION, NOMBRE_NIVEL_FORMACION, SEDES } from '@/utils/constantes';
import { NOMBRE_TIPO } from '@/utils/roles';
import { LARGO_MAXIMO_NOMBRE, type ValoresSolicitante } from '@/utils/solicitante';

import { SelectorFacultadPrograma } from './SelectorFacultadPrograma';

export type CampoSolicitante = keyof ValoresSolicitante;

type Props = {
  valores: ValoresSolicitante;
  onCambiar: (campo: CampoSolicitante, valor: string) => void;
  errores: Partial<Record<CampoSolicitante, string>>;
  /**
   * Muestra el campo de la identificación, obligatorio. Solo la reserva la exige, y sale de la
   * cuenta: la pantalla lo pide únicamente si la cuenta no la tiene (#251). La asesoría y la
   * capacitación no la piden.
   */
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
      <Subtitulo texto="Contacto" />
      {texto('nombreCompleto', 'Nombre completo', {
        largoMaximo: LARGO_MAXIMO_NOMBRE,
        autoCapitalize: 'words',
      })}
      {pedirIdentificacion
        ? texto('identificacion', 'Número de identificación', {
            largoMaximo: 15,
            teclado: 'number-pad',
            soloDigitos: true,
            ayuda: 'Tu cuenta no la tiene registrada; la pide la reserva.',
          })
        : null}
      {texto('correo', 'Correo institucional', {
        teclado: 'email-address',
        autoCapitalize: 'none',
        ayuda: 'El personal te escribe al correo solo si es estrictamente necesario.',
      })}
      {texto('celular', 'Celular', { largoMaximo: 10, teclado: 'phone-pad', soloDigitos: true })}

      <Subtitulo texto="Datos académicos" />
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

      <GrupoChips
        titulo={`Sede${opcional}`}
        opciones={SEDES.map((sede) => ({ valor: sede, etiqueta: sede }))}
        valor={valores.sede}
        onElegir={(sede) => onCambiar('sede', sede)}
        mensajeError={errores.sede}
        deshabilitado={deshabilitado}
      />

      <GrupoChips
        titulo={`Nivel${opcional}`}
        opciones={NIVELES_FORMACION.map((nivel) => ({
          valor: nivel,
          etiqueta: NOMBRE_NIVEL_FORMACION[nivel],
        }))}
        valor={valores.nivel}
        onElegir={(nivel) => onCambiar('nivel', nivel)}
        mensajeError={errores.nivel}
        deshabilitado={deshabilitado}
      />

      <SelectorFacultadPrograma
        facultad={valores.facultad}
        programa={valores.programa}
        onCambiarFacultad={(facultad) => onCambiar('facultad', facultad)}
        onCambiarPrograma={(programa) => onCambiar('programa', programa)}
        errorFacultad={errores.facultad}
        errorPrograma={errores.programa}
        opcional={!esEstudiante}
        deshabilitado={deshabilitado}
      />

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

type GrupoChipsProps = {
  titulo: string;
  opciones: { valor: string; etiqueta: string }[];
  valor: string;
  onElegir: (valor: string) => void;
  mensajeError?: string;
  deshabilitado: boolean;
};

/** Una opción entre pocas y cortas (sede, nivel), con chips como ChipsFiltro. */
function GrupoChips({
  titulo,
  opciones,
  valor,
  onElegir,
  mensajeError,
  deshabilitado,
}: GrupoChipsProps) {
  return (
    <View style={estilos.grupo}>
      <Text variant="bodyMedium" style={estilos.etiquetaGrupo}>
        {titulo}
      </Text>
      <View style={estilos.chips} accessibilityRole="radiogroup" accessibilityLabel={titulo}>
        {opciones.map((opcion) => {
          const elegido = opcion.valor === valor;
          return (
            <Chip
              key={opcion.valor}
              selected={elegido}
              showSelectedCheck={false}
              onPress={() => onElegir(opcion.valor)}
              disabled={deshabilitado}
              style={elegido ? estilos.chipElegido : estilos.chip}
              selectedColor={elegido ? colores.superficie : colores.primarioOscuro}
              textStyle={elegido ? estilos.textoChipElegido : estilos.textoChip}
              hitSlop={AREA_CHIP}
              accessibilityRole="radio"
              accessibilityState={{ checked: elegido, disabled: deshabilitado }}
              accessibilityLabel={`${titulo}: ${opcion.etiqueta}`}
            >
              {opcion.etiqueta}
            </Chip>
          );
        })}
      </View>
      <ErrorGrupo mensaje={mensajeError} />
    </View>
  );
}

/** Subtítulo de un bloque de la sección (Contacto, Datos académicos). */
function Subtitulo({ texto }: { texto: string }) {
  return (
    <Text variant="titleSmall" style={estilos.subtitulo} accessibilityRole="header">
      {texto}
    </Text>
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
  subtitulo: { color: colores.primario, fontFamily: fuentes.seminegrita, marginTop: espacio.s },
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
});
