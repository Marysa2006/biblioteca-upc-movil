/**
 * Catálogo de la comunidad: acceso al OPAC de Koha (HU-02) y bases de datos y recursos (HU-03).
 *
 * Recursos: los ve todo el mundo. Los que requieren cuenta piden iniciar sesión si no hay
 * sesión (CA3) y, al entrar, se abren solos; los demás se abren en el navegador integrado (CA2).
 * Patrón de datos: useRecursos() (src/hooks) → obtenerRecursos() (src/api) → mock o API.
 */
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Icon, Portal, Snackbar, Text } from 'react-native-paper';

import { TarjetaCatalogoKoha } from '@/components/catalogo/TarjetaCatalogoKoha';
import { DialogoIniciarSesion } from '@/components/recursos/DialogoIniciarSesion';
import { TarjetaRecurso } from '@/components/recursos/TarjetaRecurso';
import { EstadoCarga, EstadoError, EstadoVacio, Pantalla } from '@/components/ui';
import { useCatalogoKoha } from '@/hooks/useCatalogoKoha';
import { useRecursos } from '@/hooks/useRecursos';
import { useSesion } from '@/store/sesion';
import { colores, espacio, fuentes } from '@/theme';
import type { Recurso } from '@/types';
import { abrirEnNavegador } from '@/utils/navegador';

/** Tiempo que se ve el aviso cuando el navegador no se puede abrir. */
const DURACION_AVISO_MS = 4000;

export default function Catalogo() {
  const { estado, abrirCatalogo } = useCatalogoKoha();
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

  // Recurso que se quería abrir al ir al login; se abre al volver a Catálogo con sesión.
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

  let listaRecursos;
  if (isPending) {
    listaRecursos = <EstadoCarga mensaje="Cargando recursos…" />;
  } else if (isError) {
    listaRecursos = (
      <EstadoError mensaje="No pudimos cargar los recursos." onReintentar={() => refetch()} />
    );
  } else if (recursos.length === 0) {
    // CA4
    listaRecursos = <EstadoVacio mensaje="Todavía no hay bases de datos registradas." />;
  } else {
    // CA1
    listaRecursos = recursos.map((recurso) => (
      <TarjetaRecurso key={recurso.id} recurso={recurso} onPress={() => abrirRecurso(recurso)} />
    ));
  }

  return (
    <Pantalla
      titulo="Catálogo"
      subtitulo="Material de la biblioteca y bases de datos académicas"
      recarga={{ recargando: isRefetching, onRecargar: () => refetch() }}
    >
      <TarjetaCatalogoKoha estado={estado} onAbrir={abrirCatalogo} />

      <View style={estilos.encabezado}>
        <View style={estilos.filaTitulo}>
          <Icon source="database-outline" size={24} color={colores.primario} />
          <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
            Bases de datos y recursos
          </Text>
        </View>
        <Text variant="bodyMedium" style={estilos.descripcion}>
          Fuentes académicas de acceso abierto y suscritas por la Universidad.
        </Text>
        <Text variant="bodySmall" style={estilos.descripcion}>
          El texto completo de algunas bases depende de la suscripción de la Universidad.
        </Text>
      </View>
      <View style={estilos.lista}>{listaRecursos}</View>

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
  );
}

const estilos = StyleSheet.create({
  encabezado: { gap: espacio.xs, marginTop: espacio.s },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  titulo: { flex: 1, color: colores.texto, fontFamily: fuentes.negrita },
  descripcion: { color: colores.textoSecundario },
  lista: { gap: espacio.s },
});
