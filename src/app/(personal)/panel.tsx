/**
 * Dashboard del personal (#306), con la disposición del mockup (Dashboard - Administrador.png) y
 * los datos que la app tiene. Cada parte se ve solo con su permiso:
 * - Las cifras del día: por revisar, para hoy y tablets prestadas.
 * - Resumen de hoy: una tarjeta por área (reservas, asesorías, capacitaciones y tablets), que
 *   lleva a su sección de Gestión.
 * - Por atender: las solicitudes que esperan respuesta, con chips por tipo; cada una abre su
 *   detalle, y el Dashboard no aprueba ni rechaza.
 * - Afluencia semanal (`estadisticas`): operaciones por día de la semana.
 * Los datos salen de usePanel(), que comparte la caché con Gestión y Estadísticas. Al volver a la
 * pestaña y al deslizar hacia abajo se vuelven a pedir. Cambiar a la vista de la comunidad y
 * cerrar sesión están en el menú de usuario (arriba).
 */
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { ActividadReciente } from '@/components/panel/ActividadReciente';
import { AfluenciaSemanal } from '@/components/panel/AfluenciaSemanal';
import { CifrasDelDia } from '@/components/panel/CifrasDelDia';
import { abrirPendiente, irAGestion } from '@/components/panel/navegacion';
import { TarjetaArea } from '@/components/panel/TarjetaArea';
import { EstadoCarga, EstadoError, EstadoVacio, Pantalla } from '@/components/ui';
import { usePanel } from '@/hooks/usePanel';
import { useRol } from '@/hooks/useRol';
import { useSesion } from '@/store/sesion';
import { colores, espacio, fuentes } from '@/theme';
import { fechaCompleta } from '@/utils/calendario';
import {
  afluenciaSemanal,
  cifrasDelDia,
  pendientesPorAtender,
  resumenPorArea,
} from '@/utils/panel';
import { describirRoles } from '@/utils/roles';

/** Los prefijos de las consultas del Dashboard, para volver a pedirlas al entrar a la pestaña. */
const PREFIJOS = [['reservas'], ['capacitaciones'], ['asesorias'], ['prestamos'], ['estadisticas']];

export default function Panel() {
  const usuario = useSesion((estado) => estado.usuario);
  const { tienePermiso } = useRol();
  const queryClient = useQueryClient();
  const panel = usePanel();
  const [recargando, setRecargando] = useState(false);

  // La pestaña sigue montada: al volver, se pide de nuevo lo que pudo cambiar en Gestión.
  useFocusEffect(
    useCallback(() => {
      for (const queryKey of PREFIJOS) void queryClient.invalidateQueries({ queryKey });
    }, [queryClient]),
  );

  const recargar = async () => {
    setRecargando(true);
    try {
      await panel.recargar();
    } finally {
      setRecargando(false);
    }
  };

  // «Ver todo»: la bandeja de Solicitudes, o la Agenda si la persona solo atiende asesorías.
  const seccionPendientes =
    tienePermiso('reservas') || tienePermiso('formacion') ? 'solicitudes' : 'agenda';

  let solicitudes = null;
  if (panel.conSolicitudes) {
    if (panel.cargando) {
      solicitudes = <EstadoCarga mensaje="Cargando el resumen del día…" />;
    } else if (panel.conError) {
      solicitudes = (
        <EstadoError
          mensaje="No pudimos cargar el resumen del día."
          onReintentar={() => void panel.recargar()}
        />
      );
    } else {
      solicitudes = (
        <>
          <CifrasDelDia
            cifras={cifrasDelDia(panel.datos, panel.hoy)}
            fecha={`Hoy, ${fechaCompleta(panel.hoy)}`}
          />
          <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
            Resumen de hoy
          </Text>
          <View style={estilos.cuadricula}>
            {resumenPorArea(panel.datos, panel.hoy).map((resumen) => (
              <TarjetaArea
                key={resumen.area}
                resumen={resumen}
                onAbrir={() => irAGestion(resumen.seccion, resumen.grupo)}
              />
            ))}
          </View>
          <ActividadReciente
            pendientes={pendientesPorAtender(panel.datos, panel.nombreEspacio)}
            onAbrir={(pendiente) => abrirPendiente(pendiente, panel.rangoAgenda)}
            onVerTodo={() => irAGestion(seccionPendientes)}
          />
        </>
      );
    }
  }

  let afluencia = null;
  if (panel.registros.activa) {
    if (panel.registros.cargando) {
      afluencia = <EstadoCarga mensaje="Calculando la afluencia…" />;
    } else if (panel.registros.conError || !panel.registros.lista) {
      afluencia = (
        <EstadoError
          mensaje="No pudimos cargar la afluencia semanal."
          onReintentar={panel.registros.reintentar}
        />
      );
    } else {
      afluencia = (
        <AfluenciaSemanal afluencia={afluenciaSemanal(panel.registros.lista, panel.hoy)} />
      );
    }
  }

  return (
    <Pantalla
      titulo={usuario ? `Hola, ${usuario.nombre.split(' ')[0]}` : 'Dashboard'}
      subtitulo={usuario ? describirRoles(usuario) : undefined}
      recarga={{ recargando, onRecargar: () => void recargar() }}
    >
      {!panel.conSolicitudes && !panel.registros.activa ? (
        <EstadoVacio mensaje="Tus permisos todavía no tienen solicitudes ni préstamos que atender. Cuando la administración te dé uno, lo verás aquí." />
      ) : (
        <View style={estilos.contenido}>
          {solicitudes}
          {afluencia}
        </View>
      )}
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: espacio.m },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  cuadricula: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
});
