import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useStoryDetail } from '../hooks/useStories';
import { useStoryProgress } from '../progress/StoryProgressProvider';
import { RouteProp } from '@react-navigation/native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'StoryMissions'>;

export default function StoryMissionsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const storyId = route.params?.storyId;
  const { story, loading, error } = useStoryDetail(storyId);
  const { isMissionCompleted, storyCompleted } = useStoryProgress();

  const { completedCount, totalMissions } = useMemo(() => {
    if (!story) {
      return { completedCount: 0, totalMissions: 0 };
    }
    const total = story.missions.length;
    const completed = story.missions.reduce((acc, mission) => {
      return acc + (isMissionCompleted(story.storyId, mission.missionId) ? 1 : 0);
    }, 0);
    return { completedCount: completed, totalMissions: total };
  }, [isMissionCompleted, story]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error || !story) {
    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: '#f8fafc' }}>
        <View style={{ padding: 16, borderRadius: 12, backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fecaca' }}>
          <Text style={{ color: '#b91c1c', fontWeight: '600' }}>{error || 'No encontramos la historia solicitada.'}</Text>
        </View>
      </View>
    );
  }

  const handleMissionPress = (index: number) => {
    navigation.navigate('StoryScene', { storyId: story.storyId, sceneIndex: index });
  };

  const storyDone = storyCompleted(story.storyId);

  const nextIncompleteIndex = story.missions.findIndex(
    (mission) => !isMissionCompleted(story.storyId, mission.missionId)
  );

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
    >
      <Text style={{ fontSize: 22, fontWeight: '700', color: '#0f172a' }}>{story.title}</Text>
      <Text style={{ marginTop: 6, color: '#475569' }}>{story.summary}</Text>
      <View style={{ marginTop: 12, padding: 16, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0' }}>
        <Text style={{ fontWeight: '700', color: '#1e293b' }}>Progreso</Text>
        <Text style={{ marginTop: 6, color: storyDone ? '#15803d' : '#475569' }}>
          {completedCount} de {totalMissions} misiones completadas
        </Text>
        {storyDone ? (
          <Text style={{ marginTop: 6, color: '#15803d' }}>¡Historia completada!</Text>
        ) : nextIncompleteIndex >= 0 ? (
          <Pressable
            onPress={() => handleMissionPress(nextIncompleteIndex)}
            style={({ pressed }) => ({
              marginTop: 12,
              paddingVertical: 10,
              borderRadius: 999,
              alignItems: 'center',
              backgroundColor: pressed ? '#2563eb' : '#3b82f6',
            })}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>Continuar con la misión {nextIncompleteIndex + 1}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>Misiones</Text>
        {story.missions.map((mission, index) => {
          const missionDone = isMissionCompleted(story.storyId, mission.missionId);
          return (
            <Pressable
              key={mission.missionId}
              onPress={() => handleMissionPress(index)}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b' }}>
                  {index + 1}. {mission.title}
                </Text>
                <Text style={{ color: missionDone ? '#16a34a' : '#64748b', fontWeight: '600' }}>
                  {missionDone ? 'Completada' : 'Pendiente'}
                </Text>
              </View>
              {mission.sceneSummary ? (
                <Text style={{ marginTop: 6, color: '#475569' }}>{mission.sceneSummary}</Text>
              ) : null}
              <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6366f1', backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                  {mission.requirements.length} {mission.requirements.length === 1 ? 'requisito' : 'requisitos'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
