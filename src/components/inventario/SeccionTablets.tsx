/**
 * Sección Tablets de Inventario (permiso `tablets`). Archivo de HU-21 (Jhon).
 * Se ve con el permiso que define inventario.tsx.
 *
 * Como el mockup de Inventario: resumen de la flota, búsqueda por código o serial, chips de
 * filtro por estado y una tarjeta por tablet. Registrar y editar van en /administracion/tablet
 * (CA1, CA2); el cambio de estado rápido está en la tarjeta (CA3).
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Portal, Searchbar, Snackbar } from 'react-native-paper';

import { ResumenFlota } from '@/components/inventario/ResumenFlota';
import { TarjetaTablet } from '@/components/inventario/TarjetaTablet';
import { ChipsFiltro, EstadoCarga, EstadoError, EstadoVacio, type OpcionFiltro } from '@/components/ui';
import { useCambiarEstadoTablet, useTablets } from '@/hooks/useTablets';
import { colores, espacio } from '@/theme';
import type { EstadoTablet, Tablet } from '@/types';
import { filtrarTablets, NOMBRE_ESTADO_TABLET, resumenFlota } from '@/utils/inventario';

type Filtro = EstadoTablet | 'todas';

/** Tiempo que se ve el aviso de cada acción. */
const DURACION_AVISO_MS = 4000;

const ORDEN_FILTROS: EstadoTablet[] = ['disponible', 'en_prestamo', 'mantenimiento', 'de_baja'];

export function SeccionTablets() {
  const { data, isPending, isError, refetch } = useTablets();
  const cambiarEstado = useCambiarEstadoTablet();
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);

  // El Snackbar ya trae accessibilityLiveRegion (Android); en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  const cambiar = (tablet: Tablet, estado: EstadoTablet) =>
    cambiarEstado.mutate(
      { id: tablet.id, estado },
      {
        onSuccess: () =>
          setAviso(
            estado === 'disponible'
              ? `${tablet.codigo} ya se ofrece para préstamo.`
              : `${tablet.codigo} pasó a ${NOMBRE_ESTADO_TABLET[estado].toLowerCase()}: ya no se presta.`,
          ),
        onError: () => setAviso(`No se pudo cambiar el estado de ${tablet.codigo}.`),
      },
    );

  const registrar = (
    <Button
      mode="contained"
      icon="plus-circle-outline"
      onPress={() => router.push('/administracion/tablet')}
      contentStyle={estilos.contenidoBoton}
      accessibilityRole="button"
      accessibilityLabel="Registrar tablet"
    >
      Registrar tablet
    </Button>
  );

  if (isPending) return <EstadoCarga mensaje="Cargando el inventario…" />;
  if (isError) {
    return <EstadoError mensaje="No pudimos cargar el inventario de tablets." onReintentar={() => refetch()} />;
  }
  if (data.length === 0) {
    return (
      <View style={estilos.seccion}>
        {registrar}
        <EstadoVacio mensaje="Todavía no hay tablets. Registra la primera." />
      </View>
    );
  }

  const resumen = resumenFlota(data);
  const opciones: OpcionFiltro<Filtro>[] = [
    { valor: 'todas', etiqueta: 'Todas', cantidad: resumen.total },
    ...ORDEN_FILTROS.filter((estado) => resumen[estado] > 0 || estado === filtro).map((estado) => ({
      valor: estado,
      etiqueta: NOMBRE_ESTADO_TABLET[estado],
      cantidad: resumen[estado],
    })),
  ];
  const visibles = filtrarTablets(data, filtro, busqueda);

  return (
    <View style={estilos.seccion}>
      <ResumenFlota resumen={resumen} />
      {registrar}
      <Searchbar
        placeholder="Buscar por código, serial o modelo"
        value={busqueda}
        onChangeText={setBusqueda}
        autoCapitalize="none"
        autoCorrect={false}
        style={estilos.buscador}
        iconColor={colores.textoSecundario}
        accessibilityLabel="Buscar tablet por código, serial o modelo"
      />
      <ChipsFiltro opciones={opciones} valor={filtro} onCambiar={setFiltro} descripcion="Filtrar por estado" />

      {visibles.length === 0 ? (
        <EstadoVacio
          mensaje={busqueda ? `Ninguna tablet coincide con "${busqueda.trim()}".` : 'No hay tablets con este estado.'}
        />
      ) : (
        visibles.map((tablet) => (
          <TarjetaTablet
            key={tablet.id}
            tablet={tablet}
            cambiando={cambiarEstado.isPending && cambiarEstado.variables?.id === tablet.id}
            onEditar={() => router.push({ pathname: '/administracion/tablet', params: { id: tablet.id } })}
            onCambiarEstado={(estado) => cambiar(tablet, estado)}
          />
        ))
      )}

      <Portal>
        <Snackbar visible={aviso != null} onDismiss={() => setAviso(null)} duration={DURACION_AVISO_MS}>
          {aviso}
        </Snackbar>
      </Portal>
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: { gap: espacio.s },
  buscador: { backgroundColor: colores.superficie },
  contenidoBoton: { paddingVertical: espacio.xs },
});
