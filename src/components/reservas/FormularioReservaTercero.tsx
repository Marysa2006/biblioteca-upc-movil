/**
 * Formulario para que el personal reserve un espacio en nombre de otra persona (HU-19).
 * Al crear la reserva se notifica a la persona. Valida antes de enviar con
 * esquemaReservaTercero (día hábil de HU-28 y capacidad del espacio); la API vuelve a validar
 * y responde los choques de horario (CA3), que se muestran en el aviso.
 * Al guardar, el formulario cambia a una confirmación con a quién se notificó.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Icon, Text, TextInput } from 'react-native-paper';

import type { PersonaEncontrada } from '@/api/backend/usuarios';
import { SelectorPersona } from '@/components/personal/SelectorPersona';
import { useBuscarPersonas } from '@/hooks/useBuscarPersonas';
import { NotaDatosPersonales } from '@/components/privacidad/NotaDatosPersonales';
import { AvisoError } from '@/components/ui';
import { useCrearReservaTercero } from '@/hooks/useReservas';
import { colores, espacio, fuentes } from '@/theme';
import type { Espacio, Parametros } from '@/types';
import { mensajeErrorGuardar } from '@/utils/errores';
import { sumarMeses } from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';
import {
  esquemaReservaTercero,
  MESES_RESERVA,
  motivoDiaReserva,
  type FormularioReservaTercero as Formulario,
} from '@/utils/reservas';

import { CampoFormulario } from './CampoFormulario';

/** Lleva el chip a 48 px de área táctil sin cambiar su tamaño visible. */
const AREA_CHIP = { top: espacio.s, bottom: espacio.s };

const VACIO: Formulario = {
  solicitanteId: '',
  correoSolicitante: '',
  espacioId: '',
  fecha: '',
  horaInicio: '',
  horaFin: '',
  proposito: '',
  asistentes: '',
  requerimientos: '',
};

type Props = {
  /** Espacios activos: solo en ellos se puede reservar. */
  espacios: Espacio[];
  parametros: Parametros;
};

export function FormularioReservaTercero({ espacios, parametros }: Props) {
  const [hoy] = useState(hoyISO);
  const { mutate, isPending: guardando, error, reset: limpiarError } = useCrearReservaTercero();
  const [creadaPara, setCreadaPara] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [persona, setPersona] = useState<PersonaEncontrada | null>(null);
  const consulta = useBuscarPersonas('reservas', busqueda, !persona && !creadaPara);
  const porCorreo = consulta.sinPermiso;

  const { control, handleSubmit, setValue, reset, formState: { errors } } = useForm<Formulario>({
    resolver: zodResolver(esquemaReservaTercero({ parametros, espacios, hoy }, porCorreo)),
    defaultValues: VACIO,
  });
  // El máximo de asistentes es la capacidad del espacio elegido (useWatch: React Compiler).
  const espacioId = useWatch({ control, name: 'espacioId' });
  const capacidadElegida = espacios.find((lugar) => lugar.id === espacioId)?.capacidad;

  const aviso = creadaPara ? `Reserva creada. Se notificó a ${creadaPara}.` : null;
  // En Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  const enviar = (datos: Formulario) => {

    const correo = persona?.correo ?? datos.correoSolicitante.trim().toLowerCase();
    if (!correo || (!porCorreo && !persona)) return;
    mutate(
      {
        espacioId: datos.espacioId,
        solicitanteId: persona?.id ?? '',
        solicitante: persona?.nombre ?? correo,
        correoSolicitante: correo,
        fecha: datos.fecha.trim(),
        horaInicio: datos.horaInicio.trim(),
        horaFin: datos.horaFin.trim(),
        proposito: datos.proposito.trim(),
        asistentes: Number(datos.asistentes),
        requerimientos: datos.requerimientos.trim() || undefined,
      },
      { onSuccess: (reserva) => setCreadaPara(reserva.solicitante || correo) },
    );
  };

  const crearOtra = () => {
    limpiarError();
    reset(VACIO);
    setPersona(null);
    setBusqueda('');
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
        {!porCorreo ? (
          <>
            <SelectorPersona
              seleccion={persona}
              consulta={consulta}
              texto={busqueda}
              onTexto={setBusqueda}
              onElegir={(elegida) => {
                setPersona(elegida);
                setValue('solicitanteId', elegida?.id ?? '', { shouldValidate: !!elegida });
              }}
              deshabilitado={guardando}
            />
            {errors.solicitanteId ? <HelperText type="error">{errors.solicitanteId.message}</HelperText> : null}
          </>
        ) : <Controller
          control={control}
          name="correoSolicitante"
          render={({ field, fieldState }) => (
            <View>
              <TextInput label="Correo institucional" mode="outlined" keyboardType="email-address"
                autoCapitalize="none" autoCorrect={false} value={field.value}
                onChangeText={field.onChange} onBlur={field.onBlur} disabled={guardando}
                error={Boolean(fieldState.error)} />
              {fieldState.error ? <HelperText type="error">{fieldState.error.message}</HelperText> : null}
            </View>
          )}
        />}
        {/* #225, CA3: aquí se usan los datos de otra persona, así que se dice para qué. */}
        <NotaDatosPersonales mensaje="De la persona para la que reservas usamos su nombre y su cuenta institucional, solo para la reserva y sus notificaciones." />
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
                      accessibilityLabel={`${lugar.nombre}, unas ${lugar.capacidad} personas`}
                    >
                      {`${lugar.nombre} · unas ${lugar.capacidad}`}
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
          etiqueta="Fecha"
          tipo="fecha"
          motivoNoElegible={(dia) => motivoDiaReserva(dia, parametros, hoy)}
          mesMinimo={hoy}
          mesMaximo={sumarMeses(hoy, MESES_RESERVA)}
          deshabilitado={guardando}
        />
        <CampoFormulario
          control={control}
          nombre="horaInicio"
          etiqueta="Hora de inicio"
          tipo="hora"
          pasoMinutos={60}
          deshabilitado={guardando}
        />
        <CampoFormulario
          control={control}
          nombre="horaFin"
          etiqueta="Hora de fin"
          tipo="hora"
          pasoMinutos={60}
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
          etiqueta={
            capacidadElegida ? `Número de asistentes (hasta ${capacidadElegida})` : 'Número de asistentes'
          }
          tipo="numero"
          minimo={1}
          maximo={capacidadElegida}
          deshabilitado={guardando}
        />
        <CampoFormulario
          control={control}
          nombre="requerimientos"
          etiqueta="Novedades (opcional)"
          multilinea
          deshabilitado={guardando}
        />
      </Seccion>

      {error ? <AvisoError mensaje={mensajeErrorGuardar(error)} /> : null}

      <Button
        mode="contained"
        onPress={() => handleSubmit(enviar)()}
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
const estilos = StyleSheet.create({
  formulario: { gap: espacio.m },
  seccion: { gap: espacio.xs },
  tituloSeccion: { color: colores.texto, fontFamily: fuentes.seminegrita },
  secundario: { color: colores.textoSecundario },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s, paddingVertical: espacio.xs },
  chip: { backgroundColor: colores.primarioSuave },
  chipElegido: { backgroundColor: colores.primarioOscuro },
  textoChip: { fontFamily: fuentes.seminegrita },
  confirmacion: { alignItems: 'center', gap: espacio.m, paddingVertical: espacio.xl },
  textoConfirmacion: { color: colores.texto, textAlign: 'center' },
  botones: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
