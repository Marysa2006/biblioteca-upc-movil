/**
 * Formulario del registro provisional (#203), con los campos de `POST register/` del Backend:
 * tus datos, tu vínculo con la Universidad (estudiante, docente o administrativo, con la sede y,
 * para estudiantes, la facultad y el programa de las mismas listas de las solicitudes, #294), la
 * contraseña y la autorización de datos con el formato del Acuerdo 019 (#225).
 * - CA2: los errores van bajo su campo, también los que manda la API (correo o cédula que ya
 *   existen, contraseña débil): la pantalla los pasa en `errorApi` y aquí se ponen en su campo.
 * - CA3: no hay forma de elegir un rol del personal; solo el tipo de usuario.
 * Solo valida y entrega la cuenta: la pantalla llama a useRegistrarCuenta().
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, type ReactNode } from 'react';
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';
import { Button, Checkbox, Chip, HelperText, Text, TextInput } from 'react-native-paper';

import { TextoAutorizacionDatos } from '@/components/privacidad/TextoAutorizacionDatos';
import { SelectorFacultadPrograma } from '@/components/solicitudes/SelectorFacultadPrograma';
import { AvisoError, DialogoTexto } from '@/components/ui';
import { colores, espacio, fuentes, radio } from '@/theme';
import { DOMINIO_CORREO, SEDES } from '@/utils/constantes';
import {
  aNuevaCuenta,
  esquemaRegistro,
  LARGO_MAXIMO_IDENTIFICACION,
  TIPOS_REGISTRO,
  VALORES_INICIALES_REGISTRO,
  type CampoRegistro,
  type FormularioRegistro as ValoresRegistro,
  type NuevaCuenta,
} from '@/utils/registro';
import { LARGO_MAXIMO_DATO_ACADEMICO, LARGO_MAXIMO_NOMBRE } from '@/utils/solicitante';
import { NOMBRE_TIPO } from '@/utils/roles';

import { SelectorSemestre } from './SelectorSemestre';

/** Orden de los campos en pantalla, para anunciar el primero con error en iOS. */
const CAMPOS: CampoRegistro[] = [
  'nombres',
  'apellidos',
  'identificacion',
  'correo',
  'celular',
  'tipo',
  'sede',
  'facultad',
  'programa',
  'semestre',
  'dependencia',
  'contrasena',
  'confirmacion',
  'aceptaPrivacidad',
];

/** Lleva el chip a 48 px de área táctil sin cambiar su tamaño visible. */
const AREA_CHIP = { top: espacio.s, bottom: espacio.s };

/** Los campos sin un TextInput al que llevar el foco cuando la API los rechaza. */
const SIN_FOCO: CampoRegistro[] = [
  'tipo',
  'sede',
  'facultad',
  'programa',
  'semestre',
  'aceptaPrivacidad',
];

type Props = {
  enviando: boolean;
  /** Error de la API: con campo, va bajo ese campo; sin campo, lo muestra la pantalla. */
  errorApi: { campo?: CampoRegistro; mensaje: string } | null;
  onEnviar: (cuenta: NuevaCuenta) => void;
};

