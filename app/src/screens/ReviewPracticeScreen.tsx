import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../i18n/LanguageProvider';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { answerCharacters, checkAnswer, loadPracticeItems, makeSlots, shufflePracticeItems } from '../review/practice';
import { useReview } from '../review/ReviewProvider';
import type { ReviewItem } from '../review/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewPractice'>;
const CYAN = '#67e8f9';
const GREEN = '#86efac';
const RED = '#fda4af';

function Action({ label, onPress, secondary }: { label: string; onPress: () => void; secondary?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.action, secondary && styles.secondary, pressed && styles.pressed]}>
      <Text style={[styles.actionLabel, secondary && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

function Exercise({ item, onNext, onStatusChange }: { item: ReviewItem; onNext: () => void; onStatusChange: (status: ReviewItem['status']) => void }) {
  const { t } = useLanguage();
  const { setStatus } = useReview();
  const inputs = useRef<Array<TextInput | null>>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const expected = useMemo(() => answerCharacters(item.originalText), [item.originalText]);
  const words = useMemo(() => makeSlots(item.originalText), [item.originalText]);
  const [typed, setTyped] = useState(() => expected.map(() => ''));
  const [focused, setFocused] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const result = typed.every(Boolean) ? checkAnswer(expected, typed) : undefined;
  const correct = result?.every(Boolean);

  const changeLetter = (index: number, value: string) => {
    const characters = answerCharacters(value);
    setTyped(current => {
      const next = [...current];
      if (!characters.length) next[index] = '';
      else {
        const replacement = current[index] && characters.length > 1 ? characters.slice(-1) : characters;
        replacement.forEach((character, offset) => {
          if (index + offset < next.length) next[index + offset] = character;
        });
      }
      return next;
    });
    if (characters.length) {
      const length = typed[index] && characters.length > 1 ? 1 : characters.length;
      const nextIndex = index + length;
      if (nextIndex < expected.length) inputs.current[nextIndex]?.focus();
      else Keyboard.dismiss();
    }
  };

  const toggleStatus = async () => {
    if (statusLoading) return;
    setStatusLoading(true);
    setStatusError(false);
    try {
      const updated = await setStatus(item.id, item.status === 'pending' ? 'completed' : 'pending');
      onStatusChange(updated.status);
    } catch {
      setStatusError(true);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.prompt}>
        <View style={styles.promptHeader}>
          <MaterialIcons name="translate" size={18} color={CYAN} />
          <Text style={styles.eyebrow}>{t('review.practice.prompt')}</Text>
        </View>
        <Text style={styles.translation}>{item.translatedText}</Text>
      </View>

      <View style={styles.answer}>
        <View style={styles.words}>
          {words.map((word, wordIndex) => (
            <View key={wordIndex} style={styles.word}>
              {word.map((slot, slotIndex) => {
                if (typeof slot.index !== 'number') return <Text key={slotIndex} style={styles.punctuation}>{slot.character}</Text>;
                const letter = typed[slot.index];
                const match = result?.[slot.index];
                return (
                  <Pressable
                    key={slotIndex}
                    accessible={false}
                    onPress={() => inputs.current[slot.index!]?.focus()}
                    style={[
                      styles.slot,
                      match === true ? styles.slotCorrect : match === false ? styles.slotIncorrect :
                        focused === slot.index ? styles.slotActive : undefined,
                    ]}
                  >
                    <TextInput
                      ref={ref => { inputs.current[slot.index!] = ref; }}
                      value={letter}
                      onChangeText={value => changeLetter(slot.index!, value)}
                      onFocus={() => setFocused(slot.index!)}
                      onBlur={() => setFocused(null)}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === 'Backspace' && !typed[slot.index!] && slot.index! > 0) {
                          const previous = slot.index! - 1;
                          setTyped(current => current.map((character, index) => index === previous ? '' : character));
                          inputs.current[previous]?.focus();
                        }
                      }}
                      accessibilityLabel={t('review.practice.slot', { position: slot.index + 1, total: expected.length })}
                      accessibilityHint={match === undefined ? undefined : t(match ? 'review.practice.correctLetter' : 'review.practice.incorrectLetter', { letter })}
                      selectTextOnFocus
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                      underlineColorAndroid="transparent"
                      maxFontSizeMultiplier={1.3}
                      style={[styles.letter, match === true && styles.green, match === false && styles.red]}
                    />
                    {match !== undefined && <MaterialIcons name={match ? 'check' : 'close'} size={10} color={match ? GREEN : RED} />}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {result ? (
          <View accessibilityLiveRegion="polite" style={styles.feedback}>
            <View style={styles.promptHeader}>
              <MaterialIcons name={correct ? 'check-circle' : 'info-outline'} size={21} color={correct ? GREEN : RED} />
              <Text style={[styles.feedbackLabel, correct ? styles.green : styles.red]}>{t(correct ? 'review.practice.correct' : 'review.practice.incorrect')}</Text>
            </View>
          </View>
        ) : <Text style={styles.count}>{t('review.practice.tapSlots')}</Text>}
        {revealed && <Text accessibilityLiveRegion="polite" style={styles.solution}>{t('review.original')}: {item.originalText}</Text>}
      </View>

      <View style={styles.actions}>
        {(result || revealed) && <Action label={t('review.practice.next')} onPress={() => { Keyboard.dismiss(); onNext(); }} />}
        {!revealed && <Action label={t('review.practice.showAnswer')} secondary onPress={() => { Keyboard.dismiss(); setRevealed(true); }} />}
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={statusLoading}
        onPress={() => { void toggleStatus(); }}
        style={({ pressed }) => [styles.action, styles.secondary, (pressed || statusLoading) && styles.pressed]}
      >
        {statusLoading ? <ActivityIndicator color={CYAN} /> : (
          <View style={styles.promptHeader}>
            <MaterialIcons name={item.status === 'pending' ? 'task-alt' : 'replay'} size={20} color={CYAN} />
            <Text style={[styles.actionLabel, styles.secondaryLabel]}>{t(item.status === 'pending' ? 'review.markCompleted' : 'review.returnToPending')}</Text>
          </View>
        )}
      </Pressable>
      {statusError && <Text accessibilityLiveRegion="polite" style={styles.red}>{t('review.practice.statusError')}</Text>}
    </ScrollView>
  );
}

export default function ReviewPracticeScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { list } = useReview();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [request, setRequest] = useState(0);

  useEffect(() => {
    let active = true;
    void loadPracticeItems(cursor => list('pending', cursor), () => active)
      .then(next => {
        if (!active) return;
        setItems(next);
        setState('ready');
      })
      .catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [list, request]);

  const item = items[index];
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => navigation.goBack()} style={styles.back}>
            <MaterialIcons name="arrow-back" color="white" size={23} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>{t('review.practice.title')}</Text>
          {state === 'ready' && item && <Text style={styles.progress}>{t('review.practice.progress', { current: index + 1, total: items.length })}</Text>}
        </View>
        {state === 'ready' && item ? (
          <>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${((index + 1) / items.length) * 100}%` }]} />
            </View>
            <Exercise key={item.id} item={item} onNext={() => setIndex(index + 1)} onStatusChange={status => setItems(current => current.map(saved => saved.id === item.id ? { ...saved, status } : saved))} />
          </>
        ) : state === 'loading' ? (
          <ActivityIndicator color={CYAN} accessibilityLabel={t('common.loading')} style={styles.loading} />
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.message}>
              <MaterialIcons name={state === 'error' ? 'info-outline' : items.length ? 'task-alt' : 'bookmark-border'} color={CYAN} size={38} />
              <Text style={styles.messageLabel}>{t(state === 'error' ? 'review.loadError' : items.length ? 'review.practice.finished' : 'review.practice.empty')}</Text>
            </View>
            {state === 'error' ? (
              <Action label={t('common.retry')} onPress={() => { setState('loading'); setRequest(current => current + 1); }} />
            ) : items.length ? (
              <View style={styles.actions}>
                {items.some(saved => saved.status === 'pending') && <Action label={t('review.practice.again')} onPress={() => { setItems(shufflePracticeItems(items.filter(saved => saved.status === 'pending'))); setIndex(0); }} />}
                <Action label={t('common.done')} secondary onPress={() => navigation.goBack()} />
              </View>
            ) : (
              <Action label={t('common.back')} onPress={() => navigation.goBack()} />
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#07111f' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, gap: 12 },
  back: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#142238' },
  title: { color: '#f8fafc', flex: 1, fontSize: 23, fontWeight: '900' },
  progress: { color: CYAN, fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  track: { height: 4, backgroundColor: '#1e334a', marginHorizontal: 20, marginTop: 5, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2, backgroundColor: CYAN },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, gap: 16 },
  prompt: { padding: 18, gap: 9, borderRadius: 20, backgroundColor: '#102638', borderWidth: 1, borderColor: '#25445a' },
  promptHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { color: CYAN, flexShrink: 1, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  translation: { color: '#f8fafc', fontSize: 26, fontWeight: '900' },
  answer: { padding: 14, gap: 12, borderRadius: 20, backgroundColor: '#101d30', borderWidth: 1, borderColor: '#25364d' },
  words: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 8 },
  word: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', maxWidth: '100%', gap: 3 },
  punctuation: { color: '#a8bad0', fontSize: 17, fontWeight: '800' },
  slot: { width: 26, height: 43, borderRadius: 7, borderWidth: 1, borderColor: '#3d536d', backgroundColor: '#07111f', alignItems: 'center', justifyContent: 'center' },
  slotActive: { borderColor: CYAN },
  slotCorrect: { backgroundColor: '#12332c', borderColor: '#3b8a6c' },
  slotIncorrect: { backgroundColor: '#421d2b', borderColor: '#a95368' },
  letter: { color: '#f8fafc', fontSize: 17, fontWeight: '800', textAlign: 'center', width: '100%', padding: 0 },
  green: { color: GREEN },
  red: { color: RED },
  count: { color: '#a8bad0', fontSize: 12, fontWeight: '700', textAlign: 'right' },
  feedback: { borderTopWidth: 1, borderTopColor: '#25364d', paddingTop: 12, gap: 6 },
  feedbackLabel: { flexShrink: 1, fontSize: 15, fontWeight: '800' },
  solution: { color: '#e2e8f0', fontSize: 15 },
  actions: { gap: 9 },
  action: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: CYAN },
  actionLabel: { color: '#07111f', fontSize: 16, textAlign: 'center', fontWeight: '900' },
  secondary: { backgroundColor: '#142238' },
  secondaryLabel: { color: '#e2e8f0' },
  pressed: { opacity: 0.8 },
  loading: { marginTop: 40 },
  message: { gap: 12, padding: 24, borderRadius: 20, alignItems: 'center', backgroundColor: '#101d30' },
  messageLabel: { color: '#f8fafc', textAlign: 'center', fontSize: 18, fontWeight: '800' },
});
