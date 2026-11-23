/**
 * Formulario de entrega o de devolución de una tablet (HU-23).
 * - Entrega (CA1): estado del equipo y accesorios entregados; la fecha y la hora las pone el
 *   sistema al guardar. Una tablet dañada no se entrega.
 * - Entrega con constancia (versión 1.1, #253): el estado como lo nombra el formato (Nuevo,
 *   Óptimo u Otro; con Otro, las notas son obligatorias), la constancia completa antes de
 *   confirmar (constanciaDe) y la casilla de que la persona la leyó y acepta la responsabilidad.
 * - Firma electrónica (#310): la persona firma con el dedo (PanelFirma). Si no puede o prefiere
 *   el papel, se marca «Firmará en papel» y la constancia impresa trae el recuadro en blanco. Una
 *   de las dos es obligatoria para entregar.
 * - Devolución (CA2-CA4): estado, accesorios recibidos y novedades. Si volvió dañada o falta un
 *   accesorio, la novedad es obligatoria (CA3). Si llega tarde, avisa el retraso que quedará
 *   registrado (CA4).
 * Solo valida y entrega los datos: la pantalla guarda con useRegistrarEntrega() o
 * useRegistrarDevolucion().
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, Checkbox, HelperText, Icon, Text, TextInput } from 'react-native-paper';

import { ChipsOpcion } from '@/components/asesorias/ChipsOpcion';
import { AvisoError } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type {
  CondicionTablet,
  EstadoEquipo,
  FirmaElectronica,
  Prestamo,
  ResponsableTablet,
  Tablet,
} from '@/types';
import {
  accesoriosFaltantes,
  AYUDA_CONDICION,
  constanciaDe,
  crearEsquemaDevolucion,
  duracionLegible,
  esquemaEntregaConstancia,
  fechaHoraLegible,
  LARGO_MAXIMO_NOTAS_EQUIPO,
  NOMBRE_CONDICION,
  NOMBRE_ESTADO_EQUIPO,
} from '@/utils/prestamos';
import { ahoraFechaHora, minutosDeRetraso } from '@/utils/tablets';

import { CasillasAccesorios } from './CasillasAccesorios';
import { PanelFirma } from './PanelFirma';
import { VistaConstancia } from './VistaConstancia';

export type Modo = 'entrega' | 'devolucion';

export type DatosRegistro = {
  condicion: CondicionTablet;
  accesorios: string[];
  novedades?: string;
  /** Solo en la entrega (#253): el estado como lo nombra el formato y sus notas. */
  estadoEquipo?: EstadoEquipo;
  notas?: string;
  /** Solo en la entrega (#310): la firma en la pantalla; sin ella, firma en papel. */
  firmaUsuario?: FirmaElectronica;
};

const CONDICIONES: CondicionTablet[] = ['bueno', 'regular', 'danado'];

const ESTADOS_EQUIPO: EstadoEquipo[] = ['nuevo', 'optimo', 'otro'];

type Valores = {
  condicion: CondicionTablet | '';
  accesorios: string[];
  novedades: string;
  estadoEquipo: EstadoEquipo | '';
  notas: string;
  acepta: boolean;
};

type Props = {
  modo: Modo;
  prestamo: Prestamo;
  tablet: Tablet;
  /** La tablet se leyó con el escáner (HU-31): el resumen lo confirma. */
  verificada?: boolean;
  /** Quien entrega (la sesión): sale en la constancia antes de confirmar (#253). */
  quienEntrega?: ResponsableTablet;
  guardando: boolean;
  mensajeError: string | null;
  onGuardar: (datos: DatosRegistro) => void;
};

