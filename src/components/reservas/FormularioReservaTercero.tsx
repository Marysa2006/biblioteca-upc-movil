/**
 * Formulario para que el personal reserve un espacio en nombre de otra persona (HU-19).
 * La reserva queda aprobada y se notifica a la persona. Valida antes de enviar con
 * esquemaReservaTercero (día hábil de HU-28 y capacidad del espacio); la API vuelve a validar
 * y responde los choques de horario (CA3), que se muestran en el aviso.
 * Al guardar, el formulario cambia a una confirmación con a quién se notificó.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Icon, Text, TextInput, TouchableRipple } from 'react-native-paper';

import { AvisoError } from '@/components/ui';
import { useCrearReservaTercero } from '@/hooks/useReservas';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Espacio, Parametros, Usuario } from '@/types';
import { mensajeErrorGuardar } from '@/utils/errores';
import { hoyISO } from '@/utils/fechas';
import { esquemaReservaTercero, type FormularioReservaTercero as Formulario } from '@/utils/reservas';
import { NOMBRE_TIPO } from '@/utils/roles';
import { normalizarTexto } from '@/utils/texto';

import { CampoFormulario } from './CampoFormulario';

/** Cuántas personas se muestran al buscar. */
const MAXIMO_RESULTADOS = 5;

/** Lleva el chip a 48 px de área táctil sin cambiar su tamaño visible. */
const AREA_CHIP = { top: espacio.s, bottom: espacio.s };

const VACIO: Formulario = {
  solicitanteId: '',
  espacioId: '',
  fecha: '',
  horaInicio: '',
  horaFin: '',
  proposito: '',
  asistentes: '',
  requerimientos: '',
};

type Props = {
  usuarios: Usuario[];
  /** Espacios activos: solo en ellos se puede reservar. */
  espacios: Espacio[];
  parametros: Parametros;
};

export function FormularioReservaTercero({ usuarios, espacios, parametros }: Props) {
  const [hoy] = useState(hoyISO);
  const { mutate, isPending: guardando, error, reset: limpiarError } = useCrearReservaTercero();
  const [creadaPara, setCreadaPara] = useState<string | null>(null);

  const { control, handleSubmit, setValue, reset } = useForm<Formulario>({
    resolver: zodResolver(esquemaReservaTercero({ parametros, espacios, hoy })),
    defaultValues: VACIO,
  });

  const aviso = creadaPara ? `Reserva creada y aprobada. Se notificó a ${creadaPara}.` : null;
  // En Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  const enviar = (datos: Formulario) => {
    const persona = usuarios.find((u) => u.id === datos.solicitanteId);
    if (!persona) return;
    mutate(
      {
        espacioId: datos.espacioId,
        solicitanteId: persona.id,
        solicitante: persona.nombre,
        fecha: datos.fecha.trim(),
        horaInicio: datos.horaInicio.trim(),
        horaFin: datos.horaFin.trim(),
        proposito: datos.proposito.trim(),
        asistentes: Number(datos.asistentes),
        requerimientos: datos.requerimientos.trim() || undefined,
      },
      { onSuccess: () => setCreadaPara(persona.nombre) },
    );
  };

  const crearOtra = () => {
    limpiarError();
    reset(VACIO);
    setCreadaPara(null);
  };

  if (aviso) {
    return (
      <View style={estilos.confirmacion} accessibilityLiveRegion="polite">
        <Icon source="check-circle-outline" size={40} color={colores.primario} />
        <Text variant="bodyLarge" style={estilos.textoConfirmacion}>
          {aviso}
        </Text>
        <View style={estilos.botones}>
          <Button
            mode="contained"
            onPress={() => router.back()}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel="Volver a la bandeja de solicitudes"
          >
            Volver a la bandeja
          </Button>
          <Button
            mode="outlined"
            onPress={crearOtra}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel="Crear otra reserva para un tercero"
          >
            Crear otra
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={estilos.formulario}>
      <Seccion titulo="Persona">
        <ElegirPersona
          usuarios={usuarios}
          control={control}
          // Al elegir se valida (quita el error); al "Cambiar" no, para no mostrar un error antes de buscar.
          onElegir={(id) => setValue('solicitanteId', id, { shouldValidate: id !== '' })}
          deshabilitado={guardando}
        />
      </Seccion>

      <Seccion titulo="Espacio">
        <Controller
          control={control}
          name="espacioId"
          render={({ field: { value, onChange }, fieldState: { error: errorCampo } }) => (
            <View>
              <View style={estilos.chips} accessibilityRole="radiogroup" accessibilityLabel="Espacio">
                {espacios.map((lugar) => {
                  const elegido = lugar.id === value;
                  return (
                    <Chip
                      key={lugar.id}
                      selected={elegido}
                      onPress={() => onChange(lugar.id)}
                      disabled={guardando}
                      style={elegido ? estilos.chipElegido : estilos.chip}
                      selectedColor={elegido ? colores.superficie : colores.primarioOscuro}
                      textStyle={estilos.textoChip}
                      hitSlop={AREA_CHIP}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: elegido }}
                      accessibilityLabel={`${lugar.nombre}, hasta ${lugar.capacidad} personas`}
                    >
                      {`${lugar.nombre} · hasta ${lugar.capacidad}`}
                    </Chip>
                  );
                })}
              </View>
              <HelperText type="error" visible={errorCampo != null}>
                {errorCampo?.message}
              </HelperText>
            </View>
          )}
        />
      </Seccion>

      <Seccion titulo="Fecha y horario">
        <CampoFormulario
          control={control}
          nombre="fecha"
          etiqueta="Fecha (AAAA-MM-DD)"
          placeholder="2026-10-27"
          teclado="numbers-and-punctuation"
          deshabilitado={guardando}
        />
        <CampoFormulario
          control={control}
          nombre="horaInicio"
          etiqueta="Hora de inicio (HH:MM)"
          placeholder="14:00"
          teclado="numbers-and-punctuation"
          deshabilitado={guardando}
        />
        <CampoFormulario
          control={control}
          nombre="horaFin"
          etiqueta="Hora de fin (HH:MM)"
          placeholder="16:00"
          teclado="numbers-and-punctuation"
          deshabilitado={guardando}
        />
      </Seccion>

      <Seccion titulo="Detalles">
        <CampoFormulario
          control={control}
          nombre="proposito"
          etiqueta="Propósito"
          deshabilitado={guardando}
        />
        <CampoFormulario
          control={control}
          nombre="asistentes"
          etiqueta="Número de asistentes"
          teclado="number-pad"
          deshabilitado={guardando}
        />
        <CampoFormulario
          control={control}
          nombre="requerimientos"
          etiqueta="Requerimientos (opcional)"
          multilinea
          deshabilitado={guardando}
        />
      </Seccion>

      {error ? <AvisoError mensaje={mensajeErrorGuardar(error)} /> : null}

      <Button
        mode="contained"
        onPress={handleSubmit(enviar)}
        loading={guardando}
        disabled={guardando}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Reservar para la persona elegida"
      >
        Reservar
      </Button>
    </View>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={estilos.seccion}>
      <Text variant="titleSmall" style={estilos.tituloSeccion} accessibilityRole="header">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

