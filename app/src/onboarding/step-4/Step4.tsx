import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import type { FriendChatPayload } from '../../hooks/useFriends';
import { api } from '../../api/api';
import { sendOnboardingChatMessage } from '../model/api';
import useAudioRecorder from '../../shared/useAudioRecorder';
import useUploadToS3 from '../../shared/useUploadToS3';
import type { StoryFlowState } from '../../components/StoryMessageComposer';
import { OnboardingStepContent } from '../model/types';
import { GradientText } from '../components/GradientText';

const successSound = require('../../sound/succes_req.mp3');

const LUNA_COLOR = '#a855f7';
const LUNA_GRADIENT: [string, string] = ['#a855f7', '#c084fc'];

const COLORS = {
  background: '#07111f',
  text: '#f8fafc',
  muted: '#94a3b8',
  cyan: '#22d3ee',
  card: 'rgba(255, 255, 255, 0.06)',
  cardBorder: 'rgba(148, 163, 184, 0.18)',
  userBubble: '#5b21b6',
};

const REQUIREMENTS = [
  { id: 'name', icon: 'person', title: 'Di tu nombre', subtitle: 'Cuéntanos cómo te llamas.' },
  { id: 'why', icon: 'gps-fixed', title: 'Explica por qué quieres aprender inglés', subtitle: 'Cuéntanos tu objetivo o motivación.' },
  { id: 'about', icon: 'chat', title: 'Cuenta un poco sobre ti', subtitle: 'Tu trabajo, estudios, hobbies o rutina.' },
] as const;

type RequirementId = typeof REQUIREMENTS[number]['id'];

type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string };

function checkRequirements(messages: ChatMessage[]): Set<RequirementId> {
  const userText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.text)
    .join(' ');
  const met = new Set<RequirementId>();
  if (/my name is|i'?m |i am |me llamo|soy /i.test(userText)) met.add('name');
  if (/because|want to (learn|improve|practice)|to (learn|improve|get|work|travel)|para (aprender|mejorar|trabajar|viajar)/i.test(userText)) met.add('why');
  if (/work(ing)?|job|stud(y|ying|ent)|engineer|doctor|teach|dev|software|design|hobby|hobbies|love|like|play|sport|fitness|hiking|guitar|music|cook/i.test(userText)) met.add('about');
  return met;
}

function statusLabel(flowState: StoryFlowState): string {
  switch (flowState) {
    case 'recording': return 'Grabando...';
    case 'uploading': return 'Subiendo audio...';
    case 'transcribing': return 'Transcribiendo...';
    case 'evaluating': return 'Analizando tu inglés...';
    default: return '';
  }
}

type Props = { content: OnboardingStepContent; onNext: () => void };

