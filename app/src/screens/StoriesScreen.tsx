import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStories } from '../hooks/useStories';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import UnlockModal from '../components/UnlockModal';
import { useStoryProgress } from '../progress/StoryProgressProvider';
import CoinCountChip from '../components/CoinCountChip';

type Props = NativeStackScreenProps<RootStackParamList, 'Stories'>;

export default function StoriesScreen({ navigation }: Props) {
  const { items, loading, error } = useStories();
  const [lockedInfo, setLockedInfo] = useState<{ title: string; cost: number } | null>(null);
  const { completedCountFor, storyCompleted: isStoryCompleted } = useStoryProgress();

  const { totalMissions, completedMissions, progressPct } = useMemo(() => {
    const totals = items.reduce(
      (acc, story) => {
        const missions = story.missionsCount || 0;
        const completed = Math.min(completedCountFor(story.storyId), missions);
        acc.total += missions;
        acc.completed += completed;
        return acc;
      },
      { total: 0, completed: 0 }
    );
    const pct = totals.total > 0 ? Math.round((totals.completed / totals.total) * 100) : 0;
    return { totalMissions: totals.total, completedMissions: totals.completed, progressPct: pct };
  }, [items, completedCountFor]);

  const handlePress = (storyId: string, locked: boolean, title: string, cost: number) => {
    if (locked) {
      setLockedInfo({ title, cost });
      return;
    }
    navigation.navigate('StoryMissions', { storyId });
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: '#0b1224' }}
    >
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b1224' }}>
          <ActivityIndicator size="large" color="#22d3ee" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#0b1224' }}>
          <View style={{ padding: 16, borderRadius: 16, backgroundColor: '#3f1d2e', borderWidth: 1, borderColor: '#7f1d1d' }}>
            <Text style={{ color: '#fecdd3', fontWeight: '700', marginBottom: 4 }}>Error</Text>
            <Text style={{ color: '#fecdd3' }}>{error}</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.storyId}
          contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
          ListHeaderComponent={
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                  height: 48,
                  position: 'relative',
                }}
              >
                <Pressable
                  onPress={() => navigation.goBack()}
                  style={({ pressed }) => ({
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: '#0f172a',
                    borderWidth: 1,
                    borderColor: '#1f2937',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.9 : 1,
                    shadowColor: '#000',
                    shadowOpacity: 0.12,
                    shadowRadius: 8,
                    position: 'absolute',
                    left: 0,
                  })}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderLeftWidth: 2,
                      borderBottomWidth: 2,
                      borderColor: '#e2e8f0',
                      transform: [{ rotate: '45deg' }],
                    }}
                  />
                </Pressable>
                  <Image
                    source={require('../image/logo.png')}
                    style={{ width: 180, height: 42, resizeMode: 'contain' }}
                  />
                  <CoinCountChip style={{ position: 'absolute', right: 0 }} />
                </View>

              <View
                style={{
                  borderRadius: 24,
                  overflow: 'hidden',
                  padding: 20,
                  backgroundColor: '#0f172a',
                  borderWidth: 1,
                  borderColor: '#1f2937',
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: 14,
                  marginBottom: 16,
                }}
              >
                <View style={{ position: 'absolute', width: 200, height: 200, backgroundColor: '#0ea5e933', borderRadius: 200, top: -60, right: -60 }} />
                <View style={{ position: 'absolute', width: 160, height: 160, backgroundColor: '#22c55e22', borderRadius: 200, bottom: -50, left: -40 }} />
                <Text style={{ color: '#a5f3fc', fontSize: 12, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>Misiones narrativas</Text>
                <Text style={{ color: '#e2e8f0', fontSize: 24, fontWeight: '800', marginTop: 6 }}>
                  Sumérgete en las historias
                </Text>
                <Text style={{ color: '#94a3b8', marginTop: 8, lineHeight: 20 }}>
                  Completa escenas para desbloquear misiones y empujar tu avance combinado.
                </Text>

                <View style={{ marginTop: 16, backgroundColor: '#0b172b', borderColor: '#1f2937', borderWidth: 1, padding: 16, borderRadius: 16 }}>
                  <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: '700' }}>Progreso de misiones</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 6 }}>
                    <Text style={{ color: '#e2e8f0', fontSize: 34, fontWeight: '900' }}>
                      {totalMissions ? `${progressPct}%` : '--'}
                    </Text>
                    <Text style={{ color: '#94a3b8', marginLeft: 8, marginBottom: 6, fontWeight: '600' }}>completadas</Text>
                  </View>
                  <View style={{ marginTop: 10, height: 12, borderRadius: 999, backgroundColor: '#1f2937', overflow: 'hidden' }}>
                    <View style={{ width: totalMissions ? `${progressPct}%` : '0%', backgroundColor: '#22d3ee', height: '100%' }} />
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 12 }}>
                    <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', flex: 1, marginRight: 8 }}>
                      <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '700' }}>Misiones totales</Text>
                      <Text style={{ color: '#e2e8f0', marginTop: 4, fontWeight: '800' }}>{totalMissions}</Text>
                      <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>Historias disponibles</Text>
                    </View>
                    <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', flex: 1, marginLeft: 8 }}>
                      <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '700' }}>Completadas</Text>
                      <Text style={{ color: '#e2e8f0', marginTop: 4, fontWeight: '800' }}>{completedMissions}</Text>
                      <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>Misiones terminadas</Text>
                    </View>
                  </View>
                  <Text style={{ color: '#94a3b8', marginTop: 10, fontSize: 12, lineHeight: 18 }}>
                    Prioriza historias con más misiones para subir el porcentaje y desbloquear nuevas rutas.
                  </Text>
                </View>
              </View>

              <Text style={{ color: '#e2e8f0', fontWeight: '800', fontSize: 16, marginBottom: 8 }}>
                Historias ({items.length})
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const completed = Math.min(completedCountFor(item.storyId), item.missionsCount);
            const total = item.missionsCount;
            const storyDone = isStoryCompleted(item.storyId);
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <Pressable
                onPress={() => handlePress(item.storyId, item.locked, item.title, item.unlockCost)}
                style={({ pressed }) => ({
                  marginBottom: 12,
                  borderRadius: 16,
                  backgroundColor: '#0f172a',
                  borderWidth: 1,
                  borderColor: '#1f2937',
                  padding: 16,
                  shadowColor: '#000',
                  shadowOpacity: 0.12,
                  shadowRadius: 10,
                  opacity: pressed ? 0.96 : 1,
                })}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#e2e8f0', flex: 1 }}>
                    {item.title}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: storyDone ? '#22c55e' : item.locked ? '#f59e0b' : '#22d3ee',
                      backgroundColor: storyDone ? 'rgba(34, 197, 94, 0.14)' : item.locked ? 'rgba(245, 158, 11, 0.18)' : 'rgba(34, 211, 238, 0.14)',
                      marginLeft: 10,
                    }}
                  >
                    <Text style={{ color: '#e2e8f0', fontWeight: '700', fontSize: 12 }}>
                      {item.locked
                        ? `Bloqueada · ${item.unlockCost}`
                        : storyDone
                        ? 'Completada'
                        : 'Disponible'}
                    </Text>
                  </View>
                </View>
                <Text style={{ marginTop: 6, color: '#94a3b8' }}>{item.summary}</Text>

                <View style={{ marginTop: 12, height: 10, borderRadius: 999, backgroundColor: '#1f2937', overflow: 'hidden' }}>
                  <View style={{ width: `${progress}%`, backgroundColor: '#22d3ee', height: '100%' }} />
                </View>
                <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 6 }}>
                  {completed}/{total} misiones completas ({progress}%)
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#22d3ee', backgroundColor: '#0b172b', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginRight: 8, marginBottom: 8 }}>
                    {item.missionsCount} {item.missionsCount === 1 ? 'misión' : 'misiones'}
                  </Text>
                  {item.level ? (
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#a5f3fc', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginRight: 8, marginBottom: 8 }}>
                      Nivel {item.level}
                    </Text>
                  ) : null}
                  {item.tags.slice(0, 2).map((tag) => (
                    <Text
                      key={tag}
                      style={{ fontSize: 12, color: '#cbd5e1', backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginRight: 8, marginBottom: 8 }}
                    >
                      {tag}
                    </Text>
                  ))}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={{ paddingTop: 48, alignItems: 'center' }}>
              <Text style={{ color: '#94a3b8' }}>Aún no hay historias disponibles.</Text>
            </View>
          }
        />
      )}

      <UnlockModal
        visible={!!lockedInfo}
        onClose={() => setLockedInfo(null)}
        title={lockedInfo?.title || ''}
        cost={lockedInfo?.cost || 0}
      />
    </SafeAreaView>
  );
}
