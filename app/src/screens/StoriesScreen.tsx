import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useStories } from '../hooks/useStories';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import UnlockModal from '../components/UnlockModal';

type Props = NativeStackScreenProps<RootStackParamList, 'Stories'>;

export default function StoriesScreen({ navigation }: Props) {
  const { items, loading, error } = useStories();
  const [lockedInfo, setLockedInfo] = useState<{ title: string; cost: number } | null>(null);

  const handlePress = (storyId: string, locked: boolean, title: string, cost: number) => {
    if (locked) {
      setLockedInfo({ title, cost });
      return;
    }
    navigation.navigate('StoryScene', { storyId, sceneIndex: 0 });
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#f8fafc' }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>Historias</Text>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : error ? (
        <View style={{ padding: 16, borderRadius: 12, backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fecaca' }}>
          <Text style={{ color: '#b91c1c' }}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.storyId}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handlePress(item.storyId, item.locked, item.title, item.unlockCost)}
              style={({ pressed }) => ({
                marginBottom: 12,
                borderRadius: 16,
                backgroundColor: 'white',
                borderWidth: 1,
                borderColor: pressed ? '#cbd5f5' : '#e2e8f0',
                padding: 16,
                shadowColor: '#000',
                shadowOpacity: pressed ? 0.08 : 0.04,
                shadowRadius: 6,
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b' }}>{item.title}</Text>
              <Text style={{ marginTop: 6, color: '#475569' }}>{item.summary}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6366f1', backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginRight: 8, marginBottom: 8 }}>
                  {item.missionsCount} {item.missionsCount === 1 ? 'misión' : 'misiones'}
                </Text>
                {item.level ? (
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#0ea5e9', backgroundColor: '#e0f2fe', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginRight: 8, marginBottom: 8 }}>
                    Nivel {item.level}
                  </Text>
                ) : null}
                {item.tags.slice(0, 2).map((tag) => (
                  <Text
                    key={tag}
                    style={{ fontSize: 12, color: '#475569', backgroundColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginRight: 8, marginBottom: 8 }}
                  >
                    {tag}
                  </Text>
                ))}
              </View>
              <Text style={{ marginTop: 12, fontSize: 12, fontWeight: '600', color: item.locked ? '#b91c1c' : '#16a34a' }}>
                {item.locked ? `Bloqueada · ${item.unlockCost} puntos` : 'Disponible'}
              </Text>
            </Pressable>
          )}
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
    </View>
  );
}

