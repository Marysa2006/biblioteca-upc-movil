/**
 * Recursos en línea (HU-03): fuentes académicas digitales, suscritas y de acceso abierto.
 * Pantalla apilada que se abre desde la pestaña Catálogo.
 *
 * Las ve todo el mundo. Las que requieren cuenta piden iniciar sesión si no hay sesión (CA3)
 * y, al entrar, se abren solas; las demás se abren en el navegador integrado (CA2).
 * Patrón de datos: useRecursos() (src/hooks) → obtenerRecursos() (src/api) → mock o API.
 */
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Portal, Snackbar, Text } from 'react-native-paper';

import { DialogoIniciarSesion } from '@/components/recursos/DialogoIniciarSesion';
import { TarjetaRecurso } from '@/components/recursos/TarjetaRecurso';
import { EncabezadoApilado, EstadoCarga, EstadoError, EstadoVacio, Pantalla } from '@/components/ui';
import { useRecursos } from '@/hooks/useRecursos';
import { useSesion } from '@/store/sesion';
import { colores, espacio } from '@/theme';
import type { Recurso } from '@/types';
import { abrirEnNavegador } from '@/utils/navegador';

/** Tiempo que se ve el aviso cuando el navegador no se puede abrir. */
const DURACION_AVISO_MS = 4000;

export default function RecursosEnLinea() {
  const { data: recursos, isPending, isError, isRefetching, refetch } = useRecursos();
  const usuario = useSesion((s) => s.usuario);

  const [recursoPendiente, setRecursoPendiente] = useState<Recurso | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // El Snackbar ya trae accessibilityLiveRegion (Android); en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  // Recurso que se quería abrir al ir al login; se abre al volver aquí con sesión.
  const recursoTrasLogin = useRef<Recurso | null>(null);

  // CA2: se abre el recurso externo.
  const abrirEnNavegadorConAviso = useCallback((recurso: Recurso) => {
    abrirEnNavegador(recurso.url).catch(() =>
      setAviso(`No se pudo abrir ${recurso.nombre}. Intenta de nuevo.`),
    );
  }, []);

  const abrirRecurso = (recurso: Recurso) => {
    // CA3: sin sesión, un recurso con cuenta pide iniciar sesión.
    if (recurso.requiereCuenta && !usuario) {
      setRecursoPendiente(recurso);
      return;
    }
    abrirEnNavegadorConAviso(recurso);
  };

  const irAlLogin = () => {
    recursoTrasLogin.current = recursoPendiente;
    setRecursoPendiente(null);
    router.push({ pathname: '/login', params: { volver: '1' } });
  };

  // Al volver del login: con sesión, se abre el recurso elegido; sin sesión (canceló), se olvida.
  useFocusEffect(
    useCallback(() => {
      const recurso = recursoTrasLogin.current;
      if (!recurso) return;
      recursoTrasLogin.current = null;
      if (usuario) abrirEnNavegadorConAviso(recurso);
    }, [usuario, abrirEnNavegadorConAviso]),
  );

  let lista;
  if (isPending) {
    lista = <EstadoCarga mensaje="Cargando recursos en línea…" />;
  } else if (isError) {
    lista = (
      <EstadoError mensaje="No pudimos cargar los recursos en línea." onReintentar={() => refetch()} />
    );
  } else if (recursos.length === 0) {
    // CA4
    lista = <EstadoVacio mensaje="Todavía no hay recursos en línea registrados." />;
  } else {
    // CA1
    lista = recursos.map((recurso) => (
      <TarjetaRecurso key={recurso.id} recurso={recurso} onPress={() => abrirRecurso(recurso)} />
    ));
  }

  return (
    <>
      <EncabezadoApilado titulo="Recursos en línea" />
      <Pantalla
        titulo="Recursos en línea"
        subtitulo="Fuentes académicas de acceso abierto y suscritas por la Universidad."
        conEncabezado
        recarga={{ recargando: isRefetching, onRecargar: () => refetch() }}
      >
        <Text variant="bodySmall" style={estilos.nota}>
          El texto completo de algunas bases depende de la suscripción de la Universidad.
        </Text>
        <View style={estilos.lista}>{lista}</View>

        <DialogoIniciarSesion
          recurso={recursoPendiente}
          onIniciarSesion={irAlLogin}
          onCerrar={() => setRecursoPendiente(null)}
        />
        <Portal>
          <Snackbar
            visible={aviso != null}
            onDismiss={() => setAviso(null)}
            duration={DURACION_AVISO_MS}
          >
            {aviso}
          </Snackbar>
        </Portal>
      </Pantalla>
    </>
  );
}

const estilos = StyleSheet.create({
  nota: { color: colores.textoSecundario },
  lista: { gap: espacio.s },
});