export function FormularioRegistroPrestamo({
  modo,
  prestamo,
  tablet,
  verificada = false,
  quienEntrega,
  guardando,
  mensajeError,
  onGuardar,
}: Props) {
  const esDevolucion = modo === 'devolucion';
  // En la entrega se marcan los accesorios de la tablet; en la devolución, los que se entregaron.
  const opcionesAccesorios = esDevolucion ? (prestamo.entrega?.accesorios ?? []) : tablet.accesorios;
  const [esquema] = useState(() =>
    esDevolucion ? crearEsquemaDevolucion(opcionesAccesorios) : esquemaEntregaConstancia,
  );
  // El retraso se calcula una vez al abrir; la API lo recalcula al guardar.
  const [retraso] = useState(() => (esDevolucion ? minutosDeRetraso(prestamo) : 0));

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<Valores>({
    // Cada esquema ignora los campos del otro modo: se descartan al guardar.
    resolver: zodResolver(esquema as typeof esquemaEntregaConstancia) as never,
    defaultValues: {
      condicion: esDevolucion ? '' : 'bueno',
      accesorios: [...opcionesAccesorios],
      novedades: '',
      estadoEquipo: '',
      notas: '',
      acepta: false,
    },
  });
  const [condicion, accesorios, estadoEquipo, notas, acepta] = useWatch({
    control,
    name: ['condicion', 'accesorios', 'estadoEquipo', 'notas', 'acepta'],
  });
  const faltan = esDevolucion ? accesoriosFaltantes(opcionesAccesorios, accesorios) : [];
  // #310: la firma va aparte del esquema (no es un campo de texto); se valida al guardar.
  const [firma, setFirma] = useState<FirmaElectronica | null>(null);
  const [enPapel, setEnPapel] = useState(false);
  const [intentado, setIntentado] = useState(false);
  const faltaFirma = !esDevolucion && !firma && !enPapel;

  const guardar = () => {
    setIntentado(true);
    handleSubmit((valores) => {
      if (faltaFirma) return;
      onGuardar({
        condicion: valores.condicion as CondicionTablet,
        accesorios: valores.accesorios,
        ...(esDevolucion && valores.novedades.trim()
          ? { novedades: valores.novedades.trim() }
          : {}),
        ...(!esDevolucion
          ? {
              estadoEquipo: valores.estadoEquipo as EstadoEquipo,
              ...(valores.notas.trim() ? { notas: valores.notas.trim() } : {}),
              ...(firma && !enPapel ? { firmaUsuario: firma } : {}),
            }
          : {}),
      });
    })();
  };

  // La constancia como quedará al entregar (#253): con lo elegido y quien entrega.
  const borrador = esDevolucion
    ? null
    : constanciaDe(
        {
          ...prestamo,
          estadoEquipo: estadoEquipo || undefined,
          notas: notas.trim() || undefined,
          entrega: {
            fechaHora: ahoraFechaHora(),
            condicion: condicion || 'bueno',
            accesorios,
            responsable: quienEntrega,
            ...(firma && !enPapel ? { firmaUsuario: firma } : {}),
          },
        },
        tablet,
      );

  return (
    <View style={estilos.formulario}>
      {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}

      <View style={estilos.resumen}>
        <Text variant="titleSmall" style={estilos.titulo}>
          {`${tablet.modelo} · ${tablet.codigo}`}
        </Text>
        {verificada ? (
          <View style={estilos.verificada}>
            <Icon source="check-circle-outline" size={18} color={colores.primario} />
            <Text variant="bodyMedium" style={estilos.textoVerificada}>
              Verificada con el escáner
            </Text>
          </View>
        ) : null}
        <Text variant="bodyMedium" style={estilos.texto}>
          {esDevolucion ? `La devuelve ${prestamo.solicitante}` : `Para ${prestamo.solicitante}`}
        </Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          {esDevolucion && prestamo.entrega
            ? `Salió el ${fechaHoraLegible(prestamo.entrega.fechaHora)} · hora límite ${prestamo.horaLimite}`
            : `Franja ${prestamo.horaInicio} a ${prestamo.horaLimite}`}
        </Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          {`Se registra con la fecha y hora actual: ${fechaHoraLegible(ahoraFechaHora())}.`}
        </Text>
      </View>

      {retraso > 0 ? (
        <View style={estilos.retraso} accessibilityLiveRegion="polite">
          <Icon source="clock-alert-outline" size={20} color={coloresEstado.pendiente.texto} />
          <Text variant="bodyMedium" style={estilos.textoRetraso}>
            {`Llega con ${duracionLegible(retraso)} de retraso (hora límite ${prestamo.horaLimite}). Quedará constancia en el préstamo.`}
          </Text>
        </View>
      ) : null}

      <ChipsOpcion
        titulo="Condición física"
        opciones={CONDICIONES.map((valor) => ({
          valor,
          etiqueta: NOMBRE_CONDICION[valor],
          motivo: !esDevolucion && valor === 'danado' ? 'una tablet dañada no se entrega' : undefined,
        }))}
        elegidos={condicion ? [condicion] : []}
        onCambiar={([valor]) => valor && setValue('condicion', valor, { shouldValidate: isSubmitted })}
        ayuda={condicion ? AYUDA_CONDICION[condicion] : 'Revisa la pantalla, el cuerpo y que encienda.'}
        mensajeError={errors.condicion?.message}
        deshabilitado={guardando}
      />

      <CasillasAccesorios
        titulo={esDevolucion ? 'Accesorios recibidos' : 'Accesorios entregados'}
        opciones={opcionesAccesorios}
        marcados={accesorios}
        onCambiar={(lista) => setValue('accesorios', lista, { shouldValidate: isSubmitted })}
        aviso={
          faltan.length > 0
            ? `Falta: ${faltan.join(', ')}. Descríbelo en las novedades.`
            : esDevolucion
              ? undefined
              : 'Desmarca lo que no se entregue: al recibirla se revisa lo mismo.'
        }
        deshabilitado={guardando}
      />

      {!esDevolucion ? (
        <>
          <ChipsOpcion
            titulo="Estado en la constancia"
            opciones={ESTADOS_EQUIPO.map((valor) => ({ valor, etiqueta: NOMBRE_ESTADO_EQUIPO[valor] }))}
            elegidos={estadoEquipo ? [estadoEquipo] : []}
            onCambiar={([valor]) =>
              valor && setValue('estadoEquipo', valor, { shouldValidate: isSubmitted })
            }
            ayuda="Como lo nombra el formato de responsabilidad. Con Otro, explica en las notas."
            mensajeError={errors.estadoEquipo?.message}
            deshabilitado={guardando}
          />
          <Controller
            control={control}
            name="notas"
            render={({ field: { ref, value, onChange, onBlur } }) => (
              <View>
                <TextInput
                  ref={ref}
                  mode="outlined"
                  label={estadoEquipo === 'otro' ? 'Notas (obligatorio)' : 'Notas (opcional)'}
                  placeholder="Por ejemplo: rayón leve en la parte de atrás"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.notas != null}
                  disabled={guardando}
                  multiline
                  maxLength={LARGO_MAXIMO_NOTAS_EQUIPO}
                  accessibilityLabel="Notas sobre el estado del equipo"
                />
                <HelperText type="error" visible={errors.notas != null}>
                  {errors.notas?.message ?? ''}
                </HelperText>
              </View>
            )}
          />
          {borrador ? <VistaConstancia constancia={borrador} borrador /> : null}
          <Checkbox.Item
            label="La persona leyó la constancia y acepta la responsabilidad sobre el préstamo"
            status={acepta ? 'checked' : 'unchecked'}
            onPress={() => setValue('acepta', !acepta, { shouldValidate: isSubmitted })}
            disabled={guardando}
            position="leading"
            mode="android"
            color={colores.primario}
            uncheckedColor={colores.bordeFuerte}
            style={estilos.casilla}
            labelStyle={estilos.etiquetaCasilla}
            accessibilityLabel="La persona leyó la constancia y acepta la responsabilidad sobre el préstamo"
          />
          <View accessibilityLiveRegion="polite">
            <HelperText type="error" visible={errors.acepta != null}>
              {errors.acepta?.message ?? ''}
            </HelperText>
          </View>
          {enPapel ? null : (
            <PanelFirma
              firmante={prestamo.solicitante}
              valor={firma}
              onCambiar={setFirma}
              mensajeError={
                intentado && faltaFirma
                  ? 'Falta la firma: pídele que firme, o marca que firmará en papel.'
                  : undefined
              }
              deshabilitado={guardando}
            />
          )}
          <Checkbox.Item
            label="Firmará en papel: imprime la constancia y firma a mano"
            status={enPapel ? 'checked' : 'unchecked'}
            onPress={() => setEnPapel(!enPapel)}
            disabled={guardando}
            position="leading"
            mode="android"
            color={colores.primario}
            uncheckedColor={colores.bordeFuerte}
            style={estilos.casilla}
            labelStyle={estilos.etiquetaCasilla}
            accessibilityLabel="La persona firmará en papel: imprime la constancia y firma a mano"
          />
        </>
      ) : null}

      {esDevolucion ? (
        <Controller
          control={control}
          name="novedades"
          render={({ field: { ref, value, onChange, onBlur } }) => (
            <View>
              <TextInput
                ref={ref}
                mode="outlined"
                label={condicion === 'danado' || faltan.length > 0 ? 'Novedades (obligatorio)' : 'Novedades (opcional)'}
                placeholder="Por ejemplo: la pantalla tiene un rayón en la esquina"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.novedades != null}
                disabled={guardando}
                multiline
                maxLength={300}
                accessibilityLabel="Novedades de la devolución: daños o faltantes"
              />
              <HelperText type="error" visible={errors.novedades != null}>
                {errors.novedades?.message ?? ''}
              </HelperText>
            </View>
          )}
        />
      ) : null}

      {esDevolucion && condicion === 'danado' ? (
        <Text variant="bodySmall" style={estilos.secundario}>
          La tablet quedará en mantenimiento y no se prestará hasta revisarla.
        </Text>
      ) : null}

      <Button
        mode="contained"
        icon={esDevolucion ? 'clipboard-check-outline' : 'tablet'}
        onPress={guardar}
        loading={guardando}
        disabled={guardando}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel={
          esDevolucion
            ? `Registrar la devolución y cerrar el préstamo de ${prestamo.solicitante}`
            : `Registrar la entrega de ${tablet.codigo} a ${prestamo.solicitante}`
        }
      >
        {esDevolucion ? 'Registrar devolución' : 'Registrar entrega'}
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.s },
  resumen: { gap: espacio.xs, padding: espacio.m, borderRadius: radio.tarjeta, backgroundColor: colores.superficie },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  texto: { color: colores.texto },
  secundario: { color: colores.textoSecundario },
  verificada: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
  textoVerificada: { color: colores.primario, fontFamily: fuentes.seminegrita },
  retraso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.boton,
    backgroundColor: coloresEstado.pendiente.fondo,
  },
  // Ámbar y no rojo: es un aviso, no un error del sistema.
  textoRetraso: { flex: 1, color: coloresEstado.pendiente.texto },
  contenidoBoton: { paddingVertical: espacio.xs },
  // Sin el relleno lateral del ítem, la casilla se alinea con el texto de arriba.
  casilla: { paddingHorizontal: 0 },
  etiquetaCasilla: { color: colores.texto, fontFamily: fuentes.seminegrita, textAlign: 'left' },
});
