/**
 * Accesos a la administración del portal (HU-04, HU-28, HU-13 y HU-09), en la sección "Portal" de Gestión.
 * Cada fila se muestra solo con su permiso; toda la fila se puede presionar.
 */
import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { useRol } from '@/hooks/useRol';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Permiso } from '@/types';

type Acceso = {
  titulo: string;
  descripcion: string;
  icono: string;
  destino: Href;
  permiso: Permiso;
  /** No se muestra si además tiene este permiso: otra fila ya cubre lo mismo (#257). */
  ocultarCon?: Permiso;
};

const ACCESOS: Acceso[] = [
  {
    titulo: 'Contenidos del portal',
    descripcion: 'Servicios, avisos y novedades que ve la comunidad.',
    icono: 'file-document-edit-outline',
    destino: '/administracion/contenidos',
    permiso: 'contenidos',
  },
  {
    // Versión 1.1 (#257): quien solo tiene `novedades` publica avisos e informativos, no servicios.
    titulo: 'Avisos y novedades',
    descripcion: 'Los avisos y los informativos que ve la comunidad en Inicio.',
    icono: 'bullhorn-outline',
    destino: '/administracion/contenidos',
    permiso: 'novedades',
    ocultarCon: 'contenidos',
  },
  {
    titulo: 'Parámetros generales',
    descripcion: 'Periodos, festivos, horarios, tiempos mínimos y textos automáticos.',
    icono: 'tune-variant',
    destino: '/administracion/parametros',
    permiso: 'parametros',
  },
  {
    // Versión 1.1 (#250): sin jornadas; la persona pide fecha y hora y el personal confirma.
    titulo: 'Temas de asesoría',
    descripcion: 'Los temas en los que la comunidad puede pedir una asesoría.',
    icono: 'calendar-clock-outline',
    destino: '/administracion/asesorias',
    permiso: 'asesorias',
  },
  {
    titulo: 'Líneas de formación',
    descripcion: 'Las capacitaciones que la comunidad puede solicitar.',
    icono: 'school-outline',
    destino: '/administracion/lineas',
    permiso: 'formacion',
  },
];

/** ¿Quien tiene la sesión puede entrar a alguna función del portal? */
export function usePuedeAdministrarPortal(): boolean {
  const { tienePermiso } = useRol();
  return ACCESOS.some((acceso) => tienePermiso(acceso.permiso));
}

export function MenuAdministracion() {
  const { tienePermiso } = useRol();
  const accesos = ACCESOS.filter(
    (acceso) =>
      tienePermiso(acceso.permiso) && !(acceso.ocultarCon && tienePermiso(acceso.ocultarCon)),
  );

  return (
    <View style={estilos.menu}>
      {accesos.map((acceso) => (
        <View key={acceso.titulo} style={estilos.fila}>
          <TouchableRipple
            onPress={() => router.push(acceso.destino)}
            accessibilityRole="button"
            accessibilityLabel={`${acceso.titulo}. ${acceso.descripcion}`}
          >
            <View style={estilos.contenido}>
              <View style={estilos.cuadroIcono}>
                <Icon source={acceso.icono} size={24} color={colores.primario} />
              </View>
              <View style={estilos.textos}>
                <Text variant="titleSmall" style={estilos.nombre}>
                  {acceso.titulo}
                </Text>
                <Text variant="bodySmall" style={estilos.descripcion}>
                  {acceso.descripcion}
                </Text>
              </View>
              <Icon source="chevron-right" size={24} color={colores.textoSecundario} />
            </View>
          </TouchableRipple>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  menu: { gap: espacio.s },
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  fila: { borderRadius: radio.tarjeta, backgroundColor: colores.superficie, overflow: 'hidden' },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espacio.m, padding: espacio.m },
  cuadroIcono: {
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  textos: { flex: 1, gap: espacio.xs },
  nombre: { color: colores.texto, fontFamily: fuentes.seminegrita },
  descripcion: { color: colores.textoSecundario },
});