/** Buscador de la persona: al elegirla, se reemplaza por su nombre con "Cambiar". */
function ElegirPersona({
  usuarios,
  control,
  onElegir,
  deshabilitado,
}: {
  usuarios: Usuario[];
  control: Control<Formulario>;
  onElegir: (id: string) => void;
  deshabilitado: boolean;
}) {
  const [busqueda, setBusqueda] = useState('');
  const solicitanteId = useWatch({ control, name: 'solicitanteId' });
  const elegida = usuarios.find((u) => u.id === solicitanteId);

  if (elegida) {
    return (
      <View style={estilos.personaElegida}>
        <View style={estilos.textosPersona}>
          <Text variant="titleSmall" style={estilos.nombrePersona}>
            {elegida.nombre}
          </Text>
          <Text variant="bodySmall" style={estilos.secundario}>
            {`${NOMBRE_TIPO[elegida.tipo]} · ${elegida.correo}`}
          </Text>
        </View>
        <Button
          mode="text"
          onPress={() => onElegir('')}
          disabled={deshabilitado}
          accessibilityRole="button"
          accessibilityLabel={`Cambiar la persona. Ahora es ${elegida.nombre}`}
        >
          Cambiar
        </Button>
      </View>
    );
  }

  const texto = normalizarTexto(busqueda.trim());
  const resultados =
    texto.length < 2
      ? []
      : usuarios
          .filter(
            (u) => normalizarTexto(u.nombre).includes(texto) || normalizarTexto(u.correo).includes(texto),
          )
          .slice(0, MAXIMO_RESULTADOS);

  return (
    <Controller
      control={control}
      name="solicitanteId"
      render={({ fieldState: { error } }) => (
        <View style={estilos.buscador}>
          <TextInput
            mode="outlined"
            label="Buscar por nombre o correo"
            value={busqueda}
            onChangeText={setBusqueda}
            error={error != null}
            disabled={deshabilitado}
            left={<TextInput.Icon icon="magnify" />}
            accessibilityLabel="Buscar la persona por nombre o correo"
          />
          {texto.length >= 2 && resultados.length === 0 ? (
            <Text variant="bodySmall" style={estilos.secundario} accessibilityLiveRegion="polite">
              {`No encontramos a nadie con «${busqueda.trim()}».`}
            </Text>
          ) : null}
          <View accessibilityRole="radiogroup" accessibilityLabel="Personas encontradas">
            {resultados.map((u) => (
              <View key={u.id} style={estilos.resultado}>
                <TouchableRipple
                  onPress={() => onElegir(u.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: false }}
                  accessibilityLabel={`${u.nombre}, ${NOMBRE_TIPO[u.tipo]}, ${u.correo}`}
                >
                  <View style={estilos.contenidoResultado}>
                    <Text variant="bodyMedium" style={estilos.nombrePersona}>
                      {u.nombre}
                    </Text>
                    <Text variant="bodySmall" style={estilos.secundario}>
                      {`${NOMBRE_TIPO[u.tipo]} · ${u.correo}`}
                    </Text>
                  </View>
                </TouchableRipple>
              </View>
            ))}
          </View>
          <HelperText type="error" visible={error != null}>
            {error?.message}
          </HelperText>
        </View>
      )}
    />
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.m },
  seccion: { gap: espacio.xs },
  tituloSeccion: { color: colores.texto, fontFamily: fuentes.seminegrita },
  secundario: { color: colores.textoSecundario },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s, paddingVertical: espacio.xs },
  chip: { backgroundColor: colores.primarioSuave },
  chipElegido: { backgroundColor: colores.primarioOscuro },
  textoChip: { fontFamily: fuentes.seminegrita },
  buscador: { gap: espacio.xs },
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  resultado: {
    borderRadius: radio.boton,
    backgroundColor: colores.superficie,
    overflow: 'hidden',
    marginTop: espacio.xs,
  },
  contenidoResultado: { gap: espacio.xs, padding: espacio.m },
  personaElegida: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  textosPersona: { flex: 1, gap: espacio.xs },
  nombrePersona: { color: colores.texto, fontFamily: fuentes.seminegrita },
  confirmacion: { alignItems: 'center', gap: espacio.m, paddingVertical: espacio.xl },
  textoConfirmacion: { color: colores.texto, textAlign: 'center' },
  botones: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
