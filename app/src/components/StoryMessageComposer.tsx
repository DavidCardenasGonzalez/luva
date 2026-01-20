import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
    <View
      style={{
        paddingHorizontal: 12,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: statusLabel ? 8 : 12,
        backgroundColor: '#f8fafc',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
      }}
    >
      {statusLabel ? <Text style={{ color: '#475569', marginBottom: 8 }}>{statusLabel}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'white',
            borderRadius: 999,
            borderWidth: 1,
            borderColor: '#dbeafe',
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escribe tu mensaje..."
            placeholderTextColor="#94a3b8"
            multiline
            style={{
              flex: 1,
              paddingVertical: 0,
              paddingRight: 8,
              color: '#0f172a',
              maxHeight: 120,
            }}
            onSubmitEditing={handleSendPress}
            blurOnSubmit={false}
            returnKeyType="send"
          />
          <Pressable
            disabled={sendDisabled}
            onPress={handleSendPress}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: sendDisabled ? '#e2e8f0' : pressed ? '#2563eb' : '#3b82f6',
            })}
          >
            <Text style={{ color: sendDisabled ? '#94a3b8' : 'white', fontWeight: '700' }}>➤</Text>
          </Pressable>
        </View>
        <Pressable
          onPressIn={!recordDisabled ? onRecordPressIn : undefined}
          onPressOut={!recordDisabled ? onRecordRelease : undefined}
          disabled={recordDisabled}
          style={({ pressed }) => ({
            marginLeft: 10,
            width: 52,
            height: 52,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: retryBlocked
              ? '#cbd5f5'
              : flowState === 'recording'
              ? '#dc2626'
              : pressed
              ? '#059669'
              : '#10b981',
          })}
        >
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>
            {flowState === 'recording' ? 'REC' : '🎤'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
