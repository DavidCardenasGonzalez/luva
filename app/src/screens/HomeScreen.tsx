import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useProgress } from '../hooks/useProgress';
import { useAuth } from '../auth/AuthProvider';
import { useLearningItems } from '../hooks/useLearningItems';
import {
  CARD_STATUS_LABELS,
  CardProgressStatus,
  useCardProgress,
} from '../progress/CardProgressProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const STATUS_ORDER: CardProgressStatus[] = ['learned', 'learning', 'todo'];
const STATUS_COLORS: Record<CardProgressStatus, string> = {
  learned: '#22c55e',
  learning: '#0ea5e9',
  todo: '#f59e0b',
};

export default function HomeScreen({ navigation }: Props) {
  const { data, loading, error, reload } = useProgress();
  const { isSignedIn, signIn, signOut } = useAuth();
  const { items } = useLearningItems();
  const { statusFor, statuses } = useCardProgress();

  const { totalCards, counts, percentages } = useMemo(() => {
    const totals: Record<CardProgressStatus, number> = { todo: 0, learning: 0, learned: 0 };
    for (const item of items) {
      totals[statusFor(item.id)] += 1;
    }
    const total = items.length || 1;
    const pct: Record<CardProgressStatus, number> = {
      todo: Math.round((totals.todo / total) * 100),
      learning: Math.round((totals.learning / total) * 100),
      learned: Math.round((totals.learned / total) * 100),
    };
    return { totalCards: items.length, counts: totals, percentages: pct };
  }, [items, statuses, statusFor]);

  const points = data?.points ?? 0;
  const streak = data?.streak ?? 0;
  const nextPointsGoal = Math.max(120, Math.ceil((points + 1) / 250) * 250);
  const pointsProgress = Math.min(points / nextPointsGoal, 1);
  const streakGoal = Math.max(5, Math.ceil(Math.max(streak, 1) / 5) * 5);
  const streakProgress = Math.min(streak / streakGoal, 1);
  const streakDots = Array.from({ length: Math.min(streakGoal, 8) }, (_, idx) => idx + 1 <= streak);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0b1224' }}
      contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
    >
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 260, backgroundColor: '#0b1224' }} />

      <View style={{ borderRadius: 24, overflow: 'hidden', padding: 20, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1f2937', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 14 }}>
        <View style={{ position: 'absolute', width: 200, height: 200, backgroundColor: '#0ea5e933', borderRadius: 200, top: -60, right: -60 }} />
        <View style={{ position: 'absolute', width: 160, height: 160, backgroundColor: '#22c55e22', borderRadius: 200, bottom: -50, left: -40 }} />
        <Text style={{ color: '#a5f3fc', fontSize: 12, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>Panel de avance</Text>
        <Text style={{ color: '#e2e8f0', fontSize: 26, fontWeight: '800', marginTop: 6 }}>Sigue impulsando tu racha</Text>
        <Text style={{ color: '#94a3b8', marginTop: 8, lineHeight: 20 }}>
          Visualiza tu progreso y vuelve al contenido que más te suma puntos.
        </Text>

        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <View style={{ flex: 1, backgroundColor: '#0b172b', borderColor: '#1f2937', borderWidth: 1, padding: 14, borderRadius: 16, marginRight: 10 }}>
            <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: '600' }}>Puntos</Text>
            <Text style={{ color: '#22d3ee', fontSize: 28, fontWeight: '800', marginTop: 4 }}>{points}</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>Objetivo próximo: {nextPointsGoal}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#0b172b', borderColor: '#1f2937', borderWidth: 1, padding: 14, borderRadius: 16 }}>
            <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: '600' }}>Racha</Text>
            <Text style={{ color: '#fbbf24', fontSize: 28, fontWeight: '800', marginTop: 4 }}>{streak}d</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>Hito: {streakGoal} días</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 18 }}>
          <Pressable
            onPress={() => navigation.navigate('Deck')}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: pressed ? '#1d4ed8' : '#2563eb',
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: 'center',
              shadowColor: '#2563eb',
              shadowOpacity: 0.3,
              shadowRadius: 10,
              marginRight: 10,
            })}
          >
            <Text style={{ color: 'white', fontWeight: '800', letterSpacing: 0.3 }}>Tarjetas</Text>
            <Text style={{ color: '#e0f2fe', fontSize: 12, marginTop: 2 }}>Reanudar práctica</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Stories')}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: pressed ? '#0f766e' : '#0d9488',
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: 'center',
            })}
          >
            <Text style={{ color: 'white', fontWeight: '800', letterSpacing: 0.3 }}>Historias</Text>
            <Text style={{ color: '#ccfbf1', fontSize: 12, marginTop: 2 }}>Misión narrativa</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ marginTop: 20, backgroundColor: '#f8fafc', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }}>
        <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '800' }}>Progreso de tarjetas</Text>
        <Text style={{ color: '#475569', marginTop: 4 }}>Has tocado {totalCards} tarjetas. Sigue equilibrando para llegar a la meta.</Text>

        <View style={{ marginTop: 12, height: 14, borderRadius: 999, overflow: 'hidden', flexDirection: 'row', backgroundColor: '#e2e8f0' }}>
          {STATUS_ORDER.map((status) => (
            <View
              key={status}
              style={{
                flexGrow: percentages[status],
                flexBasis: `${percentages[status]}%`,
                backgroundColor: STATUS_COLORS[status],
              }}
            />
          ))}
        </View>

        <View style={{ marginTop: 12 }}>
          {STATUS_ORDER.map((status) => (
            <View
              key={status}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: STATUS_COLORS[status],
                  marginRight: 8,
                }}
              />
              <Text style={{ flex: 1, color: '#0f172a', fontWeight: '600' }}>{CARD_STATUS_LABELS[status]}</Text>
              <Text style={{ color: '#475569', fontSize: 12 }}>
                {percentages[status]}% · {counts[status]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 14, flexDirection: 'row' }}>
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, marginRight: 10 }}>
          <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15 }}>Racha</Text>
          <Text style={{ color: '#475569', marginTop: 6 }}>Mantente activo hasta el siguiente hito.</Text>
          <View style={{ marginTop: 12, height: 10, borderRadius: 999, backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
            <View style={{ width: `${streakProgress * 100}%`, backgroundColor: '#fbbf24', height: '100%' }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            {streakDots.map((filled, idx) => (
              <View
                key={idx}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  backgroundColor: filled ? '#f59e0b' : '#e2e8f0',
                  opacity: filled ? 1 : 0.6,
                  marginRight: 6,
                }}
              />
            ))}
            <Text style={{ color: '#475569', fontSize: 12, marginLeft: 4 }}>
              Próximo hito: {streakGoal} días
            </Text>
          </View>
        </View>

        <View style={{ flex: 1, backgroundColor: '#0f172a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1f2937', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10 }}>
          <Text style={{ color: '#e2e8f0', fontWeight: '800', fontSize: 15 }}>Puntos</Text>
          <Text style={{ color: '#94a3b8', marginTop: 6 }}>Cada práctica te acerca a la siguiente recompensa.</Text>
          <View style={{ marginTop: 12, height: 10, borderRadius: 999, backgroundColor: '#1f2937', overflow: 'hidden' }}>
            <View style={{ width: `${pointsProgress * 100}%`, backgroundColor: '#22d3ee', height: '100%' }} />
          </View>
          <Text style={{ color: '#a5f3fc', marginTop: 10, fontSize: 12 }}>
            Te faltan {Math.max(nextPointsGoal - points, 0)} puntos para el siguiente hito ({nextPointsGoal})
          </Text>
        </View>
      </View>

      {error ? (
        <Pressable
          onPress={reload}
          style={({ pressed }) => ({
            marginTop: 14,
            backgroundColor: '#fef2f2',
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: pressed ? '#fca5a5' : '#fecdd3',
          })}
        >
          <Text style={{ color: '#b91c1c', fontWeight: '700' }}>No se pudo actualizar el progreso.</Text>
          <Text style={{ color: '#b91c1c', marginTop: 4 }}>Toca para reintentar.</Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={() => { void (isSignedIn ? signOut() : signIn()); }}
        style={({ pressed }) => ({
          marginTop: 18,
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: 'center',
          backgroundColor: pressed ? '#e2e8f0' : '#f1f5f9',
          borderWidth: 1,
          borderColor: '#e2e8f0',
        })}
      >
        <Text style={{ color: '#0f172a', fontWeight: '700' }}>
          {isSignedIn ? 'Cerrar sesión' : 'Iniciar sesión para sincronizar'}
        </Text>
      </Pressable>

      {loading ? (
        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#22d3ee" />
          <Text style={{ color: '#94a3b8', marginLeft: 8 }}>Actualizando progreso...</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
