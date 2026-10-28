import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getMicrodramaDetail } from '../microdramas/api';
import { useMicrodramaProgress } from '../microdramas/MicrodramaProgressProvider';
import MicrodramaPlayer from '../microdramas/player/MicrodramaPlayer';
import type { MicrodramaDetail, MicrodramaEpisode } from '../microdramas/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MicrodramaPlayer'>;

export default function MicrodramaPlayerScreen({ navigation, route }: Props) {
  const { seriesId } = route.params;
  const focused = useIsFocused();
  const { loadProgress, saveProgress } = useMicrodramaProgress();
  const [detail, setDetail] = useState<MicrodramaDetail>();
  const [startEpisodeId, setStartEpisodeId] = useState(route.params.episodeId);
  const [startPositionMs, setStartPositionMs] = useState(0);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([getMicrodramaDetail(seriesId), loadProgress(seriesId)]).then(([loaded, progress]) => {
      if (cancelled) return;
      setDetail(loaded);
      const preferred = route.params.episodeId || progress?.resumeEpisodeId;
      const valid = loaded.episodes.some(item => item.episodeId === preferred);
      const selected = valid ? preferred! : loaded.episodes[0]?.episodeId;
      setStartEpisodeId(selected);
      setStartPositionMs(selected === progress?.resumeEpisodeId && !route.params.episodeId ? progress.resumePositionMs : 0);
      setError(undefined);
    }).catch((loadError: any) => {
      if (!cancelled) setError(loadError?.message || 'No pudimos cargar esta serie.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [loadProgress, route.params.episodeId, seriesId]);

  const handleProgress = useCallback((episode: MicrodramaEpisode, positionMs: number, event: 'position' | 'ended' = 'position') => {
    void saveProgress(seriesId, episode, positionMs, event);
  }, [saveProgress, seriesId]);

  const startConversation = useCallback((characterId: string, episode: MicrodramaEpisode, positionMs: number) => {
    navigation.navigate('FriendChat', {
      friendId: characterId,
      microdramaContext: { seriesId, episodeId: episode.episodeId, positionMs },
    });
  }, [navigation, seriesId]);

  if (loading) return <View style={{ flex: 1, backgroundColor: '#030712', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#22d3ee" /></View>;
  if (error || !detail) return <View style={{ flex: 1, backgroundColor: '#07111f', alignItems: 'center', justifyContent: 'center', padding: 24 }}><Text style={{ color: 'white', textAlign: 'center' }}>{error || 'No encontramos esta serie.'}</Text><Pressable onPress={() => navigation.goBack()} style={{ marginTop: 18 }}><Text style={{ color: '#22d3ee' }}>Volver</Text></Pressable></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#030712' }}>
      <MicrodramaPlayer
        key={detail.series.seriesId}
        detail={detail}
        active={focused}
        initialEpisodeId={startEpisodeId}
        initialPositionMs={startPositionMs}
        onProgress={handleProgress}
        onStartConversation={startConversation}
        onBack={() => navigation.goBack()}
      />
    </View>
  );
}
