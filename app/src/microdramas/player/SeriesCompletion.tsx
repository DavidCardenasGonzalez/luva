import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../i18n/LanguageProvider';
import type { MicrodramaSeries } from '../types';

type Props = {
  series: MicrodramaSeries;
  bottomInsetExtra: number;
  onTalk: (characterId: string) => void;
  onReplay: () => void;
  onBack?: () => void;
};

export default function SeriesCompletion({ series, bottomInsetExtra, onTalk, onReplay, onBack }: Props) {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        {onBack ? <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('common.back')} style={styles.back}>
          <MaterialIcons name="arrow-back" size={26} color="white" />
        </Pressable> : null}
        <Text style={styles.seriesTitle}>{series.title}</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 24 + bottomInsetExtra }]}>
        <View style={styles.check}><MaterialIcons name="check" size={30} color="#67e8f9" /></View>
        <Text style={styles.eyebrow}>{t('microdrama.completed')}</Text>
        <Text accessibilityRole="header" style={styles.title}>{t('microdrama.completionTitle')}</Text>
        <Text style={styles.description}>{t(series.chatCharacters.length ? 'microdrama.completionDescription' : 'microdrama.completionEmpty')}</Text>
        <View style={styles.characters}>
          {series.chatCharacters.map(character => {
            const avatar = character.avatarMdUrl || character.avatarUrl || character.avatarXsUrl;
            const label = t('microdrama.talkTo', { name: character.name });
            return <View key={character.characterId} style={styles.card}>
              {avatar ? <Image source={{ uri: avatar }} style={styles.portrait} resizeMode="cover" /> : <View style={[styles.portrait, styles.placeholder]}><MaterialIcons name="person" size={64} color="#94a3b8" /></View>}
              <View style={styles.cardContent}>
                <Text style={styles.name}>{character.name}</Text>
                <Pressable onPress={() => onTalk(character.characterId)} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.talkButton, pressed && styles.pressed]}>
                  <MaterialIcons name="chat-bubble-outline" size={18} color="#083344" />
                  <Text style={styles.talkLabel}>{label}</Text>
                </Pressable>
              </View>
            </View>;
          })}
        </View>
        <Pressable onPress={onReplay} accessibilityRole="button" style={styles.replay}>
          <MaterialIcons name="replay" size={20} color="#cbd5e1" />
          <Text style={styles.replayLabel}>{t('microdrama.replaySeries')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { position: 'absolute', inset: 0, backgroundColor: '#07111f' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  back: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  seriesTitle: { flex: 1, color: '#cbd5e1', fontSize: 15, fontWeight: '600' },
  content: { paddingHorizontal: 24, paddingTop: 24, alignItems: 'center', width: '100%', maxWidth: 640, alignSelf: 'center' },
  check: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#164e63', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  eyebrow: { color: '#67e8f9', fontSize: 13, fontWeight: '800', letterSpacing: 1, textAlign: 'center', marginBottom: 10 },
  title: { color: 'white', fontSize: 30, lineHeight: 36, fontWeight: '900', textAlign: 'center' },
  description: { color: '#cbd5e1', fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 12, marginBottom: 28 },
  characters: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  card: { width: '48%', borderRadius: 20, overflow: 'hidden', backgroundColor: '#142238', borderWidth: 1, borderColor: '#26374e' },
  portrait: { width: '100%', aspectRatio: 0.85, backgroundColor: '#1e293b' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  cardContent: { padding: 12, gap: 12 },
  name: { color: 'white', fontSize: 21, fontWeight: '800', textAlign: 'center' },
  talkButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#67e8f9', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 13, minHeight: 48 },
  talkLabel: { flexShrink: 1, color: '#083344', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  pressed: { opacity: 0.75 },
  replay: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, marginTop: 24 },
  replayLabel: { color: '#cbd5e1', fontSize: 15, fontWeight: '600' },
});
