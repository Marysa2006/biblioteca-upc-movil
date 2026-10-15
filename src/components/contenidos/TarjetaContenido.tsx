/**
 * Aviso o informativo en la administración (HU-04): tipo, estado, vigencia y acciones.
 * Publicado u Oculto va con texto e ícono (CA2); subir y bajar cambian el orden (CA4).
 */
import { StyleSheet, View } from 'react-native';
import { Button, Icon, IconButton, Text } from 'react-native-paper';

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
  const { publicado } = contenido;
  const tipo = TIPOS_CONTENIDO[contenido.tipo];
  const vigencia = textoVigencia(contenido);

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <View style={estilos.tipo}>
          <Icon source={tipo.icono} size={16} color={colores.primario} />
          <Text variant="labelMedium" style={estilos.textoTipo}>
            {tipo.nombre}
          </Text>
        </View>
        <View style={[estilos.estado, publicado ? estilos.estadoPublicado : estilos.estadoOculto]}>
          <Icon
            source={publicado ? 'eye-outline' : 'eye-off-outline'}
            size={16}
            color={publicado ? colores.primarioOscuro : coloresEstado.cancelada.texto}
          />
          <Text
            variant="labelMedium"
            style={publicado ? estilos.textoPublicado : estilos.textoOculto}
          >
            {publicado ? 'Publicado' : 'Oculto'}
          </Text>
        </View>
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.textos}>
          <Text variant="titleMedium" style={estilos.titulo}>
            {contenido.titulo}
          </Text>
          <Text variant="bodyMedium" style={estilos.secundario} numberOfLines={2}>
            {contenido.descripcion}
          </Text>
          {vigencia ? (
            <View style={estilos.vigencia}>
              <Icon source="calendar-range" size={16} color={colores.textoSecundario} />
              <Text variant="bodySmall" style={estilos.secundario}>
                {vigencia}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={estilos.orden}>
          <IconButton
            icon="arrow-up"
            onPress={onSubir}
            disabled={esPrimero || ocupado}
            accessibilityLabel={`Subir ${contenido.titulo}`}
          />
          <IconButton
            icon="arrow-down"
            onPress={onBajar}
            disabled={esUltimo || ocupado}
            accessibilityLabel={`Bajar ${contenido.titulo}`}
          />
        </View>
      </View>

      <View style={estilos.acciones}>
        <Button
          mode="contained-tonal"
          icon="pencil-outline"
          onPress={onEditar}
          disabled={ocupado}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Editar ${contenido.titulo}`}
        >
          Editar
        </Button>
        <Button
          mode="outlined"
          icon={publicado ? 'eye-off-outline' : 'eye-outline'}
          onPress={onCambiarPublicacion}
          disabled={ocupado}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`${publicado ? 'Ocultar' : 'Publicar'} ${contenido.titulo}`}
        >
          {publicado ? 'Ocultar' : 'Publicar'}
        </Button>
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
  cuerpo: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.s },
  textos: { flex: 1, gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  secundario: { color: colores.textoSecundario },
  vigencia: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
  orden: { alignItems: 'center' },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
