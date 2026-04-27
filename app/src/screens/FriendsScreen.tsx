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
import { useAuth } from '../auth/AuthProvider';
import { FriendCharacter, useFriends } from '../hooks/useFriends';
import { getChatAvatar } from '../chatimages/chatAvatarMap';

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
      : getChatAvatar(friend.missionId);
  }, [friend.avatarImageUrl, friend.missionId]);
  const initial = (friend.characterName.trim().charAt(0) || '?').toUpperCase();
  const lastActivity = friend.lastMessageAt || friend.updatedAt;
  const conversationCount = friend.conversationCount ?? 0;
  const messageCount = friend.messageCount ?? 0;

  return (
    <View
      style={{
        padding: 16,
        borderRadius: 18,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            overflow: 'hidden',
            backgroundColor: '#0b172b',
            borderWidth: 1,
            borderColor: 'rgba(226, 232, 240, 0.16)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {avatarSource ? (
            <Image source={avatarSource} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: '900' }}>{initial}</Text>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 14, minWidth: 0 }}>
          <Text style={{ color: '#a5f3fc', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>
            Amigo
          </Text>
          <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '900', marginTop: 4 }} numberOfLines={1}>
            {friend.characterName}
          </Text>
          <Text style={{ color: COLORS.muted, marginTop: 4 }} numberOfLines={1}>
            {friend.missionTitle}
          </Text>
        </View>
      </View>

      {friend.sceneSummary ? (
        <Text style={{ color: '#cbd5e1', lineHeight: 21, marginTop: 14 }} numberOfLines={3}>
          {friend.sceneSummary}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <View
          style={{
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: '#0b172b',
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text style={{ color: COLORS.text, fontWeight: '900', fontSize: 18 }}>{conversationCount}</Text>
          <Text style={{ color: COLORS.muted, marginTop: 2, fontSize: 12 }}>Conversaciones</Text>
        </View>
        <View
          style={{
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: '#0b172b',
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text style={{ color: COLORS.text, fontWeight: '900', fontSize: 18 }}>{messageCount}</Text>
          <Text style={{ color: COLORS.muted, marginTop: 2, fontSize: 12 }}>Mensajes</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: COLORS.muted, fontSize: 12 }} numberOfLines={1}>
            Última actividad: {new Date(lastActivity).toLocaleDateString()}
          </Text>
          <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
            {friend.storyTitle}
          </Text>
        </View>
        <Pressable
          onPress={() => onOpenProfile(friend)}
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil de ${friend.characterName}`}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: pressed ? '#111827' : '#0b172b',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 10,
          })}
        >
          <MaterialIcons name="person-outline" size={20} color={COLORS.text} />
        </Pressable>
        <Pressable
          onPress={() => onOpenChat(friend)}
          accessibilityRole="button"
          accessibilityLabel={`Conversar con ${friend.characterName}`}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 11,
            borderRadius: 12,
            backgroundColor: pressed ? '#1d4ed8' : COLORS.action,
            marginLeft: 12,
          })}
        >
          <MaterialIcons name="chat-bubble-outline" size={18} color="white" />
          <Text style={{ color: 'white', fontWeight: '900', marginLeft: 6 }}>Conversar</Text>
        </Pressable>
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
      navigation.navigate('FriendChat', { friendId: friend.friendId });
    },
    [navigation]
  );

  const handleOpenProfile = useCallback(
    (friend: FriendCharacter) => {
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
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>
            Amigos
          </Text>
          <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '900', marginTop: 6 }}>
            Tus personajes favoritos
          </Text>
          <Text style={{ color: COLORS.muted, lineHeight: 21, marginTop: 8 }}>
            Agrega personajes al completar misiones y vuelve a practicar inglés con conversaciones libres.
          </Text>
        </View>

        {!isSignedIn ? (
          <AccountProgressCard
            mode="signed-out"
            onCreateAccount={handleCreateAccount}
          />
        ) : loading ? (
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
              Aún no tienes amigos.
            </Text>
            <Text style={{ color: COLORS.muted, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
              Termina una misión y toca “Agregar a amigos” para desbloquear una conversación libre.
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
      </ScrollView>
      <AppTabBar active="friends" />
    </SafeAreaView>
  );
}
