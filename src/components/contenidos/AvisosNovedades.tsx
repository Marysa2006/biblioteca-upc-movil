/**
 * "Avisos y novedades" de Inicio (HU-04): lo que publica la administración, en su orden.
 * Recibe solo los contenidos visibles (ver contenidosVisibles en src/utils/contenidos.ts):
 * si la administración oculta uno, deja de llegar aquí (CA2); si cambia el orden, cambia aquí (CA4).
 * El tipo va escrito; el fondo (verde claro para los avisos) solo lo refuerza.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { Contenido } from '@/types';
import { fechaLegible, TIPOS_CONTENIDO } from '@/utils/contenidos';

export function AvisosNovedades({ contenidos }: { contenidos: Contenido[] }) {
  return (
    <View style={estilos.seccion}>
      <View style={estilos.encabezado}>
        <Icon source="bullhorn-outline" size={24} color={colores.primario} />
        <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
          Avisos y novedades
        </Text>
      </View>
      {contenidos.map((contenido) => {
        const esAviso = contenido.tipo === 'aviso';
        return (
          <View
            key={contenido.id}
            style={[estilos.tarjeta, esAviso ? estilos.tarjetaAviso : estilos.tarjetaInformativo]}
          >
            <View style={estilos.filaTipo}>
              <Icon
                source={TIPOS_CONTENIDO[contenido.tipo].icono}
                size={16}
                color={colores.primarioOscuro}
              />
              <Text variant="labelMedium" style={estilos.tipo}>
                {TIPOS_CONTENIDO[contenido.tipo].nombre}
              </Text>
            </View>
            <Text variant="titleSmall" style={estilos.tituloTarjeta}>
              {contenido.titulo}
            </Text>
            <Text variant="bodyMedium" style={estilos.descripcion}>
              {contenido.descripcion}
            </Text>
            {esAviso && contenido.fechaFin ? (
              <Text variant="bodySmall" style={estilos.vigencia}>
                {`Hasta el ${fechaLegible(contenido.fechaFin)}`}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: { gap: espacio.s },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  titulo: { flex: 1, color: colores.texto, fontFamily: fuentes.negrita },
  filaTipo: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
  tarjeta: { gap: espacio.xs, padding: espacio.m, borderRadius: radio.tarjeta },
  tarjetaAviso: { backgroundColor: colores.primarioSuave },
  tarjetaInformativo: { backgroundColor: colores.superficie },
  tipo: { color: colores.primarioOscuro },
  tituloTarjeta: { color: colores.texto, fontFamily: fuentes.seminegrita },
  descripcion: { color: colores.texto },
  vigencia: { color: colores.textoSecundario },
});
