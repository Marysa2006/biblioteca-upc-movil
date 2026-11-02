/**
 * Solicitud de préstamo de tablet (HU-22): la fecha, la franja con las tablets que quedan, las
 * condiciones de uso y Confirmar. Se usa con la sesión iniciada: sin sesión, la pantalla solo
 * muestra la invitación a iniciarla.
 * - CA2: al tocar una franja sin tablets, o si al confirmar la API dice que se ocupó, se
 *   sugieren otras franjas; si el día no tiene ninguna, las sugerencias del día de la API.
 *   Una sugerencia de otro día cambia la fecha y deja elegida la franja.
 * - CA3: sin aceptar las condiciones, no se envía y se explica bajo la casilla.
 * - CA1: al terminar, la confirmación en el mismo lugar, como en HU-18.
 * Cada solicitud es de una franja de 1 hora: la hora límite es el fin de la franja.
 * No consulta ni guarda: la pantalla pide las franjas con la fecha y envía con onConfirmar.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { SelectorFecha } from '@/components/espacios/SelectorFecha';
import { AvisoError, EstadoCarga, EstadoError } from '@/components/ui';
import type { AlternativaPrestamo, FormularioPrestamo, FranjaTablets } from '@/hooks/useTablets';
import { colores, espacio, fuentes } from '@/theme';
import type { CondicionesTablet, Parametros } from '@/types';
import { fechaCompleta, sumarMeses } from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';
import {
  esquemaPrestamo,
  franjasSugeridas,
  motivoDiaNoElegible,
  type DatosPrestamo,
} from '@/utils/tablets';

import { CondicionesUso } from './CondicionesUso';
import { ListaFranjasTablet } from './ListaFranjasTablet';
import { SugerenciasFranja } from './SugerenciasFranja';

const CONFIRMACION =
  'Solicitud enviada. Tu tablet quedó reservada: recógela en el mostrador a la hora de inicio. Te dejamos una notificación con los datos.';

type Props = {
  parametros: Parametros;
  condiciones: CondicionesTablet;
  /** La fecha la lleva la pantalla, porque con ella pide las franjas. */
  fecha: string;
  onCambiarFecha: (fecha: string) => void;
  /** Las franjas de la fecha; undefined mientras cargan. */
  franjas: FranjaTablets[] | undefined;
  /** Si el día no es hábil, por qué (DiaTablets.motivo). */
  motivoDia?: string;
  /** Lo que sugiere la API cuando el día no tiene ninguna franja disponible (CA2). */
  sugerenciasDia: AlternativaPrestamo[];
  errorFranjas: boolean;
  onReintentarFranjas: () => void;
  guardando: boolean;
  /** Error de la API al confirmar, con mensajeErrorGuardar(). */
  mensajeError: string | null;
  /** Franjas sugeridas por el 400 de la API cuando la elegida se ocupó (CA2). */
  sugeridasError: AlternativaPrestamo[];
  /** Se eligió otra franja: la pantalla limpia el error de la solicitud anterior. */
  onLimpiarError: () => void;
  /** La solicitud ya se registró (CA1). */
  enviada: boolean;
  onConfirmar: (solicitud: FormularioPrestamo) => void;
};

