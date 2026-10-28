import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useLanguage } from '../i18n/LanguageProvider';
import { useReview } from '../review/ReviewProvider';
import type { ReviewHistoryMessage, ReviewItem } from '../review/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewDetail'>;
const BG = '#07111f';

export default function ReviewDetailScreen({ navigation, route }: Props) {
  const { t, supportLanguage } = useLanguage();
  const { get, setStatus, ask, refreshKey } = useReview();
  const [item, setItem] = useState<ReviewItem>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<ReviewHistoryMessage[]>([]);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState(false);
  const request = useRef(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    void get(route.params.itemId).then(value => { if (active) setItem(value); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; request.current += 1; };
  }, [get, refreshKey, route.params.itemId]);

  const toggleStatus = useCallback(async () => {
    if (!item || statusLoading) return;
    const nextStatus = item.status === 'pending' ? 'completed' : 'pending';
    setStatusLoading(true);
    try {
      setItem(await setStatus(item.id, nextStatus));
    } catch {
      setError(true);
    } finally {
      setStatusLoading(false);
    }
  }, [item, setStatus, statusLoading]);

  const submit = useCallback(async (value = question) => {
    const trimmed = value.trim();
    if (!item || !trimmed || askLoading) return;
    const currentRequest = ++request.current;
    setAskLoading(true);
    setAskError(false);
    try {
      const answer = await ask(item.id, trimmed, history, supportLanguage);
      if (request.current === currentRequest) {
        setHistory(current => [...current, { role: 'user', content: trimmed }, { role: 'assistant', content: answer }]);
        setQuestion('');
      }
    } catch {
      if (request.current === currentRequest) setAskError(true);
    } finally {
      if (request.current === currentRequest) setAskLoading(false);
    }
  }, [ask, askLoading, history, item, question, supportLanguage]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
          <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel={t('common.back')} style={{ padding: 8 }}><MaterialIcons name="arrow-back" size={24} color="white" /></Pressable>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', marginLeft: 8 }}>{t('review.detailTitle')}</Text>
        </View>
        {loading ? <ActivityIndicator color="#67e8f9" style={{ marginTop: 40 }} /> : error && !item ? (
          <Pressable onPress={() => {
            setLoading(true);
            setError(false);
            void get(route.params.itemId).then(setItem).catch(() => setError(true)).finally(() => setLoading(false));
          }} style={{ padding: 24 }}><Text style={{ color: '#fecaca', textAlign: 'center' }}>{t('review.loadError')}</Text><Text style={{ color: '#67e8f9', textAlign: 'center', marginTop: 8 }}>{t('common.retry')}</Text></Pressable>
        ) : item ? <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <View style={{ padding: 18, borderRadius: 18, backgroundColor: '#101d30', borderWidth: 1, borderColor: '#25364d' }}>
            <Text style={{ color: '#67e8f9', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{t('review.original')}</Text>
            <Text style={{ color: 'white', fontSize: 25, lineHeight: 33, fontWeight: '900', marginTop: 7 }}>{item.originalText}</Text>
            <Text style={{ color: '#86efac', fontSize: 18, lineHeight: 25, fontWeight: '800', marginTop: 12 }}>{item.translatedText}</Text>
            {item.contextText && item.contextText !== item.originalText ? <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#25364d' }}>
              <Text style={{ color: '#8fa3ba', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }}>{t('review.context')}</Text>
              <Text style={{ color: '#cbd5e1', lineHeight: 21, marginTop: 5 }}>{item.contextText}</Text>
            </View> : null}
            {item.source.title ? <Text style={{ color: '#8193aa', fontSize: 12, marginTop: 12 }}>{item.source.title}</Text> : null}
          </View>
          <Pressable disabled={statusLoading} onPress={() => { void toggleStatus(); }} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, borderRadius: 14, backgroundColor: item.status === 'pending' ? '#0e7490' : '#1e293b', opacity: statusLoading ? 0.6 : 1 }}>
            {statusLoading ? <ActivityIndicator color="white" /> : <MaterialIcons name={item.status === 'pending' ? 'task-alt' : 'replay'} size={20} color="white" />}
            <Text style={{ color: 'white', fontWeight: '900' }}>{t(item.status === 'pending' ? 'review.markCompleted' : 'review.returnToPending')}</Text>
          </Pressable>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', marginTop: 27 }}>{t('review.askTitle')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {['review.promptUse', 'review.promptExamples', 'review.promptWhy'].map(key => <Pressable key={key} disabled={askLoading} onPress={() => { void submit(t(key)); }} style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18, backgroundColor: '#142238' }}><Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: '800' }}>{t(key)}</Text></Pressable>)}
          </View>
          {history.map((message, index) => <View key={`${index}-${message.role}`} style={{ alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '92%', padding: 12, marginTop: 10, borderRadius: 14, backgroundColor: message.role === 'user' ? '#0e7490' : '#142238' }}><Text style={{ color: 'white', lineHeight: 21 }}>{message.content}</Text></View>)}
          {askLoading ? <View accessibilityLiveRegion="polite" style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, paddingVertical: 11, marginTop: 10, borderRadius: 14, backgroundColor: '#142238' }}>
            <ActivityIndicator color="#67e8f9" size="small" />
            <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '700' }}>{t('review.aiThinking')}</Text>
          </View> : null}
          {askError ? <Text style={{ color: '#fecaca', marginTop: 10 }}>{t('review.askError')}</Text> : null}
        </ScrollView> : null}
        {item ? <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1f2c40' }}>
          <TextInput value={question} onChangeText={setQuestion} placeholder={t('review.questionPlaceholder')} placeholderTextColor="#718096" multiline maxLength={2000} style={{ flex: 1, maxHeight: 100, minHeight: 44, borderRadius: 15, backgroundColor: '#101d30', color: 'white', paddingHorizontal: 14, paddingVertical: 11 }} />
          <Pressable disabled={askLoading || !question.trim()} onPress={() => { void submit(); }} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#0e7490', opacity: askLoading || !question.trim() ? 0.5 : 1 }}>{askLoading ? <ActivityIndicator color="white" size="small" /> : <MaterialIcons name="send" size={20} color="white" />}</Pressable>
        </View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
