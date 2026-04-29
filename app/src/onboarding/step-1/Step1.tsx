import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { OnboardingStepContent } from '../model/types';
import { GradientText } from '../components/GradientText';

const luviSayingHi = require('../../image/luvi-saying-hi.gif');
const logoImage = require('../../image/logo.png');
const CONVERSATION_GIF_OVERLAP = 76;

const COLORS = {
  background: '#07111f',
  surface: '#ffffff',
  text: '#f8fafc',
  muted: '#cbd5e1',
  cyan: '#22d3ee',
  yellow: '#facc15',
  learnerBubble: '#c7d2fe',
  luviBubble: '#ffffff',
};

export default function Step1({ content }: { content: OnboardingStepContent }) {
  const { height, width } = useWindowDimensions();
  const floatProgress = useRef(new Animated.Value(0)).current;
  const [visibleMessageIds, setVisibleMessageIds] = useState<string[]>([]);
  const messages = useMemo(() => content.conversation || [], [content.conversation]);
  const showLargeScreenTitle = height >= 880 || width >= 420;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatProgress, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(floatProgress, {
          toValue: 0,
          duration: 1300,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [floatProgress]);

  useEffect(() => {
    setVisibleMessageIds([]);
    const timers = messages.map((message) =>
      setTimeout(() => {
        setVisibleMessageIds((current) =>
          current.includes(message.id) ? current : [...current, message.id]
        );
      }, message.delayMs)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [messages]);

  const mascotTranslateY = floatProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <View style={{ alignItems: 'center', paddingHorizontal: 22 }}>
        <Image
          source={logoImage}
          resizeMode="contain"
          style={{ width: 112, height: 48 }}
          accessibilityLabel="Luva"
        />
        {showLargeScreenTitle ? (
          <Text
            style={{
              color: COLORS.text,
              fontSize: 32,
              fontWeight: '900',
              marginTop: 18,
              textAlign: 'center',
              lineHeight: 38,
            }}
          >
            Bienvenido a{' '}
            <GradientText style={{ fontSize: 32, fontWeight: '900', lineHeight: 38 }}>
              Luva
            </GradientText>
          </Text>
        ) : null}
        <Text
          style={{
            color: COLORS.muted,
            fontSize: 18,
            lineHeight: 25,
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          Tu compañero para{' '}
          <GradientText style={{ fontSize: 18, fontWeight: '900', lineHeight: 25 }}>
            hablar
          </GradientText>
          ,{' '}
          <GradientText style={{ fontSize: 18, fontWeight: '900', lineHeight: 25 }}>
            aprender
          </GradientText>
          {' y '}
          <GradientText style={{ fontSize: 18, fontWeight: '900', lineHeight: 25 }}>
            crecer
          </GradientText>
          {' en inglés.'}
        </Text>
      </View>

      <View style={{ alignItems: 'center', marginTop: 4, marginBottom: -CONVERSATION_GIF_OVERLAP }}>
        <MaterialIcons
          name="auto-awesome"
          size={18}
          color={COLORS.yellow}
          style={{ position: 'absolute', right: 82, top: 22 }}
        />
        <MaterialIcons
          name="auto-awesome"
          size={17}
          color={COLORS.cyan}
          style={{ position: 'absolute', left: 78, top: 92 }}
        />
        <MaterialIcons
          name="auto-awesome"
          size={18}
          color={COLORS.cyan}
          style={{ position: 'absolute', right: 58, top: 110 }}
        />
        <Animated.View style={{ transform: [{ translateY: mascotTranslateY }] }}>
          <Image
            source={luviSayingHi}
            resizeMode="contain"
            style={{ width: 238, height: 218 }}
            accessibilityLabel="Luvi saludando"
          />
        </Animated.View>
      </View>

      <View
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          borderRadius: 26,
          marginHorizontal: 20,
          marginTop: 0,
          padding: 15,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 18,
        }}
      >
        {messages.map((message) => {
          const isVisible = visibleMessageIds.includes(message.id);
          if (!isVisible) {
            return <View key={message.id} style={{ minHeight: message.role === 'feedback' ? 82 : 62 }} />;
          }

          if (message.role === 'feedback') {
            const [headline, ...details] = message.text.split('\n');
            return (
              <View
                key={message.id}
                style={{
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  padding: 14,
                  marginTop: 12,
                  backgroundColor: '#ffffff',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: '#10b981',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons name="check" size={15} color="#ffffff" />
                  </View>
                  <Text style={{ color: '#0f172a', fontWeight: '900' }}>{headline}</Text>
                </View>
                {details.map((line) => {
                  const isSuggestionHeading = line.toLowerCase().includes('reformulaciones');
                  const isSuggestion = line.trim().startsWith('-');

                  return (
                    <Text
                      key={line}
                      style={{
                        color: isSuggestionHeading ? '#2563eb' : isSuggestion ? '#0f172a' : '#16a34a',
                        fontSize: isSuggestion ? 13 : 14,
                        fontWeight: isSuggestionHeading ? '800' : '500',
                        marginTop: isSuggestion ? 4 : 7,
                        lineHeight: 19,
                      }}
                    >
                      {line}
                    </Text>
                  );
                })}
              </View>
            );
          }

          const isLearner = message.role === 'learner';
          return (
            <View
              key={message.id}
              style={{
                alignSelf: isLearner ? 'flex-end' : 'flex-start',
                width: isLearner ? undefined : '100%',
                maxWidth: isLearner ? '76%' : '100%',
                borderRadius: 18,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginTop: isLearner ? 0 : 12,
                backgroundColor: isLearner ? COLORS.learnerBubble : COLORS.luviBubble,
                borderWidth: isLearner ? 0 : 1,
                borderColor: '#e2e8f0',
              }}
            >
              {isLearner ? (
                <Text style={{ color: '#0f172a', fontSize: 15, lineHeight: 21 }}>
                  {message.text}
                </Text>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
                  <Text style={{ color: '#0f172a', flex: 1, fontSize: 15, lineHeight: 21 }}>
                    {message.text}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: '#eff6ff',
                        borderWidth: 1,
                        borderColor: '#dbeafe',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialIcons name="volume-up" size={18} color="#2563eb" />
                    </View>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: '#ecfdf5',
                        borderWidth: 1,
                        borderColor: '#bbf7d0',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialIcons name="translate" size={17} color="#16a34a" />
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={{ alignItems: 'center', paddingHorizontal: 30, marginTop: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              borderWidth: 1,
              borderColor: 'rgba(34, 211, 238, 0.4)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="flash-on" size={24} color={COLORS.yellow} />
          </View>
          <Text style={{ color: COLORS.text, flex: 1, fontSize: 15, lineHeight: 21 }}>
            <GradientText style={{ fontSize: 15, fontWeight: '900', lineHeight: 21 }}>
              {content.eyebrow}
            </GradientText>
            {' mientras platicas con tu nuevo amigo.'}
          </Text>
        </View>
      </View>
    </View>
  );
}