export function FormularioPrestamoTablet({
  parametros,
  condiciones,
  fecha,
  onCambiarFecha,
  franjas,
  motivoDia,
  sugerenciasDia,
  errorFranjas,
  onReintentarFranjas,
  guardando,
  mensajeError,
  sugeridasError,
  onLimpiarError,
  enviada,
  onConfirmar,
}: Props) {
  const hoy = hoyISO();
  const { control, handleSubmit, setValue, formState } = useForm<DatosPrestamo>({
    resolver: zodResolver(esquemaPrestamo),
    defaultValues: { horaInicio: '', aceptaCondiciones: false },
  });
  const horaInicio = useWatch({ control, name: 'horaInicio' });
  const aceptaCondiciones = useWatch({ control, name: 'aceptaCondiciones' });
  /** La franja sin tablets que se tocó (CA2). */
  const [consultada, setConsultada] = useState<FranjaTablets | null>(null);

  const elegirHora = (hora: string) => {
    setValue('horaInicio', hora, { shouldValidate: formState.isSubmitted });
    setConsultada(null);
    onLimpiarError();
  };

  const cambiarFecha = (nueva: string) => {
    setValue('horaInicio', '');
    setConsultada(null);
    onLimpiarError();
    onCambiarFecha(nueva);
  };

  // Una sugerencia de otro día cambia la fecha y deja elegida su franja.
  const elegirSugerida = (sugerida: AlternativaPrestamo) => {
    if (sugerida.fecha !== fecha) cambiarFecha(sugerida.fecha);
    elegirHora(sugerida.horaInicio);
  };

  const confirmar = handleSubmit(
    (datos) => {
      const franja = franjas?.find((f) => f.horaInicio === datos.horaInicio);
      if (franja) {
        onConfirmar({
          fecha,
          franja: { horaInicio: franja.horaInicio, horaLimite: franja.horaFin },
          aceptaCondiciones: datos.aceptaCondiciones,
        });
      }
    },
    (errores) => {
      // En Android lo anuncia accessibilityLiveRegion bajo cada campo.
      const mensaje = errores.horaInicio?.message ?? errores.aceptaCondiciones?.message;
      if (Platform.OS === 'ios' && mensaje) AccessibilityInfo.announceForAccessibility(mensaje);
    },
  );

  if (enviada) {
    return (
      <View style={estilos.confirmacion} accessibilityLiveRegion="polite">
        <Icon source="check-circle-outline" size={40} color={colores.primario} />
        <Text variant="bodyLarge" style={estilos.textoConfirmacion}>
          {CONFIRMACION}
        </Text>
        <Button
          mode="contained"
          onPress={() => router.replace('/')}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Ir a Inicio"
        >
          Ir a Inicio
        </Button>
      </View>
    );
  }

  const conTablets = franjas?.some((franja) => franja.estado === 'disponible') ?? false;

  // CA2: la que se ocupó al confirmar, la que se tocó sin tablets o el día sin tablets.
  let sugerencias = null;
  if (franjas && sugeridasError.length > 0) {
    sugerencias = (
      <SugerenciasFranja
        mensaje="Mientras confirmabas, se ocuparon las tablets de esa franja"
        sugeridas={sugeridasError}
        fecha={fecha}
        onElegir={elegirSugerida}
      />
    );
  } else if (franjas && consultada) {
    const delDia = franjasSugeridas(franjas, consultada.horaInicio, fecha);
    sugerencias = (
      <SugerenciasFranja
        mensaje={`No quedan tablets de ${consultada.horaInicio} a ${consultada.horaFin}`}
        sugeridas={delDia.length > 0 ? delDia : sugerenciasDia}
        fecha={fecha}
        onElegir={elegirSugerida}
      />
    );
  } else if (franjas && !conTablets) {
    let mensaje = 'No quedan tablets este día';
    if (motivoDia) mensaje = `Ese día no hay préstamo de tablets: ${motivoDia}`;
    else if (franjas.length === 0) mensaje = 'No hay franjas de préstamo este día';
    sugerencias = (
      <SugerenciasFranja
        mensaje={mensaje}
        sugeridas={sugerenciasDia}
        fecha={fecha}
        onElegir={elegirSugerida}
      />
    );
  }

  let listaFranjas;
  if (!fecha) {
    listaFranjas = null;
  } else if (errorFranjas) {
    listaFranjas = (
      <EstadoError mensaje="No pudimos consultar las tablets de ese día." onReintentar={onReintentarFranjas} />
    );
  } else if (!franjas) {
    listaFranjas = <EstadoCarga mensaje="Consultando las tablets…" />;
  } else {
    listaFranjas = (
      <>
        {franjas.length > 0 ? (
          <ListaFranjasTablet
            franjas={franjas}
            elegida={horaInicio}
            onElegir={(franja) => elegirHora(franja.horaInicio)}
            onConsultarAgotada={setConsultada}
          />
        ) : null}
        {sugerencias}
        {formState.errors.horaInicio ? (
          <AvisoError mensaje={formState.errors.horaInicio.message ?? ''} />
        ) : null}
      </>
    );
  }

  return (
    <View style={estilos.formulario}>
      <SelectorFecha
        etiqueta="Fecha"
        valor={fecha}
        onCambiar={cambiarFecha}
        motivoNoElegible={(dia) => motivoDiaNoElegible(dia, parametros, hoy)}
        mesMinimo={hoy}
        mesMaximo={sumarMeses(hoy, 1)}
        descripcion={fecha ? fechaCompleta(fecha) : undefined}
        deshabilitado={guardando}
      />

      {fecha ? (
        <Text variant="titleSmall" style={estilos.subtitulo} accessibilityRole="header">
          Franjas del día
        </Text>
      ) : null}
      {listaFranjas}

      <CondicionesUso
        condiciones={condiciones}
        aceptadas={aceptaCondiciones}
        onCambiar={(acepta) =>
          setValue('aceptaCondiciones', acepta, { shouldValidate: formState.isSubmitted })
        }
        mensajeError={formState.errors.aceptaCondiciones?.message}
        deshabilitado={guardando}
      />

      {mensajeError && sugeridasError.length === 0 ? <AvisoError mensaje={mensajeError} /> : null}

      <Button
        mode="contained"
        onPress={() => confirmar()}
        loading={guardando}
        disabled={guardando}
        contentStyle={estilos.contenidoBoton}
        labelStyle={estilos.textoBoton}
        accessibilityRole="button"
        accessibilityLabel="Confirmar la solicitud de préstamo de tablet"
      >
        Confirmar solicitud
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.m },
  subtitulo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  confirmacion: { alignItems: 'center', gap: espacio.m, paddingVertical: espacio.xl },
  textoConfirmacion: { color: colores.texto, textAlign: 'center' },
  contenidoBoton: { paddingVertical: espacio.xs },
  textoBoton: { fontFamily: fuentes.seminegrita },
});
