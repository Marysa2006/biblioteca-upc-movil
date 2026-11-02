/**
 * Accesos a la administración del portal (HU-04, HU-28 y HU-13), en la sección "Portal" de Gestión.
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
    titulo: 'Parámetros generales',
    descripcion: 'Periodos, festivos, horarios, tiempos mínimos y textos automáticos.',
    icono: 'tune-variant',
    destino: '/administracion/parametros',
    permiso: 'parametros',
  },
  {
    titulo: 'Asesorías y jornadas',
    descripcion: 'Temas de asesoría, jornadas de cada facilitador y sus franjas.',
    icono: 'calendar-clock-outline',
    destino: '/administracion/asesorias',
    permiso: 'asesorias',
  },
];

/** ¿Quien tiene la sesión puede entrar a alguna función del portal? */
export function usePuedeAdministrarPortal(): boolean {
  const { tienePermiso } = useRol();
  return ACCESOS.some((acceso) => tienePermiso(acceso.permiso));
}

export function MenuAdministracion() {
  const { tienePermiso } = useRol();
  const accesos = ACCESOS.filter((acceso) => tienePermiso(acceso.permiso));

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
