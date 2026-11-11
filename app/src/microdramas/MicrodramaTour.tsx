import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../i18n/LanguageProvider';

type Props = {
  kind: 'welcome' | 'subtitles';
  subtitle?: string;
  onDismiss: () => void;
  onTry?: () => void;
};
type SelectionMode = 'word' | 'phrase' | 'all';
const MODES: SelectionMode[] = ['word', 'phrase', 'all'];

export default function MicrodramaTour({ kind, subtitle, onDismiss, onTry }: Props) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<SelectionMode>('word');
  // Keep the example still while the native player finishes pausing.
  const [example] = useState(subtitle || 'I didn’t see that coming.');
  const welcome = kind === 'welcome';
  const saving = !welcome && step === 1;
  const titleKey = welcome ? 'welcomeTitle' : saving ? 'saveTitle' : 'translateTitle';
  const descriptionKey = welcome ? 'welcomeDescription' : saving ? 'saveDescription' : 'translateDescription';

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <SafeAreaView style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
          <View style={styles.card} accessibilityViewIsModal>
            <View style={styles.topRow}>
              <Text style={styles.eyebrow}>{welcome ? 'LUVA DRAMAS' : t('dramasTour.step', { current: step + 1, total: 2 })}</Text>
              <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel={t('common.close')} hitSlop={8} style={styles.close}>
                <MaterialIcons name="close" size={22} color="#94a3b8" />
              </Pressable>
            </View>
            <View style={styles.luviRow}>
              <View style={[styles.luviHalo, !welcome && styles.smallHalo]}>
                <Image source={require('../image/luvi-saying-hi.gif')} resizeMode="contain" accessible={false} style={welcome ? styles.luvi : styles.smallLuvi} />
              </View>
              <Text style={styles.fromLuvi}>{t('dramasTour.fromLuvi')}</Text>
            </View>
            <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.title}>{t(`dramasTour.${titleKey}`)}</Text>
            <Text style={styles.description}>{t(`dramasTour.${descriptionKey}`, { action: t('review.add') })}</Text>

            {welcome ? (
              <View style={styles.features}>
                <Feature icon="movie" label={t('dramasTour.stories')} />
                <Feature icon="auto-awesome" label={t('dramasTour.vocabulary')} />
              </View>
            ) : saving ? (
              <View style={styles.demo}>
                <Text style={styles.demoLabel}>{t('dramasTour.afterTranslation')}</Text>
                <View style={styles.savePreview}>
                  <MaterialIcons name="bookmark-add" size={20} color="#bbf7d0" />
                  <Text style={styles.saveLabel}>{t('review.add')}</Text>
                </View>
                <MaterialIcons name="arrow-downward" size={22} color="#64748b" style={{ alignSelf: 'center', marginVertical: 10 }} />
                <View style={styles.learnPreview}>
                  <MaterialIcons name="school" size={26} color="#22d3ee" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.learnLabel}>{t('tabs.learn')}</Text>
                    <Text style={styles.learnHint}>{t('dramasTour.savedCollection')}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.demo}>
                <Text style={styles.demoLabel}>{t('dramasTour.subtitleExample')}</Text>
                <View style={styles.words}>
                  {example.trim().split(/\s+/).map((word, index) => {
                    const selected = mode === 'all' || index < (mode === 'phrase' ? 3 : 1);
                    return <Text key={index} style={[styles.word, selected && styles.selectedWord]}>{word}</Text>;
                  })}
                </View>
                <View style={styles.modes} accessibilityRole="radiogroup">
                  {MODES.map(value => (
                    <Pressable key={value} onPress={() => setMode(value)} accessibilityRole="radio" accessibilityState={{ checked: mode === value }} style={[styles.mode, mode === value && styles.activeMode]}>
                      <Text style={[styles.modeLabel, mode === value && styles.activeModeLabel]}>{t(`dramasTour.${value}`)}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text accessibilityLiveRegion="polite" style={styles.instruction}>{t(`dramasTour.${mode}Hint`)}</Text>
                {mode === 'all' ? <View style={styles.translatePreview}><MaterialIcons name="translate" size={18} color="#86efac" /><Text style={styles.translateLabel}>{t('subtitles.translateAll')}</Text></View> : null}
              </View>
            )}

            <Pressable
              onPress={welcome ? onDismiss : saving ? (onTry || onDismiss) : () => setStep(1)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.primary, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.primaryLabel}>{t(welcome ? 'dramasTour.explore' : saving ? 'dramasTour.tryIt' : 'dramasTour.next')}</Text>
              <MaterialIcons name={welcome ? 'play-arrow' : saving ? 'touch-app' : 'arrow-forward'} size={21} color="#062331" />
            </Pressable>
            {!welcome ? <View style={styles.footer}>
              <Pressable onPress={step === 0 ? onDismiss : () => setStep(0)} accessibilityRole="button" style={styles.secondary}>
                <Text style={styles.secondaryLabel}>{t(step === 0 ? 'dramasTour.skip' : 'common.back')}</Text>
              </Pressable>
              <View style={styles.dots} accessible={false}>{[0, 1].map(index => <View key={index} style={[styles.dot, index === step && styles.activeDot]} />)}</View>
            </View> : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Feature({ icon, label }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string }) {
  return <View style={styles.feature}><MaterialIcons name={icon} size={20} color="#67e8f9" /><Text style={styles.featureLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(2, 6, 16, 0.84)' },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 420, padding: 24, borderRadius: 28, borderWidth: 1, borderColor: '#284052', backgroundColor: '#101e30' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  eyebrow: { flex: 1, color: '#67e8f9', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10, marginTop: -10 },
  luviRow: { alignItems: 'center', marginTop: 4, marginBottom: 18 },
  luviHalo: { width: 122, height: 122, borderRadius: 61, backgroundColor: '#173749', alignItems: 'center', justifyContent: 'center' },
  smallHalo: { width: 76, height: 76 },
  luvi: { width: 112, height: 112 },
  smallLuvi: { width: 70, height: 70 },
  fromLuvi: { marginTop: 8, color: '#a5b9cc', fontSize: 12, fontWeight: '700' },
  title: { color: '#f8fafc', fontSize: 27, lineHeight: 33, fontWeight: '900', textAlign: 'center' },
  description: { color: '#bdcddd', fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: 12 },
  features: { marginTop: 22, gap: 12 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureLabel: { flex: 1, color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  demo: { marginTop: 20, padding: 16, borderRadius: 18, backgroundColor: '#091422', borderWidth: 1, borderColor: '#24374c' },
  demoLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textAlign: 'center', marginBottom: 14 },
  words: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
  word: { maxWidth: '100%', color: '#f8fafc', fontSize: 18, lineHeight: 28, fontWeight: '800', paddingHorizontal: 4, borderRadius: 5 },
  selectedWord: { backgroundColor: '#a5f3fc', color: '#164e63' },
  modes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 18 },
  mode: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#18283b', borderWidth: 1, borderColor: '#304256' },
  activeMode: { backgroundColor: '#123b4c', borderColor: '#22d3ee' },
  modeLabel: { color: '#a5b9cc', fontSize: 12, fontWeight: '700' },
  activeModeLabel: { color: '#a5f3fc' },
  instruction: { color: '#cbd5e1', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 12 },
  translatePreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
  translateLabel: { color: '#86efac', fontWeight: '700', flexShrink: 1 },
  savePreview: { borderRadius: 18, backgroundColor: '#14532d', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 8 },
  saveLabel: { color: '#f0fdf4', fontWeight: '800', fontSize: 13, flexShrink: 1 },
  learnPreview: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: '#123044' },
  learnLabel: { color: '#e0f2fe', fontSize: 15, fontWeight: '800' },
  learnHint: { color: '#a5b9cc', fontSize: 12, lineHeight: 18, marginTop: 3 },
  primary: { minHeight: 52, padding: 14, borderRadius: 16, backgroundColor: '#67e8f9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  primaryLabel: { color: '#062331', fontSize: 15, fontWeight: '900', flexShrink: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  secondary: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  secondaryLabel: { color: '#a5b9cc', fontSize: 13, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#415269' },
  activeDot: { width: 18, backgroundColor: '#67e8f9' },
});
