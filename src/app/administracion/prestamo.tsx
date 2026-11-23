/**
 * Entregar o recibir una tablet (HU-23), con ?id=<préstamo>&modo=entrega|devolucion.
 * Se abre desde Gestión → Préstamos. Con &verificada=1, la tablet se leyó con el escáner
 * (HU-31) y el resumen lo dice. En la entrega, &tabletId=<tablet> la deja elegida: viene de
 * escanear una tablet libre en "Escanear tablet" (#310).
 *
 * Antes del formulario revisa que el préstamo esté en el estado que toca y que no se entregue
 * antes del día del préstamo. Desde el #310 la tablet se asigna al entregarla: se elige o se
 * escanea aquí (SelectorTabletEntrega), entre las libres toda la franja del préstamo.
 * Al guardar muestra lo que quedó registrado: entrega (CA1), cierre (CA2), novedad (CA3) y retraso (CA4).
 * Versión 1.1 (#253): la entrega lleva el estado del formato y la constancia; quien entrega y
 * quien recibe salen de la sesión. El resultado muestra la constancia y la comparte en PDF.
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
import { SelectorTabletEntrega } from '@/components/inventario/SelectorTabletEntrega';
import { BotonCompartirConstancia } from '@/components/inventario/BotonCompartirConstancia';
import { VistaConstancia } from '@/components/inventario/VistaConstancia';
import { useRol } from '@/hooks/useRol';
import {
  useConstancia,
  usePrestamos,
  useRegistrarDevolucion,
  useRegistrarEntrega,
  useTablets,
} from '@/hooks/useTablets';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Prestamo } from '@/types';
import { mensajeErrorGuardar } from '@/utils/errores';
import { fechaLegible, hoyISO } from '@/utils/fechas';
import { duracionLegible, fechaHoraLegible, NOMBRE_CONDICION } from '@/utils/prestamos';
import { tabletsParaEntregar } from '@/utils/tablets';

export default function RegistroPrestamo() {
  const { id, modo, verificada, tabletId } = useLocalSearchParams<{
    id?: string;
    modo?: string;
    verificada?: string;
    tabletId?: string;
  }>();
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
          <Registro
            id={id}
            modo={modoValido}
            verificada={verificada === '1'}
            tabletInicial={tabletId}
          />
        ) : (
          <EstadoVacio mensaje="Elige un préstamo desde Gestión → Préstamos." />
        )}
      </Pantalla>
    </>
  );
}

function Registro({
  id,
  modo,
  verificada,
  tabletInicial,
}: {
  id: string;
  modo: Modo;
  verificada: boolean;
  /** La tablet escaneada en "Escanear tablet" (#310). */
  tabletInicial?: string;
}) {
  const { usuario } = useRol();
  const prestamos = usePrestamos('todas');
  const tablets = useTablets();
  const entregar = useRegistrarEntrega();
  const recibir = useRegistrarDevolucion();
  const [registrado, setRegistrado] = useState<Prestamo | null>(null);
  // #310: la tablet que se entrega. Sin elegir, la escaneada al venir de "Escanear tablet" o,
  // si no, la provisional; cualquiera de las dos solo si sirve en este préstamo.
  const [elegida, setElegida] = useState<{ id: string; escaneada: boolean } | null>(null);
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
  if (!prestamo) return <EstadoVacio pose="buscando" mensaje="Este préstamo ya no existe." />;
  // En la devolución, la tablet que se entregó; en la entrega, la que se elija (#310).
  const paraEntregar =
    modo === 'entrega' ? tabletsParaEntregar(tablets.data, prestamos.data, prestamo) : [];
  const tabletId =
    modo === 'devolucion'
      ? prestamo.tabletId
      : (elegida?.id ??
        paraEntregar.find((t) => t.id === tabletInicial)?.id ??
        paraEntregar.find((t) => t.id === prestamo.tabletId)?.id ??
        '');
  const escaneada = elegida ? elegida.escaneada : verificada && tabletId === tabletInicial;
  const tablet = tablets.data.find((t) => t.id === tabletId);
  if (modo === 'devolucion' && !tablet)
    return (
      <EstadoVacio
        pose="buscando"
        mensaje="La tablet de este préstamo ya no está en el inventario."
      />
    );

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
  if (modo === 'entrega' && paraEntregar.length === 0) {
    return (
      <AvisoError mensaje="No hay tablets libres en las horas de este préstamo. Revisa la sección Tablets." />
    );
  }

  const guardar = (datos: DatosRegistro) => {
    const opciones = { onSuccess: (actualizado: Prestamo) => setRegistrado(actualizado) };
    if (modo === 'entrega') {
      entregar.reset();
      entregar.mutate(
        {
          prestamoId: id,
          datos: {
            condicion: datos.condicion,
            accesorios: datos.accesorios,
            estadoEquipo: datos.estadoEquipo,
            tabletId,
            ...(datos.notas ? { notas: datos.notas } : {}),
            // #310: la firma del usuario en la pantalla; sin ella, firmó en papel.
            ...(datos.firmaUsuario ? { firmaUsuario: datos.firmaUsuario } : {}),
          },
        },
        opciones,
      );
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
      {modo === 'entrega' ? (
        <SelectorTabletEntrega
          prestamo={prestamo}
          tablets={tablets.data}
          prestamos={prestamos.data}
          opciones={paraEntregar}
          valor={tabletId}
          onElegir={(id, escaneada) => {
            entregar.reset();
            setElegida({ id, escaneada });
          }}
        />
      ) : null}
      {tablet ? (
        <FormularioRegistroPrestamo
          // Otra tablet, otros accesorios: el formulario empieza de nuevo.
          key={tablet.id}
          modo={modo}
          prestamo={prestamo}
          tablet={tablet}
          verificada={modo === 'entrega' ? escaneada : verificada}
          quienEntrega={
            usuario ? { id: usuario.id, nombre: usuario.nombre, cargo: usuario.cargo } : undefined
          }
          guardando={mutacion.isPending}
          mensajeError={mutacion.error ? mensajeErrorGuardar(mutacion.error) : null}
          onGuardar={guardar}
        />
      ) : null}
    </View>
  );
}

/** Lo que quedó registrado, la constancia (#253) y la acción para volver a Préstamos. */
function Resultado({ prestamo, modo }: { prestamo: Prestamo; modo: Modo }) {
  const constancia = useConstancia(prestamo.id);
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

  let vistaConstancia;
  if (constancia.isPending) {
    vistaConstancia = <EstadoCarga mensaje="Cargando la constancia…" />;
  } else if (constancia.isError) {
    vistaConstancia = (
      <EstadoError mensaje="No pudimos cargar la constancia." onReintentar={() => constancia.refetch()} />
    );
  } else {
    vistaConstancia = (
      <>
        <VistaConstancia constancia={constancia.data} />
        <BotonCompartirConstancia constancia={constancia.data} />
      </>
    );
  }

  return (
    <View style={estilos.contenedor}>
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
      {vistaConstancia}
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
