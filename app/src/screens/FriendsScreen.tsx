import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import AppTabBar from '../components/AppTabBar';
import AccountProgressCard from '../components/AccountProgressCard';
import CoinCountChip from '../components/CoinCountChip';
import { useAuth } from '../auth/AuthProvider';
import { FriendCharacter, useFriends } from '../hooks/useFriends';
import { getChatAvatar } from '../chatimages/chatAvatarMap';
import { trackMixpanelFriendEvent } from '../marketing/mixpanelEvents';
import { AffinityBar } from '../components/AffinityBar';
import { getAffinityLevel } from '../friends/affinity';

type Props = NativeStackScreenProps<RootStackParamList, 'Friends'>;

const COLORS = {
  background: '#0b1224',
  surface: '#0f172a',
  border: '#1f2937',
  text: '#e2e8f0',
  muted: '#94a3b8',
  accent: '#22d3ee',
  action: '#2563eb',
};

const AFFINITY_LEVEL_COLORS: Record<number, { main: string; glow: string; bg: string }> = {
  1: { main: '#64748b', glow: 'rgba(100,116,139,0.25)', bg: 'rgba(100,116,139,0.08)' },
  2: { main: '#22d3ee', glow: 'rgba(34,211,238,0.28)', bg: 'rgba(34,211,238,0.08)' },
  3: { main: '#a78bfa', glow: 'rgba(167,139,250,0.28)', bg: 'rgba(167,139,250,0.08)' },
  4: { main: '#fbbf24', glow: 'rgba(251,191,36,0.28)', bg: 'rgba(251,191,36,0.08)' },
  5: { main: '#f472b6', glow: 'rgba(244,114,182,0.35)', bg: 'rgba(244,114,182,0.1)' },
};

