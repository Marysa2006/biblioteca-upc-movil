/**
 * Accesos a la administración del portal (HU-04, HU-28, HU-13, HU-09, HU-16 y HU-29), en la
 * sección "Portal" de Gestión. Cada fila se muestra solo con su permiso; toda la fila se puede
 * presionar.
 *
 * Revisión de la 1.1: en tres grupos, de lo que más se usa a lo que menos. Publicaciones (lo que
 * ve la comunidad), Servicios (lo que se puede solicitar: temas, líneas y espacios) y
 * Configuración. Un grupo sin filas visibles para la persona no se muestra.
 */
import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { useRol } from '@/hooks/useRol';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Permiso } from '@/types';

type Grupo = 'publicaciones' | 'servicios' | 'configuracion';

const GRUPOS: { valor: Grupo; titulo: string }[] = [
  { valor: 'publicaciones', titulo: 'Publicaciones' },
  { valor: 'servicios', titulo: 'Servicios' },
  { valor: 'configuracion', titulo: 'Configuración' },
];

type Acceso = {
  grupo: Grupo;
  titulo: string;
  descripcion: string;
  icono: string;
  destino: Href;
  permiso: Permiso;
  /** También se muestra con este otro permiso (#258). */
  tambienCon?: Permiso;
  /** No se muestra si además tiene este permiso: otra fila ya cubre lo mismo (#257). */
  ocultarCon?: Permiso;
};

const ACCESOS: Acceso[] = [
  {
    grupo: 'publicaciones',
    titulo: 'Contenidos del portal',
    descripcion: 'Servicios, avisos y novedades que ve la comunidad.',
    icono: 'file-document-edit-outline',
    destino: '/administracion/contenidos',
    permiso: 'contenidos',
  },
  {
    // Versión 1.1 (#257): quien solo tiene `novedades` publica avisos e informativos, no servicios.
    grupo: 'publicaciones',
    titulo: 'Avisos y novedades',
    descripcion: 'Los avisos y los informativos que ve la comunidad en Inicio.',
    icono: 'bullhorn-outline',
    destino: '/administracion/contenidos',
    permiso: 'novedades',
    ocultarCon: 'contenidos',
  },
  {
    // Versión 1.1 (#290): las fotos del carrusel de Inicio, con su propio permiso (#296).
    grupo: 'publicaciones',
    titulo: 'Fotos de Inicio',
    descripcion: 'Las fotos del carrusel que ve la comunidad al abrir la app.',
    icono: 'image-multiple-outline',
    destino: '/administracion/fotos-inicio',
    permiso: 'fotos',
  },
  {
    // Versión 1.1 (#258 y #303): las guías las publica la biblioteca, con `contenidos` o `novedades`.
    grupo: 'publicaciones',
    titulo: 'Guías de la biblioteca',
    descripcion: 'Las guías en PDF, con enlace o escritas que ve la comunidad en Catálogo.',
    icono: 'book-open-page-variant-outline',
    destino: '/administracion/guias',
    permiso: 'contenidos',
    tambienCon: 'novedades',
  },
  {
    // Versión 1.1 (#250): sin jornadas; la persona pide fecha y hora y el personal confirma.
    grupo: 'servicios',
    titulo: 'Temas de asesoría',
    descripcion: 'Los temas en los que la comunidad puede pedir una asesoría.',
    icono: 'calendar-clock-outline',
    destino: '/administracion/asesorias',
    permiso: 'asesorias',
  },
  {
    grupo: 'servicios',
    titulo: 'Líneas de formación',
    descripcion: 'Las capacitaciones que la comunidad puede solicitar.',
    icono: 'school-outline',
    destino: '/administracion/lineas',
    permiso: 'formacion',
  },
  {
    // Revisión de la 1.1: antes era una sección de Gestión.
    grupo: 'servicios',
    titulo: 'Espacios',
    descripcion: 'Los espacios que se pueden reservar, y sus bloqueos.',
    icono: 'office-building-outline',
    destino: '/administracion/espacios',
    permiso: 'espacios',
  },
  {
    grupo: 'configuracion',
    titulo: 'Parámetros generales',
    descripcion: 'Periodos, festivos, horarios, tiempos mínimos y textos automáticos.',
    icono: 'tune-variant',
    destino: '/administracion/parametros',
    permiso: 'parametros',
  },
];

/** ¿Quien tiene la sesión puede entrar a alguna función del portal? */
export function usePuedeAdministrarPortal(): boolean {
  const { tienePermiso } = useRol();
  return ACCESOS.some(
    (acceso) =>
      tienePermiso(acceso.permiso) ||
      (acceso.tambienCon != null && tienePermiso(acceso.tambienCon)),
  );
}

export function MenuAdministracion() {
  const { tienePermiso } = useRol();
  const accesos = ACCESOS.filter(
    (acceso) =>
      (tienePermiso(acceso.permiso) ||
        (acceso.tambienCon != null && tienePermiso(acceso.tambienCon))) &&
      !(acceso.ocultarCon && tienePermiso(acceso.ocultarCon)),
  );

  return (
    <View style={estilos.menu}>
      {GRUPOS.map((grupo) => {
        const delGrupo = accesos.filter((acceso) => acceso.grupo === grupo.valor);
        if (delGrupo.length === 0) return null;
        return (
          <View key={grupo.valor} style={estilos.grupo}>
            <Text variant="labelLarge" style={estilos.tituloGrupo} accessibilityRole="header">
              {grupo.titulo}
            </Text>
            {delGrupo.map((acceso) => (
              <FilaAcceso key={acceso.titulo} acceso={acceso} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

function FilaAcceso({ acceso }: { acceso: Acceso }) {
  return (
    <View style={estilos.fila}>
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
  );
}

const estilos = StyleSheet.create({
  menu: { gap: espacio.l },
  grupo: { gap: espacio.s },
  // Subtítulo corto del grupo, en mayúsculas pequeñas, como los títulos de los PDF.
  tituloGrupo: {
    color: colores.primario,
    fontFamily: fuentes.seminegrita,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
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
