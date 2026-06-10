import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

export type StoryFlowState = 'idle' | 'recording' | 'uploading' | 'transcribing' | 'evaluating' | 'generatingImage';

type Props = {
  flowState: StoryFlowState;
  retryBlocked: boolean;
  recordBlocked?: boolean;
  statusLabel: string;
  onSendText: (text: string) => Promise<boolean>;
  onRecordPressIn: () => void | Promise<void>;
  onRecordRelease: () => void | Promise<void>;
  onPlusPress?: () => void;
  photoRequestMode?: boolean;
};

export default function StoryMessageComposer({
  flowState,
  retryBlocked,
  recordBlocked,
  statusLabel,
  onSendText,
  onRecordPressIn,
  onRecordRelease,
  onPlusPress,
  photoRequestMode,
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
    // Limpia el input tan pronto como intentamos enviar; si falla, restauramos el texto.
    setText('');
    const success = await onSendText(trimmed);
    if (!success) {
      setText(trimmed);
    }
  }, [onSendText, text]);

  const sendDisabled = flowState !== 'idle' || retryBlocked || !text.trim().length;
  const micBlocked = recordBlocked ?? retryBlocked;
  // While actively recording we must keep release enabled to avoid a stuck recording state.
  const recordDisabled = flowState === 'recording' ? false : micBlocked || flowState !== 'idle';

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
      {/* {statusLabel ? <Text style={{ color: '#475569', marginBottom: 8 }}>{statusLabel}</Text> : null} */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={onPlusPress}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 38,
            height: 38,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
            backgroundColor: pressed ? '#e2e8f0' : '#f1f5f9',
          })}
        >
          <MaterialIcons name="add" size={22} color="#475569" />
        </Pressable>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'white',
            borderRadius: 999,
            borderWidth: 1,
            borderColor: photoRequestMode ? '#93c5fd' : '#dbeafe',
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
        >
          {photoRequestMode ? (
            <MaterialIcons
              name="photo-camera"
              size={19}
              color="#2563eb"
              style={{ marginRight: 8 }}
            />
          ) : null}
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={photoRequestMode ? 'Describe la foto...' : 'Escribe tu mensaje...'}
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
            backgroundColor: flowState === 'recording'
              ? '#dc2626'
              : micBlocked
              ? '#cbd5f5'
              : pressed
              ? '#059669'
              : '#10b981',
          })}
        >
          <MaterialIcons
            name={flowState === 'recording' ? 'mic' : 'mic'}
            size={24}
            color="white"
          />
        </Pressable>
      </View>
    </View>
  );
}
