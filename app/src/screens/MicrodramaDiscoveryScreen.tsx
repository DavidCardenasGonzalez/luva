import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View, useWindowDimensions } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import AppTabBar from '../components/AppTabBar';
import { getMicrodramaDetail, getMicrodramas } from '../microdramas/api';
import { useMicrodramaProgress } from '../microdramas/MicrodramaProgressProvider';
import MicrodramaPlayer from '../microdramas/player/MicrodramaPlayer';
import type { MicrodramaDetail, MicrodramaProgressSummary, MicrodramaSeries } from '../microdramas/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Discovery'>;
type DiscoveryItem = { series: MicrodramaSeries; detail?: MicrodramaDetail; progress?: MicrodramaProgressSummary };

export default function MicrodramaDiscoveryScreen({ navigation }: Props) {
  const isFocused = useIsFocused();
  const { height } = useWindowDimensions();
  const { loadProgress, saveProgress } = useMicrodramaProgress();
  const seed = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`).current;
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const loadingRef = useRef(false);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    const active = viewableItems[0]?.index;
    if (active != null) setActiveIndex(active);
  }).current;

  const loadPage = useCallback(async (next?: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const page = await getMicrodramas({ discovery: true, seed, cursor: next });
      setItems(current => {
        const known = new Set(current.map(item => item.series.seriesId));
        return [...current, ...page.items.filter(item => !known.has(item.seriesId)).map(series => ({ series }))];
      });
      setCursor(page.nextCursor);
      setError(undefined);
    } catch (loadError: any) { setError(loadError?.message || 'No pudimos cargar Discovery.'); }
    finally { loadingRef.current = false; setLoading(false); }
  }, [seed]);

  useEffect(() => { void loadPage(); }, [loadPage]);
  const activeSeriesId = items[activeIndex]?.series.seriesId;

  useEffect(() => {
    if (!activeSeriesId || items[activeIndex]?.detail) return;
    let cancelled = false;
    const seriesId = activeSeriesId;
    void Promise.all([getMicrodramaDetail(seriesId), loadProgress(seriesId)]).then(([detail, progress]) => {
      if (!cancelled) setItems(current => current.map(item => item.series.seriesId === seriesId ? { ...item, detail, progress } : item));
    }).catch(loadError => { if (!cancelled) setError(loadError?.message || 'No pudimos cargar el episodio.'); });
    const next = items[activeIndex + 1];
    if (next && !next.detail) {
      void getMicrodramaDetail(next.series.seriesId).then(detail => setItems(current => current.map(item => item.series.seriesId === next.series.seriesId ? { ...item, detail } : item))).catch(() => undefined);
    }
    return () => { cancelled = true; };
  }, [activeIndex, activeSeriesId, items, loadProgress]);

  const startConversation = useCallback((characterId: string, episode: NonNullable<DiscoveryItem['detail']>['episodes'][number], positionMs: number) => {
    const seriesId = items[activeIndex]?.series.seriesId;
    if (!seriesId) return;
    navigation.navigate('FriendChat', { friendId: characterId, microdramaContext: { seriesId, episodeId: episode.episodeId, positionMs } });
  }, [activeIndex, items, navigation]);

  const renderItem = ({ item, index }: { item: DiscoveryItem; index: number }) => (
    <View style={{ height, backgroundColor: '#030712' }}>
      {isFocused && item.detail ? <MicrodramaPlayer
        key={item.series.seriesId}
        detail={item.detail}
        active={isFocused && index === activeIndex}
        initialEpisodeId={item.progress?.resumeEpisodeId}
        initialPositionMs={item.progress?.resumePositionMs || 0}
        onProgress={(episode, position, event) => void saveProgress(item.series.seriesId, episode, position, event)}
        onStartConversation={(characterId, episode, position) => startConversation(characterId, episode, position)}
        onBack={() => navigation.navigate('Home')}
        bottomInsetExtra={100}
      /> : isFocused ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#22d3ee" /><Text style={{ color: 'white', marginTop: 12 }}>{item.series.title}</Text></View> : null}
    </View>
  );

  return <SafeAreaView style={{ flex: 1, backgroundColor: '#030712' }} edges={[]}>
    {items.length ? <FlatList
      data={items} keyExtractor={item => item.series.seriesId} renderItem={renderItem}
      pagingEnabled snapToInterval={height} decelerationRate="fast" showsVerticalScrollIndicator={false}
      initialNumToRender={1} maxToRenderPerBatch={2} windowSize={3}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      onEndReached={() => { if (cursor && !loading) void loadPage(cursor); }} onEndReachedThreshold={0.8}
    /> : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>{loading ? <ActivityIndicator color="#22d3ee" /> : <Text style={{ color: 'white' }}>{error || 'Todavía no hay series para descubrir.'}</Text>}</View>}
    <AppTabBar active="discovery" />
  </SafeAreaView>;
}
