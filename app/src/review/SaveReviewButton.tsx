import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../i18n/LanguageProvider';
import { useReview } from './ReviewProvider';
import type { ReviewItem, ReviewSource } from './types';

export default function SaveReviewButton({
  originalText, translatedText, sourceLanguage = 'en', targetLanguage, contextText, source,
}: {
  originalText: string;
  translatedText: string;
  sourceLanguage?: string;
  targetLanguage: string;
  contextText?: string;
  source: ReviewSource;
}) {
  const { t } = useLanguage();
  const { save } = useReview();
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'completed' | 'error'>('idle');
  const itemKey = `${originalText}:${targetLanguage}`;

  useEffect(() => { setState('idle'); }, [itemKey]);

  const onSave = async () => {
    if (state === 'saving') return;
    setState('saving');
    try {
      const item: ReviewItem = await save({
        originalText, translatedText, sourceLanguage, targetLanguage, contextText, source,
      });
      setState(item.status === 'completed' ? 'completed' : 'saved');
    } catch {
      setState('error');
    }
  };

  if (!originalText.trim() || !translatedText.trim()) return null;
  if (state === 'saved' || state === 'completed') {
    return (
      <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
        <MaterialIcons name={state === 'saved' ? 'check-circle' : 'task-alt'} size={17} color="#86efac" />
        <Text style={{ color: '#bbf7d0', fontSize: 13, fontWeight: '800' }}>{t(state === 'saved' ? 'review.saved' : 'review.completedAlready')}</Text>
      </View>
    );
  }
  return (
    <View style={{ alignItems: 'center', marginTop: 8 }}>
      <Pressable
        onPress={() => { void onSave(); }}
        disabled={state === 'saving'}
        accessibilityRole="button"
        style={{ minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 18, paddingHorizontal: 14, backgroundColor: 'rgba(22, 101, 52, 0.92)', opacity: state === 'saving' ? 0.7 : 1 }}
      >
        {state === 'saving' ? <ActivityIndicator size="small" color="white" /> : <MaterialIcons name="bookmark-add" size={17} color="white" />}
        <Text style={{ color: 'white', fontSize: 13, fontWeight: '800' }}>{t(state === 'saving' ? 'review.saving' : 'review.add')}</Text>
      </Pressable>
      {state === 'error' ? <Text style={{ marginTop: 5, color: '#fecaca', fontSize: 12 }}>{t('review.saveError')}</Text> : null}
    </View>
  );
}