function FriendCard({
  friend,
  onOpenChat,
  onOpenProfile,
}: {
  friend: FriendCharacter;
  onOpenChat: (friend: FriendCharacter) => void;
  onOpenProfile: (friend: FriendCharacter) => void;
}) {
  const avatarSource = useMemo<ImageSourcePropType | undefined>(() => {
    return friend.avatarImageUrl?.trim()
      ? { uri: friend.avatarImageUrl }
      : getChatAvatar(friend.friendId);
  }, [friend.avatarImageUrl, friend.friendId]);

  const initial = (friend.characterName.trim().charAt(0) || '?').toUpperCase();
  const conversationCount = friend.conversationCount ?? 0;
  const messageCount = friend.messageCount ?? 0;
  const affinityPoints = friend.affinityPoints ?? 0;
  const affinityLevel = getAffinityLevel(affinityPoints);
  const levelColors = AFFINITY_LEVEL_COLORS[affinityLevel.level] ?? AFFINITY_LEVEL_COLORS[1];

  return (
    <View
      style={{
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        shadowColor: levelColors.main,
        shadowOpacity: 0.18,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      {/* Accent top strip colored by affinity level */}
      <View style={{ height: 3, backgroundColor: levelColors.main }} />

      <View style={{ padding: 16 }}>
        {/* Header: avatar + name + role */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              overflow: 'hidden',
              backgroundColor: '#0b172b',
              borderWidth: 2.5,
              borderColor: levelColors.main,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: levelColors.main,
              shadowOpacity: 0.5,
              shadowRadius: 8,
            }}
          >
            {avatarSource ? (
              <Image source={avatarSource} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '900' }}>{initial}</Text>
            )}
          </View>

          <View style={{ flex: 1, marginLeft: 14, minWidth: 0 }}>
            {friend.aiRole ? (
              <Text style={{ color: levelColors.main, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }} numberOfLines={1}>
                {friend.aiRole}
              </Text>
            ) : null}
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '900', marginTop: friend.aiRole ? 3 : 0 }} numberOfLines={1}>
              {friend.characterName}
            </Text>

            {/* Compact stats row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="chat-bubble-outline" size={13} color={COLORS.muted} />
                <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '700' }}>
                  {conversationCount} conv.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="forum" size={13} color={COLORS.muted} />
                <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '700' }}>
                  {messageCount} msgs
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Affinity bar */}
        <View
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 14,
            backgroundColor: levelColors.bg,
            borderWidth: 1,
            borderColor: levelColors.glow,
          }}
        >
          <AffinityBar points={affinityPoints} variant="dark" />
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <Pressable
            onPress={() => onOpenProfile(friend)}
            accessibilityRole="button"
            accessibilityLabel={`Ver perfil de ${friend.characterName}`}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 11,
              borderRadius: 13,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: pressed ? '#111827' : '#0b172b',
              gap: 6,
            })}
          >
            <MaterialIcons name="person-outline" size={18} color={COLORS.muted} />
            <Text style={{ color: COLORS.muted, fontWeight: '800', fontSize: 14 }}>Perfil</Text>
          </Pressable>

          <Pressable
            onPress={() => onOpenChat(friend)}
            accessibilityRole="button"
            accessibilityLabel={`Conversar con ${friend.characterName}`}
            style={({ pressed }) => ({
              flex: 2,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              borderRadius: 13,
              backgroundColor: pressed ? '#1d4ed8' : COLORS.action,
              gap: 7,
            })}
          >
            <MaterialIcons name="chat-bubble-outline" size={18} color="white" />
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>Conversar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function FriendsScreen({ navigation }: Props) {
  const { isSignedIn } = useAuth();
  const { friends, loading, error, reload } = useFriends();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  const handleCreateAccount = useCallback((prefillEmail?: string) => {
    navigation.navigate('EmailSignUp', { prefillEmail });
  }, [navigation]);

  const handleOpenFriend = useCallback(
    (friend: FriendCharacter) => {
      void trackMixpanelFriendEvent('friend_chat_opened', {
        friend_id: friend.friendId,
        character_id: friend.friendId,
        character_name: friend.characterName,
        source: 'friends',
      });
      navigation.navigate('FriendChat', { friendId: friend.friendId });
    },
    [navigation]
  );

  const handleOpenProfile = useCallback(
    (friend: FriendCharacter) => {
      void trackMixpanelFriendEvent('friend_profile_opened', {
        friend_id: friend.friendId,
        character_id: friend.friendId,
        character_name: friend.characterName,
        source: 'friends',
      });
      navigation.navigate('FriendProfile', { friendId: friend.friendId });
    },
    [navigation]
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 128 }}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 58,
            marginBottom: 16,
            position: 'relative',
          }}
        >
          <CoinCountChip style={{ position: 'absolute', left: 0, top: 6 }} />
          <Image
            source={require('../image/logo.png')}
            style={{ width: 180, height: 48, resizeMode: 'contain' }}
          />
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            hitSlop={12}
            style={({ pressed }) => ({
              position: 'absolute',
              right: 0,
              top: 7,
              opacity: pressed ? 0.8 : 1,
              padding: 6,
            })}
          >
            <MaterialIcons name="settings" size={26} color="#cbd5e1" />
          </Pressable>
        </View>

        <View
          style={{
            padding: 18,
            borderRadius: 20,
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialIcons name="favorite" size={16} color="#f472b6" />
            <Text style={{ color: '#f472b6', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Tus Amigos
            </Text>
          </View>
          <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: '900', marginTop: 6 }}>
            Personajes disponibles
          </Text>
          <Text style={{ color: COLORS.muted, lineHeight: 21, marginTop: 6, fontSize: 14 }}>
            Sube tu nivel de afinidad hablando con ellos para desbloquear nuevas conversaciones.
          </Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={{ color: COLORS.muted, marginTop: 10 }}>Cargando amigos...</Text>
          </View>
        ) : error ? (
          <View
            style={{
              padding: 14,
              borderRadius: 14,
              backgroundColor: '#3f1d2e',
              borderWidth: 1,
              borderColor: '#7f1d1d',
            }}
          >
            <Text style={{ color: '#fecdd3', fontWeight: '700' }}>{error}</Text>
            <Pressable
              onPress={() => void reload()}
              style={({ pressed }) => ({
                marginTop: 12,
                paddingVertical: 11,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: pressed ? '#0f172a' : '#1f2937',
              })}
            >
              <Text style={{ color: COLORS.text, fontWeight: '800' }}>Reintentar</Text>
            </Pressable>
          </View>
        ) : friends.length ? (
          <View style={{ gap: 14 }}>
            {friends.map((friend) => (
              <FriendCard
                key={friend.friendId}
                friend={friend}
                onOpenChat={handleOpenFriend}
                onOpenProfile={handleOpenProfile}
              />
            ))}
          </View>
        ) : (
          <View
            style={{
              padding: 18,
              borderRadius: 16,
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: COLORS.text, fontWeight: '900', textAlign: 'center' }}>
              No encontramos personajes.
            </Text>
            <Text style={{ color: COLORS.muted, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
              Intenta recargar el catálogo para iniciar una conversación libre.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('Feed')}
              style={({ pressed }) => ({
                marginTop: 14,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: pressed ? '#1d4ed8' : COLORS.action,
              })}
            >
              <Text style={{ color: 'white', fontWeight: '900' }}>Ir al feed</Text>
            </Pressable>
          </View>
        )}

        {!isSignedIn ? (
          <View style={{ marginTop: 16 }}>
            <AccountProgressCard
              mode="signed-out"
              onCreateAccount={handleCreateAccount}
            />
          </View>
        ) : null}
      </ScrollView>
      <AppTabBar active="friends" />
    </SafeAreaView>
  );
}
