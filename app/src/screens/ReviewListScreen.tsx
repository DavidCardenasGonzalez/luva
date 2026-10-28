import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/AppNavigator';
import AppTabBar from '../components/AppTabBar';
import { useLanguage } from '../i18n/LanguageProvider';
import { useReview } from '../review/ReviewProvider';
import type { ReviewItem, ReviewStatus } from '../review/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewList'>;
const BG = '#07111f';

export default function ReviewListScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { list, refreshKey } = useReview();
  const [status, setStatus] = useState<ReviewStatus>('pending');
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async (nextStatus: ReviewStatus, nextCursor?: string, append = false) => {
    const request = ++requestId.current;
    append ? setLoadingMore(true) : setLoading(true);
    setError(false);
    try {
      const page = await list(nextStatus, nextCursor);
      if (request !== requestId.current) return;
      setItems(current => append ? [...current, ...page.items] : page.items);
      setCursor(page.nextCursor);
    } catch {
      if (request !== requestId.current) return;
      setError(true);
    } finally {
      if (request === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [list]);

  useEffect(() => { void load(status); }, [load, refreshKey, status]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 132 }}>
        <Text style={{ color: '#67e8f9', fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' }}>{t('review.eyebrow')}</Text>
        <Text style={{ color: 'white', fontSize: 30, fontWeight: '900', marginTop: 5 }}>{t('review.title')}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 20, marginBottom: 16 }}>
          {(['pending', 'completed'] as ReviewStatus[]).map(value => (
            <Pressable key={value} onPress={() => { setStatus(value); setItems([]); setCursor(undefined); }} style={{ borderRadius: 20, paddingHorizontal: 15, paddingVertical: 9, backgroundColor: value === status ? '#0e7490' : '#142238' }}>
              <Text style={{ color: 'white', fontWeight: '800' }}>{t(value === 'pending' ? 'review.pending' : 'review.completed')}</Text>
            </Pressable>
          ))}
        </View>
        {loading ? <ActivityIndicator color="#67e8f9" style={{ marginTop: 36 }} /> : error ? (
          <Pressable onPress={() => { void load(status); }} style={{ alignItems: 'center', padding: 24 }}>
            <Text style={{ color: '#fecaca', fontWeight: '700' }}>{t('review.loadError')}</Text>
            <Text style={{ color: '#67e8f9', marginTop: 8 }}>{t('common.retry')}</Text>
          </Pressable>
        ) : items.length ? items.map(item => (
          <Pressable key={item.id} onPress={() => navigation.navigate('ReviewDetail', { itemId: item.id })} style={{ padding: 16, marginBottom: 10, borderRadius: 16, borderWidth: 1, borderColor: '#25364d', backgroundColor: '#101d30' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontSize: 17, fontWeight: '900' }}>{item.originalText}</Text>
                <Text style={{ color: '#a8bad0', fontSize: 15, lineHeight: 21, marginTop: 5 }}>{item.translatedText}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={25} color="#67e8f9" />
            </View>
            {item.contextText && item.contextText !== item.originalText ? <Text numberOfLines={2} style={{ color: '#8193aa', fontSize: 12, marginTop: 9 }}>{item.contextText}</Text> : null}
          </Pressable>
        )) : (
          <View style={{ alignItems: 'center', paddingHorizontal: 18, paddingVertical: 34, borderRadius: 18, backgroundColor: '#101d30' }}>
            <MaterialIcons name={status === 'pending' ? 'bookmark-border' : 'task-alt'} size={34} color="#67e8f9" />
            <Text style={{ color: 'white', textAlign: 'center', fontSize: 16, lineHeight: 23, marginTop: 12 }}>{t(status === 'pending' ? 'review.empty' : 'review.emptyCompleted')}</Text>
            {status === 'pending' ? <Pressable onPress={() => navigation.navigate('Discovery')} style={{ marginTop: 18, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#0e7490' }}><Text style={{ color: 'white', fontWeight: '900' }}>{t('review.watchVideos')}</Text></Pressable> : null}
          </View>
        )}
        {!loading && cursor ? <Pressable disabled={loadingMore} onPress={() => { void load(status, cursor, true); }} style={{ alignSelf: 'center', padding: 14 }}>
          {loadingMore ? <ActivityIndicator color="#67e8f9" /> : <Text style={{ color: '#67e8f9', fontWeight: '900' }}>{t('review.loadMore')}</Text>}
        </Pressable> : null}
        <Pressable onPress={() => navigation.navigate('Feed')} style={{ alignSelf: 'center', padding: 14, marginTop: 6 }}><Text style={{ color: '#94a3b8', fontWeight: '800' }}>{t('review.exploreFeed')}</Text></Pressable>
      </ScrollView>
      <AppTabBar active="learn" />
    </SafeAreaView>
  );
}