export function FormularioRegistro({ enviando, errorApi, onEnviar }: Props) {
  const [verContrasena, setVerContrasena] = useState(false);
  const [verAutorizacion, setVerAutorizacion] = useState(false);
  const { control, handleSubmit, setError, setFocus, setValue, formState } =
    useForm<ValoresRegistro>({
      resolver: zodResolver(esquemaRegistro),
      defaultValues: VALORES_INICIALES_REGISTRO,
    });
  const [tipo, sede, facultad, programa] = useWatch({
    control,
    name: ['tipo', 'sede', 'facultad', 'programa'],
  });
  const esEstudiante = tipo === 'estudiante';
  const aceptaPrivacidad = useWatch({ control, name: 'aceptaPrivacidad' });
  const errores = formState.errors;
  const validar = { shouldValidate: formState.isSubmitted };

  // CA2: el error de la API con campo (correo o cédula repetidos, contraseña débil) va bajo él.
  const campoApi = errorApi?.campo;
  const mensajeApi = errorApi?.mensaje;
  useEffect(() => {
    if (!campoApi || !mensajeApi) return;
    setError(campoApi, { type: 'api', message: mensajeApi });
    if (!SIN_FOCO.includes(campoApi)) setFocus(campoApi);
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(mensajeApi);
  }, [campoApi, mensajeApi, setError, setFocus]);

  const enviar = handleSubmit(
    (datos) => onEnviar(aNuevaCuenta(datos)),
    (conError) => {
      // En Android lo anuncia accessibilityLiveRegion bajo cada campo.
      const primero = CAMPOS.find((campo) => conError[campo] != null);
      const mensaje = primero ? conError[primero]?.message : undefined;
      if (Platform.OS === 'ios' && mensaje) AccessibilityInfo.announceForAccessibility(mensaje);
    },
  );

  const iconoContrasena = (
    <TextInput.Icon
      icon={verContrasena ? 'eye-off-outline' : 'eye-outline'}
      onPress={() => setVerContrasena((visible) => !visible)}
      forceTextInputFocus={false}
      accessibilityRole="button"
      accessibilityLabel={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    />
  );

  return (
    <View style={estilos.formulario}>
      <View style={estilos.tarjeta}>
        <Text variant="titleSmall" style={estilos.subtitulo} accessibilityRole="header">
          Tus datos
        </Text>
        <CampoTexto
          control={control}
          nombre="nombres"
          ayuda="Como aparecen en tu documento, sin abreviar."
          etiqueta="Nombres"
          mensajeError={errores.nombres?.message}
          deshabilitado={enviando}
          largoMaximo={LARGO_MAXIMO_NOMBRE}
          autoCapitalize="words"
          autoComplete="name-given"
        />
        <CampoTexto
          control={control}
          nombre="apellidos"
          ayuda="Los dos, como aparecen en tu documento."
          etiqueta="Apellidos"
          mensajeError={errores.apellidos?.message}
          deshabilitado={enviando}
          largoMaximo={LARGO_MAXIMO_NOMBRE}
          autoCapitalize="words"
          autoComplete="name-family"
        />
        <CampoTexto
          control={control}
          nombre="identificacion"
          ayuda="Solo números, sin puntos ni espacios."
          etiqueta="Número de cédula"
          mensajeError={errores.identificacion?.message}
          deshabilitado={enviando}
          largoMaximo={LARGO_MAXIMO_IDENTIFICACION}
          teclado="number-pad"
          soloDigitos
        />
        <CampoTexto
          control={control}
          nombre="correo"
          ayuda="Tu correo institucional, en minúsculas."
          etiqueta="Correo institucional"
          placeholder={`nombre@${DOMINIO_CORREO}`}
          mensajeError={errores.correo?.message}
          deshabilitado={enviando}
          teclado="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <CampoTexto
          control={control}
          nombre="celular"
          ayuda="10 dígitos, sin espacios ni indicativo (+57)."
          etiqueta="Celular (opcional)"
          mensajeError={errores.celular?.message}
          deshabilitado={enviando}
          largoMaximo={10}
          teclado="phone-pad"
          soloDigitos
          autoComplete="tel"
        />
      </View>

      <View style={estilos.tarjeta}>
        <Text variant="titleSmall" style={estilos.subtitulo} accessibilityRole="header">
          Tu vínculo con la Universidad
        </Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          Coordinadores, directores y decanos se registran como docente o administrativo. El
          personal de la biblioteca recibe sus permisos de la administración.
        </Text>
        <OpcionesChips
          grupo="Soy"
          opciones={TIPOS_REGISTRO.map((opcion) => ({
            valor: opcion,
            etiqueta: NOMBRE_TIPO[opcion],
            etiquetaAccesible: `Soy ${NOMBRE_TIPO[opcion].toLowerCase()}`,
          }))}
          valor={tipo}
          onElegir={(opcion) => setValue('tipo', opcion, validar)}
          mensajeError={errores.tipo?.message}
          deshabilitado={enviando}
        />

        {tipo ? (
          <>
            <Text variant="bodyMedium" style={estilos.etiquetaGrupo}>
              {esEstudiante ? 'Sede' : 'Sede (opcional)'}
            </Text>
            <OpcionesChips
              grupo="Sede"
              opciones={SEDES.map((opcion) => ({
                valor: opcion,
                etiqueta: opcion,
                etiquetaAccesible: `Sede ${opcion}`,
              }))}
              valor={sede}
              onElegir={(opcion) => setValue('sede', opcion, validar)}
              mensajeError={errores.sede?.message}
              deshabilitado={enviando}
            />
          </>
        ) : null}

        {esEstudiante ? (
          <>
            <SelectorFacultadPrograma
              facultad={facultad}
              programa={programa}
              onCambiarFacultad={(valor) => setValue('facultad', valor, validar)}
              onCambiarPrograma={(valor) => setValue('programa', valor, validar)}
              errorFacultad={errores.facultad?.message}
              errorPrograma={errores.programa?.message}
              deshabilitado={enviando}
            />
            <Controller
              control={control}
              name="semestre"
              render={({ field: { value, onChange } }) => (
                <SelectorSemestre
                  valor={value}
                  onCambiar={onChange}
                  mensajeError={errores.semestre?.message}
                  deshabilitado={enviando}
                />
              )}
            />
          </>
        ) : null}
        {tipo === 'docente' || tipo === 'administrativo' ? (
          <CampoTexto
            control={control}
            nombre="dependencia"
            ayuda="El nombre completo, sin siglas."
            etiqueta="Dependencia (opcional)"
            placeholder="Por ejemplo, Facultad de Ingenierías"
            mensajeError={errores.dependencia?.message}
            deshabilitado={enviando}
            largoMaximo={LARGO_MAXIMO_DATO_ACADEMICO}
          />
        ) : null}
      </View>

      <View style={estilos.tarjeta}>
        <Text variant="titleSmall" style={estilos.subtitulo} accessibilityRole="header">
          Contraseña
        </Text>
        <CampoTexto
          control={control}
          nombre="contrasena"
          etiqueta="Contraseña"
          mensajeError={errores.contrasena?.message}
          ayuda="Al menos 8 caracteres, y que no sean solo números."
          deshabilitado={enviando}
          autoCapitalize="none"
          oculto={!verContrasena}
          derecha={iconoContrasena}
          autoComplete="new-password"
        />
        <CampoTexto
          control={control}
          nombre="confirmacion"
          ayuda="Escríbela igual que la anterior."
          etiqueta="Confirma la contraseña"
          mensajeError={errores.confirmacion?.message}
          deshabilitado={enviando}
          autoCapitalize="none"
          oculto={!verContrasena}
          autoComplete="new-password"
        />
      </View>

      <View style={estilos.tarjeta}>
        <Text variant="titleSmall" style={estilos.subtitulo} accessibilityRole="header">
          Tratamiento de datos personales
        </Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          Para crear la cuenta necesitamos tu autorización, con el formato del Acuerdo 019 de 2020
          de la Universidad.
        </Text>
        {/* Revisión de la 1.1: el texto abre en una ventana, para no alargar el formulario. */}
        <Button
          mode="text"
          icon="file-document-outline"
          onPress={() => setVerAutorizacion(true)}
          style={estilos.botonIzquierda}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Leer la autorización completa"
        >
          Leer la autorización
        </Button>
        <DialogoTexto
          visible={verAutorizacion}
          titulo="Autorización de datos personales"
          onCerrar={() => setVerAutorizacion(false)}
          aceptar={{ texto: 'Acepto', onPress: () => setValue('aceptaPrivacidad', true, validar) }}
        >
          <TextoAutorizacionDatos />
        </DialogoTexto>
        <Checkbox.Item
          label="He leído y acepto la autorización para el tratamiento de mis datos personales del Acuerdo 019 de 2020."
          status={aceptaPrivacidad ? 'checked' : 'unchecked'}
          onPress={() => setValue('aceptaPrivacidad', !aceptaPrivacidad, validar)}
          disabled={enviando}
          position="leading"
          mode="android"
          color={colores.primario}
          uncheckedColor={colores.bordeFuerte}
          style={estilos.casilla}
          labelStyle={estilos.etiquetaCasilla}
          labelVariant="bodySmall"
          accessibilityLabel="Acepto la autorización para el tratamiento de mis datos personales"
        />
        <View accessibilityLiveRegion="polite">
          <HelperText type="error" visible={errores.aceptaPrivacidad != null}>
            {errores.aceptaPrivacidad?.message}
          </HelperText>
        </View>
      </View>

      {errorApi && !errorApi.campo ? <AvisoError mensaje={errorApi.mensaje} /> : null}

      <Button
        mode="contained"
        onPress={() => enviar()}
        loading={enviando}
        disabled={enviando}
        contentStyle={estilos.contenidoBoton}
        labelStyle={estilos.textoBoton}
        accessibilityRole="button"
        accessibilityLabel="Crear mi cuenta"
      >
        Crear cuenta
      </Button>
    </View>
  );
}

type OpcionesChipsProps = {
  /** Nombre del grupo para el lector de pantalla. */
  grupo: string;
  opciones: { valor: string; etiqueta: string; etiquetaAccesible: string }[];
  valor: string;
  onElegir: (valor: string) => void;
  mensajeError?: string;
  deshabilitado: boolean;
};

/**
 * Una opción entre pocas (el tipo y la sede), en chips como ChipsFiltro. La elegida va con fondo
 * oscuro y en negrita, así no depende solo del color. El error va debajo y Android lo anuncia.
 */
function OpcionesChips({
  grupo,
  opciones,
  valor,
  onElegir,
  mensajeError,
  deshabilitado,
}: OpcionesChipsProps) {
  return (
    <>
      <View style={estilos.chips} accessibilityRole="radiogroup" accessibilityLabel={grupo}>
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
              accessibilityLabel={opcion.etiquetaAccesible}
            >
              {opcion.etiqueta}
            </Chip>
          );
        })}
      </View>
      <View accessibilityLiveRegion="polite">
        <HelperText type="error" visible={mensajeError != null}>
          {mensajeError}
        </HelperText>
      </View>
    </>
  );
}

