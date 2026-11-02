/**
 * Aviso o informativo en la administración (HU-04): tipo (con su ícono), estado, vigencia y acciones.
 * Publicado u Oculto va con texto, no solo color (CA2). Editar, Publicar u Ocultar, y Mover
 * arriba o abajo (CA4) van en el menú de tres puntos; la flecha que no aplica no aparece.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { MenuAcciones, type AccionMenu } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { Contenido } from '@/types';
import { fechaLegible, TIPOS_CONTENIDO } from '@/utils/contenidos';

type Props = {
  contenido: Contenido;
  esPrimero: boolean;
  esUltimo: boolean;
  /** true mientras se guarda un cambio de este contenido o del orden. */
  ocupado: boolean;
  onEditar: () => void;
  onCambiarPublicacion: () => void;
  onSubir: () => void;
  onBajar: () => void;
};

function textoVigencia({ fechaInicio, fechaFin }: Contenido): string | null {
  if (fechaInicio && fechaFin) return `Del ${fechaLegible(fechaInicio)} al ${fechaLegible(fechaFin)}`;
  if (fechaInicio) return `Desde el ${fechaLegible(fechaInicio)}`;
  if (fechaFin) return `Hasta el ${fechaLegible(fechaFin)}`;
  return null;
}

export function TarjetaContenido({
  contenido,
  esPrimero,
  esUltimo,
  ocupado,
  onEditar,
  onCambiarPublicacion,
  onSubir,
  onBajar,
}: Props) {
  const { publicado, titulo } = contenido;
  const tipo = TIPOS_CONTENIDO[contenido.tipo];
  const vigencia = textoVigencia(contenido);

  const acciones: AccionMenu[] = [
    { titulo: 'Editar', icono: 'pencil-outline', onPress: onEditar, etiqueta: `Editar ${titulo}` },
    {
      titulo: publicado ? 'Ocultar' : 'Publicar',
      icono: publicado ? 'eye-off-outline' : 'eye-outline',
      onPress: onCambiarPublicacion,
      etiqueta: `${publicado ? 'Ocultar' : 'Publicar'} ${titulo}`,
    },
  ];
  if (!esPrimero) {
    acciones.push({
      titulo: 'Mover arriba',
      icono: 'arrow-up',
      onPress: onSubir,
      etiqueta: `Mover ${titulo} un puesto arriba`,
    });
  }
  if (!esUltimo) {
    acciones.push({
      titulo: 'Mover abajo',
      icono: 'arrow-down',
      onPress: onBajar,
      etiqueta: `Mover ${titulo} un puesto abajo`,
    });
  }

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <View style={estilos.tipo}>
          <Icon source={tipo.icono} size={16} color={colores.primario} />
          <Text variant="labelMedium" style={estilos.textoTipo}>
            {tipo.nombre}
          </Text>
        </View>
        <View style={estilos.derecha}>
          <View
            style={[estilos.estado, publicado ? estilos.estadoPublicado : estilos.estadoOculto]}
          >
            <Text
              variant="labelMedium"
              style={publicado ? estilos.textoPublicado : estilos.textoOculto}
            >
              {publicado ? 'Publicado' : 'Oculto'}
            </Text>
          </View>
          <MenuAcciones
            acciones={acciones}
            descripcion={`Acciones de ${titulo}`}
            ocupado={ocupado}
          />
        </View>
      </View>

      <View style={estilos.textos}>
        <Text variant="titleMedium" style={estilos.titulo}>
          {titulo}
        </Text>
        <Text variant="bodyMedium" style={estilos.secundario} numberOfLines={2}>
          {contenido.descripcion}
        </Text>
        {vigencia ? (
          <Text variant="bodySmall" style={estilos.secundario}>
            {vigencia}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  encabezado: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.s,
  },
  derecha: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  tipo: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
  textoTipo: { color: colores.primario },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs,
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs,
    borderRadius: radio.boton,
  },
  estadoPublicado: { backgroundColor: colores.primarioSuave },
  estadoOculto: { backgroundColor: coloresEstado.cancelada.fondo },
  textoPublicado: { color: colores.primarioOscuro },
  textoOculto: { color: coloresEstado.cancelada.texto },
  textos: { gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  secundario: { color: colores.textoSecundario },
});
