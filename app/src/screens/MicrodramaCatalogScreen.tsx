import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Image, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import AppTabBar from '../components/AppTabBar';
import { getMicrodramaDetail, getMicrodramas } from '../microdramas/api';
import { useMicrodramaProgress } from '../microdramas/MicrodramaProgressProvider';
import type { MicrodramaSeries } from '../microdramas/types';
import { useLanguage } from '../i18n/LanguageProvider';
import { useIsFocused } from '@react-navigation/native';
import MicrodramaTour from '../microdramas/MicrodramaTour';
import { useMicrodramaTour } from '../tour/useMicrodramaTour';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export default function MicrodramaCatalogScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const { language } = useLanguage();
  const focused = useIsFocused();
  const { summaries, loadBatch } = useMicrodramaProgress();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<MicrodramaSeries[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchPending, setSearchPending] = useState(false);
  const [error, setError] = useState<string>();
  const [resumeEpisodeNumbers, setResumeEpisodeNumbers] = useState<Record<string, number>>({});
  const request = useRef(0);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lookedUpResumeNumbers = useRef(new Set<string>());
  const focusAnimation = useRef(new Animated.Value(0)).current;
  const resultsAnimation = useRef(new Animated.Value(1)).current;
  const visibleItems = useMemo(() => {
    const normalized = normalizeSearch(query);
    return normalized ? items.filter(item => normalizeSearch(item.title).includes(normalized)) : items;
  }, [items, query]);
  const welcomeTour = useMicrodramaTour('dramasWelcome', focused, !loading && items.length > 0);

  const load = useCallback(async (search: string, nextCursor?: string, append = false) => {
    const requestId = ++request.current;
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const page = await getMicrodramas({ q: search, cursor: nextCursor });
      if (requestId !== request.current) return;
      setItems(current => append ? [...current, ...page.items.filter(item => !current.some(existing => existing.seriesId === item.seriesId))] : page.items);
      setCursor(page.nextCursor);
      setError(undefined);
    } catch (loadError: any) {
      if (requestId === request.current) setError(loadError?.message || (language === 'es' ? 'No pudimos cargar las series.' : 'Could not load series.'));
    } finally {
      if (requestId === request.current) { setLoading(false); setLoadingMore(false); setSearchPending(false); }
    }
  }, [language]);

  useEffect(() => {
    void load('');
    return () => { request.current += 1; if (debounce.current) clearTimeout(debounce.current); };
  }, [load]);

  useEffect(() => { void loadBatch(items.map(item => item.seriesId)); }, [items, loadBatch]);

  useEffect(() => {
    let cancelled = false;
    const pending = items.filter(item => summaries[item.seriesId] && !lookedUpResumeNumbers.current.has(item.seriesId));
    if (!pending.length) return;
    pending.forEach(item => lookedUpResumeNumbers.current.add(item.seriesId));
    void Promise.all(pending.map(async item => {
      try {
        const detail = await getMicrodramaDetail(item.seriesId);
        const episode = detail.episodes.find(candidate => candidate.episodeId === summaries[item.seriesId]?.resumeEpisodeId);
        return [item.seriesId, episode?.episodeNumber] as const;
      } catch { return [item.seriesId, undefined] as const; }
    })).then(results => {
      if (cancelled) return;
      setResumeEpisodeNumbers(current => {
        const next = { ...current };
        for (const [seriesId, number] of results) if (number != null) next[seriesId] = number;
        return next;
      });
    });
    return () => { cancelled = true; };
  }, [items, summaries]);

  const search = useCallback((text: string) => {
    setQuery(text);
    request.current += 1;
    setSearchPending(true);
    setLoadingMore(false);
    setError(undefined);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { void load(text.trim()); }, 200);
  }, [load]);

  useEffect(() => {
    resultsAnimation.setValue(0.85);
    Animated.timing(resultsAnimation, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [items, resultsAnimation]);

  const animateFocus = (focused: boolean) => {
    Animated.timing(focusAnimation, { toValue: focused ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  };

  const renderItem = ({ item, index }: { item: MicrodramaSeries; index: number }) => {
    const progress = summaries[item.seriesId];
    const widthItem = (width - 36) / 2;
    return <Pressable onPress={() => navigation.navigate('MicrodramaPlayer', { seriesId: item.seriesId, ...(progress?.resumeEpisodeId ? { episodeId: progress.resumeEpisodeId } : {}) })} style={{ width: widthItem, marginBottom: 18 }}>
      <View style={{ height: widthItem * 1.42, borderRadius: 15, overflow: 'hidden', backgroundColor: '#172337' }}>
        <Image source={{ uri: item.coverUrl }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
        {progress && resumeEpisodeNumbers[item.seriesId] != null ? <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(8,16,30,0.86)', padding: 8 }}><Text numberOfLines={1} style={{ color: '#a5f3fc', fontSize: 11, fontWeight: '800' }}>{language === 'es' ? 'Episodio' : 'Episode'} {resumeEpisodeNumbers[item.seriesId]}</Text></View> : null}
      </View>
      <Text numberOfLines={2} style={{ color: 'white', fontSize: 14, fontWeight: '800', marginTop: 8 }}>{item.title}</Text>
    </Pressable>;
  };

  return <SafeAreaView style={{ flex: 1, backgroundColor: '#07111f' }} edges={['top']}>
    <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12 }}>
      <Text style={{ color: 'white', fontSize: 28, fontWeight: '900' }}>Luva Dramas</Text>
      <Animated.View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#132136', borderRadius: 14, paddingHorizontal: 12, marginTop: 14, borderWidth: 1, borderColor: focusAnimation.interpolate({ inputRange: [0, 1], outputRange: ['#24354c', '#22d3ee'] }) }}>
        <MaterialIcons name="search" size={22} color="#94a3b8" />
        <TextInput value={query} onChangeText={search} onFocus={() => animateFocus(true)} onBlur={() => animateFocus(false)} placeholder={language === 'es' ? 'Buscar series' : 'Search series'} placeholderTextColor="#94a3b8" style={{ color: 'white', flex: 1, height: 46, paddingHorizontal: 8 }} returnKeyType="search" />
        {searchPending ? <ActivityIndicator size="small" color="#22d3ee" /> : query ? <Pressable accessibilityRole="button" accessibilityLabel={language === 'es' ? 'Borrar búsqueda' : 'Clear search'} onPress={() => search('')} hitSlop={10}><MaterialIcons name="close" size={20} color="#94a3b8" /></Pressable> : null}
      </Animated.View>
    </View>
    {error ? <View style={{ alignItems: 'center', padding: 24 }}><Text style={{ color: '#fda4af' }}>{error}</Text><Pressable onPress={() => void load(query.trim())} style={{ padding: 12 }}><Text style={{ color: '#22d3ee' }}>{language === 'es' ? 'Reintentar' : 'Retry'}</Text></Pressable></View> : (loading || searchPending) && !visibleItems.length ? <ActivityIndicator style={{ marginTop: 50 }} color="#22d3ee" /> : visibleItems.length ? <Animated.View style={{ flex: 1, opacity: resultsAnimation }}><FlatList
      data={visibleItems} keyExtractor={item => item.seriesId} renderItem={renderItem} numColumns={2}
      contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 135 }} columnWrapperStyle={{ justifyContent: 'space-between' }}
      onEndReached={() => { if (cursor && !searchPending && !loadingMore && !loading) void load(query.trim(), cursor, true); }} onEndReachedThreshold={0.4}
      ListFooterComponent={loadingMore ? <ActivityIndicator color="#22d3ee" style={{ padding: 12 }} /> : null}
    /></Animated.View> : <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 50 }}>{language === 'es' ? 'No encontramos series.' : 'No series found.'}</Text>}
    <AppTabBar active="home" />
    {welcomeTour.visible ? <MicrodramaTour kind="welcome" onDismiss={welcomeTour.dismiss} /> : null}
  </SafeAreaView>;
}