type CampoTextoProps = {
  control: Control<ValoresRegistro>;
  nombre:
    | 'nombres'
    | 'apellidos'
    | 'identificacion'
    | 'correo'
    | 'celular'
    | 'dependencia'
    | 'contrasena'
    | 'confirmacion';
  etiqueta: string;
  mensajeError?: string;
  /** Texto de ayuda bajo el campo mientras no hay error. */
  ayuda?: string;
  placeholder?: string;
  deshabilitado: boolean;
  largoMaximo?: number;
  teclado?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words' | 'sentences';
  autoComplete?: TextInputProps['autoComplete'];
  /** Descarta lo que no sea dígito (cédula y celular). */
  soloDigitos?: boolean;
  /** Contraseña: el texto no se ve. */
  oculto?: boolean;
  derecha?: ReactNode;
};

/** Un dato de texto con su error debajo, que Android anuncia al aparecer. */
function CampoTexto({
  control,
  nombre,
  etiqueta,
  mensajeError,
  ayuda,
  placeholder,
  deshabilitado,
  largoMaximo,
  teclado,
  autoCapitalize,
  autoComplete,
  soloDigitos,
  oculto,
  derecha,
}: CampoTextoProps) {
  return (
    <Controller
      control={control}
      name={nombre}
      render={({ field: { ref, value, onChange, onBlur } }) => (
        <View>
          <TextInput
            ref={ref}
            mode="outlined"
            label={etiqueta}
            placeholder={placeholder}
            value={value}
            onChangeText={(texto) => onChange(soloDigitos ? texto.replace(/\D/g, '') : texto)}
            onBlur={onBlur}
            error={mensajeError != null}
            disabled={deshabilitado}
            keyboardType={teclado}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            autoCorrect={false}
            secureTextEntry={oculto}
            maxLength={largoMaximo}
            right={derecha}
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
      )}
    />
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.m },
  tarjeta: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  subtitulo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  secundario: { color: colores.textoSecundario },
  etiquetaGrupo: { color: colores.texto },
  campo: { backgroundColor: colores.superficie },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  // Los mismos colores y pesos que ChipsFiltro.
  chip: { backgroundColor: colores.primarioSuave },
  chipElegido: { backgroundColor: colores.primarioOscuro },
  textoChip: { fontFamily: fuentes.seminegrita },
  textoChipElegido: { fontFamily: fuentes.negrita },
  botonIzquierda: { alignSelf: 'flex-start' },
  // Sin el relleno lateral del ítem, la casilla se alinea con el texto de arriba.
  casilla: { paddingHorizontal: 0 },
  etiquetaCasilla: { color: colores.texto, textAlign: 'left' },
  contenidoBoton: { paddingVertical: espacio.xs },
  textoBoton: { fontFamily: fuentes.seminegrita },
});
