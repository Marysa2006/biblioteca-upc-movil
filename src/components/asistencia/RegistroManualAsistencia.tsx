import { useState } from 'react';
import { View } from 'react-native';
import { Button, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import type { PersonaEncontrada } from '@/api/backend/usuarios';
import { SelectorPersona } from '@/components/personal/SelectorPersona';
import { AvisoError } from '@/components/ui';
import { useMarcarAsistenciaManual } from '@/hooks/useAsistencia';
import { useBuscarPersonas } from '@/hooks/useBuscarPersonas';
import { espacio } from '@/theme';
import { mensajeErrorGuardar } from '@/utils/errores';

export function RegistroManualAsistencia({ sesionId, antesDeIniciar = false }: {
  sesionId: string;
  antesDeIniciar?: boolean;
}) {
  const marcar = useMarcarAsistenciaManual();
  const [eligeCuenta, setConCuenta] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [persona, setPersona] = useState<PersonaEncontrada | null>(null);
  const consulta = useBuscarPersonas('asistencia', busqueda, eligeCuenta && !persona);
  const puedeElegirCuenta = !consulta.sinPermiso;
  const conCuenta = puedeElegirCuenta && eligeCuenta;
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'' | 'STUDENT' | 'TEACHER' | 'ADMINISTRATIVE'>('');
  const [programa, setPrograma] = useState('');
  const [semestre, setSemestre] = useState('');

  const guardar = () => {
    if (conCuenta && !persona) return;
    const datos = conCuenta && persona
      ? { usuarioId: persona.id }
      : { nombre, tipo: tipo || undefined, programa, semestre };
    marcar.mutate(
      { sesionId, ...datos },
      { onSuccess: () => {
        setPersona(null);
        setBusqueda('');
        setNombre('');
        setTipo('');
        setPrograma('');
        setSemestre('');
      } },
    );
  };

  return (
    <View style={{ gap: espacio.s }}>
      <Text variant="titleMedium">Registrar a mano</Text>
      {puedeElegirCuenta ? (
        <SegmentedButtons
          value={conCuenta ? 'cuenta' : 'sin-cuenta'}
          onValueChange={(valor) => setConCuenta(valor === 'cuenta')}
          buttons={[
            { value: 'sin-cuenta', label: 'Sin cuenta' },
            { value: 'cuenta', label: 'Con cuenta' },
          ]}
        />
      ) : null}
      {conCuenta ? (
        <SelectorPersona
          seleccion={persona}
          consulta={consulta}
          texto={busqueda}
          onTexto={setBusqueda}
          onElegir={setPersona}
          deshabilitado={marcar.isPending}
        />
      ) : (
        <>
          <TextInput
            label="Nombre completo"
            value={nombre}
            onChangeText={setNombre}
            maxLength={201}
          />
          <SegmentedButtons
            value={tipo}
            onValueChange={(valor) => setTipo(valor === tipo ? '' : (valor as typeof tipo))}
            buttons={[
              { value: 'STUDENT', label: 'Estudiante' },
              { value: 'TEACHER', label: 'Docente' },
              { value: 'ADMINISTRATIVE', label: 'Administrativo' },
            ]}
          />
          <TextInput
            label="Programa (opcional)"
            value={programa}
            onChangeText={setPrograma}
            maxLength={150}
          />
          <TextInput
            label="Semestre (opcional)"
            value={semestre}
            onChangeText={setSemestre}
            maxLength={10}
          />
        </>
      )}
      <Button
        mode="contained"
        loading={marcar.isPending}
        disabled={
          marcar.isPending ||
          antesDeIniciar ||
          (conCuenta ? !persona : !nombre.trim())
        }
        onPress={guardar}
      >
        Registrar asistencia
      </Button>
      {marcar.error ? <AvisoError mensaje={mensajeErrorGuardar(marcar.error)} /> : null}
      {marcar.isSuccess ? (
        <Text accessibilityLiveRegion="polite">Asistencia registrada.</Text>
      ) : null}
    </View>
  );
}
