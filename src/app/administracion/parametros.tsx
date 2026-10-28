/**
 * Parámetros generales (HU-28): periodos, festivos, horarios, tiempos mínimos y textos.
 * Pantalla apilada; se abre desde el menú "Administración" de Personal. Solo con el permiso 'parametros'.
 *
 * - CA1: "Guardar cambios" guarda todo junto; la caché de useParametros() queda con lo nuevo.
 * - CA2: el formulario valida antes de enviar (esquemaParametros) y la API vuelve a validar.
 * - CA3: "Consultar disponibilidad" usa esDiaHabil() con lo guardado.
 * Patrón de datos: useParametros() / useActualizarParametros() (src/hooks) → src/api → mock o API.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { AccessibilityInfo, Platform, StyleSheet } from 'react-native';
import { Button, Portal, Snackbar } from 'react-native-paper';

import { ConsultaDisponibilidad } from '@/components/parametros/ConsultaDisponibilidad';
import { SeccionFestivos } from '@/components/parametros/SeccionFestivos';
import { SeccionHorarios } from '@/components/parametros/SeccionHorarios';
import { SeccionPeriodos } from '@/components/parametros/SeccionPeriodos';
import { SeccionPlazos } from '@/components/parametros/SeccionPlazos';
import { SinPermiso } from '@/components/personal/SinPermiso';
import { AvisoError, EncabezadoApilado, EstadoCarga, EstadoError, Pantalla } from '@/components/ui';
import { useActualizarParametros, useParametros } from '@/hooks/useParametros';
import { useRol } from '@/hooks/useRol';
import { espacio } from '@/theme';
import type { Parametros } from '@/types';
import { mensajeErrorGuardar } from '@/utils/errores';
import { aFormulario, aParametros, esquemaParametros } from '@/utils/parametros';

const TITULO = 'Parámetros generales';
const MENSAJE_GUARDADO = 'Los parámetros quedaron guardados.';
/** Tiempo que se ve la confirmación al guardar. */
const DURACION_CONFIRMACION_MS = 3000;

export default function ParametrosGenerales() {
  const { tienePermiso } = useRol();
  const { data, isPending, isError, refetch } = useParametros();

  let contenido;
  if (!tienePermiso('parametros')) {
    contenido = <SinPermiso />;
  } else if (isPending) {
    contenido = <EstadoCarga mensaje="Cargando los parámetros…" />;
  } else if (isError) {
    contenido = <EstadoError mensaje="No pudimos cargar los parámetros." onReintentar={() => refetch()} />;
  } else {
    contenido = <Formulario guardados={data} />;
  }

  return (
    <>
      <EncabezadoApilado titulo={TITULO} />
      <Pantalla
        titulo={TITULO}
        subtitulo="Adaptan el funcionamiento de los servicios a la biblioteca."
        conEncabezado
        conTeclado
      >
        {contenido}
      </Pantalla>
    </>
  );
}

function Formulario({ guardados }: { guardados: Parametros }) {
  const { mutate, isPending: guardando, error, reset } = useActualizarParametros();
  const [hayErrores, setHayErrores] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // values (y no defaultValues): al guardar, el formulario toma lo guardado y deja de estar "sucio".
  const valores = useMemo(() => aFormulario(guardados), [guardados]);
  const formulario = useForm({ resolver: zodResolver(esquemaParametros), values: valores });
  const { isDirty } = formulario.formState;

  // El Snackbar ya trae accessibilityLiveRegion (Android); en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && guardado) {
      AccessibilityInfo.announceForAccessibility(MENSAJE_GUARDADO);
    }
  }, [guardado]);

  const guardar = formulario.handleSubmit(
    (datos) => {
      setHayErrores(false);
      reset();
      mutate(aParametros(datos), { onSuccess: () => setGuardado(true) });
    },
    // El formulario es largo: si el error queda fuera de la vista, este aviso lo dice junto al botón.
    () => setHayErrores(true),
  );

  return (
    <FormProvider {...formulario}>
      <SeccionPeriodos deshabilitado={guardando} />
      <SeccionFestivos deshabilitado={guardando} />
      <SeccionHorarios deshabilitado={guardando} />
      <SeccionPlazos deshabilitado={guardando} />

      {hayErrores ? (
        <AvisoError mensaje="Revisa los campos marcados en rojo: hay valores inconsistentes." />
      ) : null}
      {error ? <AvisoError mensaje={mensajeErrorGuardar(error)} /> : null}

      <Button
        mode="contained"
        icon="content-save-outline"
        onPress={() => guardar()}
        loading={guardando}
        disabled={guardando || !isDirty}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Guardar cambios de los parámetros"
      >
        Guardar cambios
      </Button>

      <ConsultaDisponibilidad parametros={guardados} />

      <Portal>
        <Snackbar
          visible={guardado}
          onDismiss={() => setGuardado(false)}
          duration={DURACION_CONFIRMACION_MS}
        >
          {MENSAJE_GUARDADO}
        </Snackbar>
      </Portal>
    </FormProvider>
  );
}

const estilos = StyleSheet.create({
  contenidoBoton: { paddingVertical: espacio.xs },
});
