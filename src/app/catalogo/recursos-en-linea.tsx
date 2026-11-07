/**
 * Bibliotecas en línea (HU-03, "recursos académicos"): fuentes académicas digitales, suscritas y
 * de acceso abierto. Se llaman así, como en el portal de la Universidad; la ruta y el código
 * siguen diciendo "recursos". En la búsqueda y el contador, cada una es una "fuente".
 * Pantalla apilada que se abre desde la pestaña Catálogo.
 *
 * Las ve todo el mundo. Las que requieren cuenta piden iniciar sesión si no hay sesión (CA3)
 * y, al entrar, se abren solas; las demás se abren en el navegador integrado (CA2).
 * Mejora (#201): arriba, buscar por nombre o tema y chips por área; se busca en la lista, no
 * dentro de cada base. La cantidad de resultados se anuncia al lector de pantalla.
 * Patrón de datos: useRecursos() (src/hooks) → obtenerRecursos() (src/api) → mock o API.
 */
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Portal, Snackbar, Text } from 'react-native-paper';

import { CampoBusqueda } from '@/components/catalogo/CampoBusqueda';
import { DialogoIniciarSesion } from '@/components/recursos/DialogoIniciarSesion';
import { TarjetaRecurso } from '@/components/recursos/TarjetaRecurso';
import {
  ChipsFiltro,
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
  type OpcionFiltro,
} from '@/components/ui';
import { useRecursos } from '@/hooks/useRecursos';
import { useSesion } from '@/store/sesion';
import { colores, espacio } from '@/theme';
import type { Recurso } from '@/types';
import { abrirEnNavegador } from '@/utils/navegador';
import {
  AREAS_RECURSO,
  areasDeRecurso,
  buscarRecursos,
  NOMBRE_AREA,
  textoRecursos,
  type AreaRecurso,
} from '@/utils/recursos';

/** Tiempo que se ve el aviso cuando el navegador no se puede abrir. */
const DURACION_AVISO_MS = 4000;

export default function RecursosEnLinea() {
  const { data: recursos, isPending, isError, isRefetching, refetch } = useRecursos();
  const usuario = useSesion((s) => s.usuario);

  const [recursoPendiente, setRecursoPendiente] = useState<Recurso | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [area, setArea] = useState<AreaRecurso | 'todas'>('todas');
  // Cambiarla vuelve a montar el campo vacío: así "Limpiar búsqueda" también borra lo escrito.
  const [campo, setCampo] = useState(0);

  const filtrando = busqueda !== '' || area !== 'todas';
  const encontrados = recursos ? buscarRecursos(recursos, busqueda, area) : [];
  const resumen = filtrando ? textoRecursos(encontrados.length) : null;

  // CA3: en Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && resumen) {
      AccessibilityInfo.announceForAccessibility(resumen);
    }
  }, [resumen]);

  const limpiar = () => {
    setBusqueda('');
    setArea('todas');
    setCampo((n) => n + 1);
  };

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
    lista = <EstadoCarga mensaje="Cargando bibliotecas en línea…" />;
  } else if (isError) {
    lista = (
      <EstadoError
        mensaje="No pudimos cargar las bibliotecas en línea."
        onReintentar={() => refetch()}
      />
    );
  } else if (recursos.length === 0) {
    // CA4
    lista = <EstadoVacio mensaje="Todavía no hay bibliotecas en línea registradas." />;
  } else {
    // Los chips cuentan lo que coincide con la búsqueda en cada área.
    const conBusqueda = buscarRecursos(recursos, busqueda);
    const areas: OpcionFiltro<AreaRecurso | 'todas'>[] = [
      { valor: 'todas', etiqueta: 'Todas', cantidad: conBusqueda.length },
      ...AREAS_RECURSO.map((valor) => ({
        valor,
        etiqueta: NOMBRE_AREA[valor],
        cantidad: conBusqueda.filter((recurso) => areasDeRecurso(recurso).includes(valor)).length,
      })),
    ];

    lista = (
      <>
        <ChipsFiltro
          opciones={areas}
          valor={area}
          onCambiar={setArea}
          descripcion="Filtrar las fuentes por área"
        />
        {resumen ? (
          <Text variant="bodyMedium" style={estilos.nota} accessibilityLiveRegion="polite">
            {busqueda ? `${resumen} para «${busqueda}»` : resumen}
          </Text>
        ) : null}
        {encontrados.length === 0 ? (
          // CA2
          <View style={estilos.sinResultados}>
            <EstadoVacio
              mensaje={
                busqueda
                  ? `Ninguna fuente coincide con «${busqueda}». Prueba con otro nombre o tema.`
                  : 'No hay fuentes en esta área.'
              }
            />
            <Button
              mode="outlined"
              icon="close"
              onPress={limpiar}
              style={estilos.limpiar}
              accessibilityRole="button"
              accessibilityLabel="Limpiar la búsqueda y ver todas las fuentes"
            >
              Limpiar búsqueda
            </Button>
          </View>
        ) : (
          // CA1
          encontrados.map((recurso) => (
            <TarjetaRecurso
              key={recurso.id}
              recurso={recurso}
              onPress={() => abrirRecurso(recurso)}
            />
          ))
        )}
      </>
    );
  }

  return (
    <>
      <EncabezadoApilado titulo="Bibliotecas en línea" />
      <Pantalla
        titulo="Bibliotecas en línea"
        subtitulo="Fuentes académicas de acceso abierto y suscritas por la Universidad."
        conEncabezado
        recarga={{ recargando: isRefetching, onRecargar: () => refetch() }}
      >
        <Text variant="bodySmall" style={estilos.nota}>
          El texto completo de algunas bases depende de la suscripción de la Universidad.
        </Text>
        {recursos && recursos.length > 0 ? (
          <CampoBusqueda
            key={campo}
            etiqueta="Buscar entre las fuentes"
            ejemplo="Nombre o tema, por ejemplo: enfermería"
            onBuscar={setBusqueda}
          />
        ) : null}
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
  sinResultados: { gap: espacio.s },
  limpiar: { alignSelf: 'center' },
});
