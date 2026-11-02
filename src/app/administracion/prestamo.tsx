/**
 * Entregar o recibir una tablet (HU-23), con ?id=<préstamo>&modo=entrega|devolucion.
 * Se abre desde Inventario → Préstamos.
 *
 * Antes del formulario revisa que el préstamo esté en el estado que toca, que la tablet esté
 * disponible para entregar y que no se entregue antes del día del préstamo. Al guardar muestra
 * lo que quedó registrado: entrega (CA1), cierre (CA2), novedad (CA3) y retraso (CA4).
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import {
  FormularioRegistroPrestamo,
  type DatosRegistro,
  type Modo,
} from '@/components/inventario/FormularioRegistroPrestamo';
import { SinPermiso } from '@/components/personal/SinPermiso';
import {
  AvisoError,
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import { useRol } from '@/hooks/useRol';
import { usePrestamos, useRegistrarDevolucion, useRegistrarEntrega, useTablets } from '@/hooks/useTablets';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Prestamo } from '@/types';
import { mensajeErrorGuardar } from '@/utils/errores';
import { fechaLegible, hoyISO } from '@/utils/fechas';
import { duracionLegible, fechaHoraLegible, NOMBRE_CONDICION } from '@/utils/prestamos';

export default function RegistroPrestamo() {
  const { id, modo } = useLocalSearchParams<{ id?: string; modo?: string }>();
  const { tienePermiso } = useRol();
  const modoValido: Modo | null = modo === 'entrega' || modo === 'devolucion' ? modo : null;
  const titulo = modoValido === 'devolucion' ? 'Registrar devolución' : 'Registrar entrega';

  return (
    <>
      <EncabezadoApilado titulo={titulo} />
      <Pantalla titulo={titulo} conEncabezado conTeclado>
        {!tienePermiso('tablets') ? (
          <SinPermiso />
        ) : id && modoValido ? (
          <Registro id={id} modo={modoValido} />
        ) : (
          <EstadoVacio mensaje="Elige un préstamo desde Inventario → Préstamos." />
        )}
      </Pantalla>
    </>
  );
}

function Registro({ id, modo }: { id: string; modo: Modo }) {
  const prestamos = usePrestamos('todas');
  const tablets = useTablets();
  const entregar = useRegistrarEntrega();
  const recibir = useRegistrarDevolucion();
  const [registrado, setRegistrado] = useState<Prestamo | null>(null);
  const mutacion = modo === 'entrega' ? entregar : recibir;

  if (registrado) return <Resultado prestamo={registrado} modo={modo} />;

  if (prestamos.isPending || tablets.isPending) return <EstadoCarga mensaje="Cargando el préstamo…" />;
  if (prestamos.isError || tablets.isError) {
    return (
      <EstadoError
        mensaje="No pudimos cargar el préstamo."
        onReintentar={() => {
          prestamos.refetch();
          tablets.refetch();
        }}
      />
    );
  }

  const prestamo = prestamos.data.find((p) => p.id === id);
  if (!prestamo) return <EstadoVacio mensaje="Este préstamo ya no existe." />;
  const tablet = tablets.data.find((t) => t.id === prestamo.tabletId);
  if (!tablet) return <EstadoVacio mensaje="La tablet de este préstamo ya no está en el inventario." />;

  // El préstamo debe estar en el estado que toca.
  if (modo === 'entrega' && prestamo.estado !== 'reservado') {
    return <EstadoVacio mensaje="Este préstamo ya no está reservado: no hay nada que entregar." />;
  }
  if (modo === 'devolucion' && prestamo.estado !== 'entregado' && prestamo.estado !== 'vencido') {
    return <EstadoVacio mensaje="Este préstamo no tiene una tablet por recibir." />;
  }
  if (modo === 'entrega' && prestamo.fecha > hoyISO()) {
    return <AvisoError mensaje={`Este préstamo es para el ${fechaLegible(prestamo.fecha)}: la tablet se entrega ese día.`} />;
  }
  if (modo === 'entrega' && tablet.estado !== 'disponible') {
    return (
      <AvisoError
        mensaje={`${tablet.codigo} no está disponible para entregar (está ${tablet.estado === 'mantenimiento' ? 'en mantenimiento' : tablet.estado === 'de_baja' ? 'de baja' : 'prestada'}). Revísala en la sección Tablets.`}
      />
    );
  }

  const guardar = (datos: DatosRegistro) => {
    const opciones = { onSuccess: (actualizado: Prestamo) => setRegistrado(actualizado) };
    if (modo === 'entrega') {
      entregar.reset();
      entregar.mutate({ prestamoId: id, datos: { condicion: datos.condicion, accesorios: datos.accesorios } }, opciones);
    } else {
      recibir.reset();
      recibir.mutate({ prestamoId: id, datos }, opciones);
    }
  };

  return (
    <View style={estilos.contenedor}>
      {modo === 'entrega' && prestamo.fecha < hoyISO() ? (
        <AvisoError mensaje={`Ojo: este préstamo era para el ${fechaLegible(prestamo.fecha)}. Confirma con la persona antes de entregar.`} />
      ) : null}
      <FormularioRegistroPrestamo
        modo={modo}
        prestamo={prestamo}
        tablet={tablet}
        guardando={mutacion.isPending}
        mensajeError={mutacion.error ? mensajeErrorGuardar(mutacion.error) : null}
        onGuardar={guardar}
      />
    </View>
  );
}

/** Lo que quedó registrado, con la acción para volver a Préstamos. */
function Resultado({ prestamo, modo }: { prestamo: Prestamo; modo: Modo }) {
  const registro = modo === 'entrega' ? prestamo.entrega : prestamo.devolucion;
  const lineas: string[] = [];
  if (registro) {
    lineas.push(`${modo === 'entrega' ? 'Entregada' : 'Recibida'} el ${fechaHoraLegible(registro.fechaHora)}, en estado ${NOMBRE_CONDICION[registro.condicion].toLowerCase()}.`);
    lineas.push(registro.accesorios.length > 0 ? `Accesorios: ${registro.accesorios.join(', ')}.` : 'Sin accesorios.');
  }
  if (modo === 'entrega') {
    lineas.push(`Debe devolverla antes de las ${prestamo.horaLimite}.`);
  } else {
    lineas.push('El préstamo quedó cerrado.');
    if (prestamo.devolucion?.tardia) lineas.push(`Quedó constancia del retraso: ${duracionLegible(prestamo.devolucion.retrasoMinutos ?? 0)}.`);
    if (prestamo.devolucion?.novedades) lineas.push(`Novedad registrada: ${prestamo.devolucion.novedades}`);
    if (prestamo.devolucion?.condicion === 'danado') lineas.push('La tablet pasó a mantenimiento.');
  }

  return (
    <View style={estilos.exito} accessibilityLiveRegion="polite">
      <View style={estilos.fila}>
        <Icon source="check-circle-outline" size={24} color={colores.primarioOscuro} />
        <Text variant="titleMedium" style={estilos.tituloExito}>
          {modo === 'entrega' ? `Entregada a ${prestamo.solicitante}` : `Devolución de ${prestamo.solicitante}`}
        </Text>
      </View>
      {lineas.map((linea) => (
        <Text key={linea} variant="bodyMedium" style={estilos.texto}>
          {linea}
        </Text>
      ))}
      <Button
        mode="contained"
        icon="arrow-left"
        onPress={() => router.back()}
        style={estilos.boton}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Volver a Préstamos"
      >
        Volver a Préstamos
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.m },
  exito: { gap: espacio.s, padding: espacio.m, borderRadius: radio.tarjeta, backgroundColor: colores.primarioSuave },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  tituloExito: { flex: 1, color: colores.primarioOscuro, fontFamily: fuentes.negrita },
  texto: { color: colores.texto },
  boton: { alignSelf: 'flex-start', marginTop: espacio.xs },
  contenidoBoton: { paddingVertical: espacio.xs },
});
