import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';

export type StoryFlowState = 'idle' | 'recording' | 'uploading' | 'transcribing' | 'evaluating';

type Props = {
  flowState: StoryFlowState;
  retryBlocked: boolean;
  statusLabel: string;
  onSendText: (text: string) => Promise<boolean>;
  onRecordPressIn: () => void | Promise<void>;
  onRecordRelease: () => void | Promise<void>;
};

export default function StoryMessageComposer({
  flowState,
  retryBlocked,
  statusLabel,
  onSendText,
  onRecordPressIn,
  onRecordRelease,
}: Props) {
  const [text, setText] = useState('');

  const handleSendPress = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const success = await onSendText(trimmed);
    if (success) {
      setText('');
    }
  }, [onSendText, text]);

  const sendDisabled = flowState !== 'idle' || retryBlocked || !text.trim().length;
  const recordDisabled = retryBlocked || (flowState !== 'idle' && flowState !== 'recording');

  return (
    <View style={{ marginTop: 24 }}>
      <View
        style={{
          padding: 16,
          backgroundColor: 'white',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e2e8f0',
        }}
      >
        <Text style={{ fontWeight: '600', color: '#1e293b', marginBottom: 8 }}>Escribe tu mensaje (opcional)</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Escribe aquí tu intervención..."
          multiline
          style={{
            borderWidth: 1,
            borderColor: '#cbd5f5',
            borderRadius: 10,
            padding: 12,
            minHeight: 60,
            backgroundColor: '#f8fafc',
            textAlignVertical: 'top',
          }}
        />
        <Pressable
          disabled={sendDisabled}
          onPress={handleSendPress}
          style={({ pressed }) => ({
            marginTop: 12,
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center',
            backgroundColor: sendDisabled ? '#cbd5f5' : pressed ? '#2563eb' : '#3b82f6',
          })}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>Enviar texto</Text>
        </Pressable>
      </View>

      <View
        style={{
          marginTop: 16,
          padding: 16,
          backgroundColor: 'white',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e2e8f0',
        }}
      >
        <Text style={{ fontWeight: '600', color: '#1e293b', marginBottom: 8 }}>Grabar mensaje</Text>
        <Pressable
          onPressIn={flowState === 'idle' && !retryBlocked ? onRecordPressIn : undefined}
          onPressOut={onRecordRelease}
          disabled={recordDisabled}
          style={({ pressed }) => ({
            paddingVertical: 14,
            borderRadius: 999,
            alignItems: 'center',
            backgroundColor: retryBlocked
              ? '#cbd5f5'
              : flowState === 'recording'
              ? '#dc2626'
              : pressed
              ? '#7c3aed'
              : flowState === 'idle'
              ? '#8b5cf6'
              : '#cbd5f5',
          })}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>
            {flowState === 'recording' ? 'Suelta para finalizar' : 'Mantén presionado para grabar'}
          </Text>
        </Pressable>
        {statusLabel ? <Text style={{ marginTop: 8, color: '#475569' }}>{statusLabel}</Text> : null}
      </View>
    </View>
  );
}