export default function Step4({ content: _content, onNext }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const isStartingRecording = useRef(false);
  const stopRequestedWhileStarting = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const confettiKeyRef = useRef(0);
  const prevMetRef = useRef<Set<RequirementId>>(new Set());

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [analysis, setAnalysis] = useState<FriendChatPayload | null>(null);
  const [flowState, setFlowState] = useState<StoryFlowState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [confetti, setConfetti] = useState<{ key: number; count: number } | null>(null);
  const [missionComplete, setMissionComplete] = useState(false);

  const recorder = useAudioRecorder();
  const uploader = useUploadToS3();

  const metRequirements = checkRequirements(messages);

  // Unload sound on unmount
  useEffect(() => {
    return () => {
      const s = soundRef.current;
      if (s) {
        s.setOnPlaybackStatusUpdate(null);
        void s.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const playSuccessSound = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch { /* ignore */ }

    const prev = soundRef.current;
    if (prev) {
      prev.setOnPlaybackStatusUpdate(null);
      soundRef.current = null;
      void prev.unloadAsync().catch(() => {});
    }

    try {
      const { sound } = await Audio.Sound.createAsync(successSound, { shouldPlay: true, volume: 1 });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded || !status.didJustFinish) return;
        sound.setOnPlaybackStatusUpdate(null);
        if (soundRef.current === sound) soundRef.current = null;
        void sound.unloadAsync().catch(() => {});
      });
    } catch { /* ignore */ }
  }, []);

  // Detect newly-met requirements and trigger celebration
  useEffect(() => {
    const newly = Array.from(metRequirements).filter((id) => !prevMetRef.current.has(id));
    if (newly.length === 0) return;

    prevMetRef.current = new Set(metRequirements);
    const allMet = metRequirements.size === REQUIREMENTS.length;

    confettiKeyRef.current += 1;
    setConfetti({
      key: confettiKeyRef.current,
      count: allMet ? 280 : 140,
    });
    void playSuccessSound();

    if (allMet) setMissionComplete(true);
  }, [metRequirements, playSuccessSound]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  // Cancel recording on background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'background') return;
      if (!isStartingRecording.current && !recorder.isRecording()) return;
      isStartingRecording.current = false;
      stopRequestedWhileStarting.current = false;
      setFlowState('idle');
      void recorder.cancel().catch(() => {});
    });
    return () => {
      sub.remove();
      void recorder.cancel().catch(() => {});
    };
  }, [recorder]);

  const handleAdvance = useCallback(async (transcript: string, sessionId?: string) => {
    const trimmed = transcript.trim();
    if (!trimmed) { setFlowState('idle'); return; }

    setError(null);
    setFlowState('evaluating');

    const pendingMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', text: trimmed };
    const nextMessages = [...messages, pendingMsg];
    setMessages(nextMessages);

    const history = nextMessages.map(({ role, text }) => ({
      role: role as 'user' | 'assistant',
      content: text,
    }));

    try {
      const payload = await sendOnboardingChatMessage({ sessionId, transcript: trimmed, history } as any);
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: 'assistant', text: payload.aiReply },
      ]);
      setAnalysis(payload);
    } catch (err: any) {
      setError(err?.message || 'No pudimos continuar la conversación.');
    } finally {
      setFlowState('idle');
    }
  }, [messages]);

  const handleSendText = useCallback(async (text: string) => {
    try {
      await handleAdvance(text);
      return true;
    } catch {
      setFlowState('idle');
      return false;
    }
  }, [handleAdvance]);

  const handleRecordRelease = useCallback(async (skipStartGuard = false) => {
    try {
      if (isStartingRecording.current && !skipStartGuard) {
        stopRequestedWhileStarting.current = true;
        setFlowState('idle');
        return;
      }
      if (!recorder.isRecording()) { setFlowState('idle'); return; }

      const recording = await recorder.stop();
      setFlowState('uploading');
      const session = await api.post<{ sessionId: string; uploadUrl: string }>('/sessions/start', {});
      await uploader.put(session.uploadUrl, { uri: recording.uri }, 'audio/mp4');
      setFlowState('transcribing');
      const { transcript } = await api.post<{ transcript: string }>(`/sessions/${session.sessionId}/transcribe`);
      await handleAdvance(transcript || '', session.sessionId);
    } catch (err: any) {
      setError(err?.message || 'No pudimos procesar tu audio.');
      setFlowState('idle');
    }
  }, [handleAdvance, recorder, uploader]);

  const handleRecordPressIn = useCallback(async () => {
    try {
      const granted = await recorder.ensurePermission();
      if (!granted) { setError('Activa el permiso de micrófono para grabar.'); return; }
      setError(null);
      setFlowState('recording');
      stopRequestedWhileStarting.current = false;
      isStartingRecording.current = true;
      await recorder.start();
      isStartingRecording.current = false;
      if (stopRequestedWhileStarting.current) {
        stopRequestedWhileStarting.current = false;
        await handleRecordRelease(true);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      setError(msg === 'La grabacion se cancelo al salir de la app.' ? null : msg || 'No pudimos iniciar la grabación.');
      setFlowState('idle');
      isStartingRecording.current = false;
      stopRequestedWhileStarting.current = false;
    }
  }, [handleRecordRelease, recorder]);

  const sendDisabled = flowState !== 'idle' || !inputText.trim();
  const micDisabled = flowState === 'recording' ? false : flowState !== 'idle';

  return (
    <View style={{ flex: 1 }}>
      {/* Confetti overlay */}
      {confetti && (
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          <ConfettiCannon
            key={confetti.key}
            count={confetti.count}
            origin={{ x: windowWidth / 2, y: 0 }}
            fadeOut
            fallSpeed={2800}
            explosionSpeed={420}
            onAnimationEnd={() =>
              setConfetti((c) => (c?.key === confetti.key ? null : c))
            }
          />
        </View>
      )}
      {/* ── Header ── */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, paddingBottom: 6, minHeight: 148 }}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '800' }}>Tu primera misión</Text>
            <MaterialIcons name="gps-fixed" size={15} color={LUNA_COLOR} />
          </View>
          <Text style={{ color: COLORS.text, fontSize: 30, fontWeight: '900', lineHeight: 36 }}>
            {'Preséntate\nen '}
            <GradientText colors={LUNA_GRADIENT} style={{ fontSize: 30, fontWeight: '900', lineHeight: 36 }}>
              inglés
            </GradientText>
            {' ✨'}
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 14, lineHeight: 20, marginTop: 8 }}>
            Cuéntanos quién eres y por qué quieres aprender inglés.
          </Text>
        </View>

        {/* Luna avatar + speech bubble */}
        <View style={{ width: 126, alignItems: 'center' }}>
          <View style={{
            backgroundColor: 'rgba(10, 16, 36, 0.92)',
            borderRadius: 14, borderWidth: 1, borderColor: `${LUNA_COLOR}50`,
            paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6, alignSelf: 'flex-end',
          }}>
            <Text style={{ color: COLORS.text, fontSize: 11, fontWeight: '700', lineHeight: 16, textAlign: 'center' }}>
              {'¡Estoy emocionada\nde conocerte! 💜'}
            </Text>
          </View>
          <View style={{
            width: 104, height: 104, borderRadius: 52,
            backgroundColor: 'rgba(109, 40, 217, 0.42)',
            borderWidth: 2, borderColor: LUNA_COLOR,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <MaterialIcons name="person" size={54} color={LUNA_COLOR} />
          </View>
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, gap: 10 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Requirements card */}
        <View style={{ backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <MaterialIcons name="assignment" size={18} color={LUNA_COLOR} />
            <Text style={{ color: LUNA_COLOR, fontSize: 14, fontWeight: '900' }}>Requisitos de la misión</Text>
          </View>
          <View style={{ gap: 8 }}>
            {REQUIREMENTS.map((req) => {
              const met = metRequirements.has(req.id);
              return (
                <View key={req.id} style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 14, borderWidth: 1,
                  borderColor: met ? `${LUNA_COLOR}40` : COLORS.cardBorder,
                  padding: 12, gap: 10,
                }}>
                  <View style={{
                    width: 38, height: 38, borderRadius: 19,
                    backgroundColor: `${LUNA_COLOR}20`,
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <MaterialIcons name={req.icon as any} size={20} color={LUNA_COLOR} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: '800', lineHeight: 18 }}>{req.title}</Text>
                    <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 1, lineHeight: 16 }}>{req.subtitle}</Text>
                  </View>
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: met ? '#10b981' : 'transparent',
                    borderWidth: met ? 0 : 1.5, borderColor: 'rgba(148, 163, 184, 0.35)',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {met && <MaterialIcons name="check" size={16} color="#ffffff" />}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Chat messages ── */}
        {messages.map((msg) => (
          msg.role === 'user' ? (
            <View key={msg.id} style={{ alignItems: 'flex-end' }}>
              <View style={{
                maxWidth: '86%', backgroundColor: COLORS.userBubble,
                borderRadius: 18, borderBottomRightRadius: 4,
                paddingHorizontal: 14, paddingVertical: 12,
              }}>
                <Text style={{ color: COLORS.text, fontSize: 14, lineHeight: 21 }}>{msg.text}</Text>
              </View>
            </View>
          ) : (
            <View key={msg.id} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: `${LUNA_COLOR}22`, borderWidth: 1, borderColor: `${LUNA_COLOR}44`,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <MaterialIcons name="smart-toy" size={20} color={LUNA_COLOR} />
              </View>
              <View style={{
                backgroundColor: COLORS.card, borderRadius: 18, borderBottomLeftRadius: 4,
                borderWidth: 1, borderColor: COLORS.cardBorder,
                paddingHorizontal: 14, paddingVertical: 12, maxWidth: '78%',
              }}>
                <Text style={{ color: COLORS.text, fontSize: 14, lineHeight: 21 }}>{msg.text}</Text>
              </View>
            </View>
          )
        ))}

        {/* ── Feedback card (last analysis) ── */}
        {analysis && (
          <View style={{
            backgroundColor: COLORS.card, borderRadius: 18, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 14,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons name="auto-awesome" size={15} color={COLORS.cyan} />
                <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '900' }}>Feedback</Text>
              </View>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: `${LUNA_COLOR}20`, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="volume-up" size={17} color={LUNA_COLOR} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 90 }}>
                <Text style={{ color: COLORS.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Correctness</Text>
                <Text style={{ color: analysis.result === 'correct' ? '#10b981' : analysis.result === 'partial' ? '#f59e0b' : '#ef4444', fontSize: 34, fontWeight: '900', lineHeight: 42 }}>
                  {analysis.correctness}%
                </Text>
                <Text style={{ color: COLORS.muted, fontSize: 11, lineHeight: 15 }}>
                  {analysis.result === 'correct' ? '¡Excelente! Muy natural.' : analysis.result === 'partial' ? 'Buen intento, sigue practicando.' : 'Sigue intentándolo.'}
                </Text>
              </View>

              <View style={{ width: 1, backgroundColor: 'rgba(148, 163, 184, 0.16)' }} />

              <View style={{ flex: 1 }}>
                {analysis.errors.length > 0 && (
                  <>
                    <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '900', marginBottom: 6 }}>Errores detectados</Text>
                    {analysis.errors.map((e, i) => (
                      <Text key={i} style={{ color: COLORS.muted, fontSize: 11, lineHeight: 15, marginBottom: 4 }}>{'• '}{e}</Text>
                    ))}
                  </>
                )}
                {analysis.reformulations.length > 0 && (
                  <>
                    <Text style={{ color: LUNA_COLOR, fontSize: 12, fontWeight: '900', marginBottom: 6, marginTop: analysis.errors.length > 0 ? 8 : 0 }}>Reformulaciones sugeridas</Text>
                    {analysis.reformulations.map((r, i) => (
                      <Text key={i} style={{ color: COLORS.muted, fontSize: 11, lineHeight: 15, marginBottom: 4 }}>{'• '}{r}</Text>
                    ))}
                  </>
                )}
                {analysis.errors.length === 0 && analysis.reformulations.length === 0 && (
                  <Text style={{ color: '#10b981', fontSize: 12, lineHeight: 18 }}>Tu mensaje sonó natural. ✓</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Mission complete banner */}
        {missionComplete && (
          <View style={{
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            borderRadius: 18, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.35)',
            padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
          }}>
            <View style={{
              width: 42, height: 42, borderRadius: 21,
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <MaterialIcons name="emoji-events" size={24} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#10b981', fontSize: 15, fontWeight: '900' }}>
                ¡Misión completada! 🎉
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 13, lineHeight: 18, marginTop: 2 }}>
                Cubriste todos los requisitos. ¡Excelente presentación!
              </Text>
            </View>
          </View>
        )}

        {/* Status / error */}
        {(flowState !== 'idle' || error) && (
          <View style={{ alignItems: 'center', paddingVertical: 6 }}>
            <Text style={{ color: error ? '#ef4444' : COLORS.muted, fontSize: 13 }}>
              {error ?? statusLabel(flowState)}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Dark-themed input bar ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 12, paddingVertical: 10,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
        backgroundColor: COLORS.background,
      }}>
        {/* Text input */}
        <View style={{
          flex: 1, flexDirection: 'row', alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 22,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
          paddingHorizontal: 14, paddingVertical: 8, minHeight: 42,
        }}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Escribe tu mensaje en inglés..."
            placeholderTextColor={COLORS.muted}
            multiline
            editable={flowState === 'idle'}
            style={{ flex: 1, color: COLORS.text, fontSize: 14, maxHeight: 100, paddingVertical: 0, paddingRight: 8 }}
            onSubmitEditing={async () => {
              const t = inputText.trim();
              if (!t || sendDisabled) return;
              setInputText('');
              await handleSendText(t);
            }}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          {/* Send button */}
          <Pressable
            disabled={sendDisabled}
            onPress={async () => {
              const t = inputText.trim();
              if (!t) return;
              setInputText('');
              await handleSendText(t);
            }}
            style={({ pressed }) => ({
              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
              backgroundColor: sendDisabled ? 'rgba(255,255,255,0.08)' : pressed ? '#7c3aed' : LUNA_COLOR,
            })}
          >
            <MaterialIcons name="arrow-forward" size={18} color={sendDisabled ? COLORS.muted : '#ffffff'} />
          </Pressable>
        </View>

        {/* Mic button */}
        <Pressable
          onPressIn={!micDisabled ? handleRecordPressIn : undefined}
          onPressOut={!micDisabled ? () => void handleRecordRelease() : undefined}
          disabled={micDisabled && flowState !== 'recording'}
          style={({ pressed }) => ({
            width: 44, height: 44, borderRadius: 22,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor:
              flowState === 'recording' ? '#dc2626'
              : micDisabled ? 'rgba(255,255,255,0.08)'
              : pressed ? '#7c3aed'
              : LUNA_COLOR,
          })}
        >
          <MaterialIcons name="mic" size={22} color={micDisabled && flowState !== 'recording' ? COLORS.muted : '#ffffff'} />
        </Pressable>

        {/* Continuar (visible after first AI reply, or can always show) */}
        {messages.some((m) => m.role === 'assistant') && (
          <Pressable
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel="Continuar"
            style={({ pressed }) => ({
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: pressed ? '#1d4ed8' : '#2563eb',
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <MaterialIcons name="chevron-right" size={26} color="#ffffff" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
