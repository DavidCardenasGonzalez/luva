import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  buildLocalFriendConversationTitle,
  listLocalFriendConversationsForFriend,
  LocalFriendConversationSnapshot,
} from '../friends/localFriendConversations';
import { getLocalFriend } from '../friends/localFriends';

type Props = NativeStackScreenProps<RootStackParamList, 'FriendConversationHistory'>;

const COLORS = {
  background: '#0b1224',
  surface: '#0f172a',
  border: '#1f2937',
  text: '#e2e8f0',
  muted: '#94a3b8',
  action: '#2563eb',
  lightBackground: '#f8fafc',
  lightText: '#0f172a',
  lightMuted: '#64748b',
  lightBorder: '#e2e8f0',
};

function formatConversationDate(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return '';
  return new Date(value).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function conversationPreview(conversation: LocalFriendConversationSnapshot) {
  const lastMessage = [...conversation.messages].reverse().find((message) => message.text.trim());
  if (lastMessage?.text.trim()) {
    return lastMessage.text.trim();
  }
  return conversation.messages.some((message) => message.imageUri || message.imageUrl)
    ? 'Incluye foto'
    : 'Sin vista previa';
}

export default function FriendConversationHistoryScreen({ navigation, route }: Props) {
  const friendId = route.params.friendId;
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 48);
  const [friendName, setFriendName] = useState(route.params.friendName || 'este amigo');
  const [conversations, setConversations] = useState<LocalFriendConversationSnapshot[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<LocalFriendConversationSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [localFriend, localConversations] = await Promise.all([
        getLocalFriend(friendId),
        listLocalFriendConversationsForFriend(friendId),
      ]);
      setFriendName(localFriend?.characterName || route.params.friendName || 'este amigo');
      setConversations(localConversations);
    } finally {
      setLoading(false);
    }
  }, [friendId, route.params.friendName]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  const selectedTitle = useMemo(() => {
    return selectedConversation
      ? buildLocalFriendConversationTitle(selectedConversation, friendName)
      : '';
  }, [friendName, selectedConversation]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: topInset + 10,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? '#111827' : COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
          })}
        >
          <MaterialIcons name="arrow-back" size={20} color={COLORS.text} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: COLORS.text, fontWeight: '900', fontSize: 18 }} numberOfLines={1}>
            Recuerdos
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
            Guardados en este teléfono
          </Text>
        </View>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.conversationKey}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(insets.bottom, 18) + 20,
          gap: 10,
        }}
        ListHeaderComponent={
          <View style={{ paddingBottom: 8 }}>
            <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '900' }} numberOfLines={1}>
              {friendName}
            </Text>
            <Text style={{ color: COLORS.muted, lineHeight: 20, marginTop: 6 }}>
              Aquí se guardan las charlas de este teléfono. Las estadísticas de amistad se sincronizan con tu cuenta.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View
            style={{
              marginTop: 24,
              padding: 22,
              borderRadius: 14,
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
              alignItems: 'center',
            }}
          >
            {loading ? (
              <ActivityIndicator color="#22d3ee" />
            ) : (
              <>
                <MaterialIcons name="auto-stories" size={34} color={COLORS.muted} />
                <Text style={{ color: COLORS.text, fontWeight: '900', marginTop: 12 }}>
                  Aún no hay recuerdos
                </Text>
                <Text style={{ color: COLORS.muted, textAlign: 'center', lineHeight: 20, marginTop: 6 }}>
                  Termina una charla y aparecerá aquí para revisarla después.
                </Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const title = buildLocalFriendConversationTitle(item, friendName);
          const userMessageCount = item.messages.filter((message) => message.role === 'user').length;
          return (
            <Pressable
              onPress={() => setSelectedConversation(item)}
              accessibilityRole="button"
              accessibilityLabel={`Abrir recuerdo ${title}`}
              style={({ pressed }) => ({
                padding: 14,
                borderRadius: 14,
                backgroundColor: pressed ? '#111827' : COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: item.conversationEnded ? '#064e3b' : '#1e3a8a',
                  }}
                >
                  <MaterialIcons
                    name={item.conversationEnded ? 'check-circle' : 'chat-bubble-outline'}
                    size={20}
                    color="white"
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: COLORS.text, fontWeight: '900', fontSize: 15 }} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={{ color: COLORS.muted, marginTop: 3, fontSize: 12 }} numberOfLines={1}>
                    {formatConversationDate(item.endedAt || item.updatedAt)}
                    {userMessageCount ? ` · ${userMessageCount} mensaje${userMessageCount === 1 ? '' : 's'}` : ''}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={COLORS.muted} />
              </View>
              <Text style={{ color: COLORS.muted, lineHeight: 19, marginTop: 10 }} numberOfLines={2}>
                {conversationPreview(item)}
              </Text>
            </Pressable>
          );
        }}
      />

      <Modal
        visible={!!selectedConversation}
        animationType="slide"
        onRequestClose={() => setSelectedConversation(null)}
      >
        <View style={{ flex: 1, backgroundColor: COLORS.lightBackground }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingTop: topInset + 10,
              paddingBottom: 12,
              backgroundColor: 'white',
              borderBottomWidth: 1,
              borderBottomColor: COLORS.lightBorder,
            }}
          >
            <Pressable
              onPress={() => setSelectedConversation(null)}
              hitSlop={12}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? '#f1f5f9' : 'white',
                borderWidth: 1,
                borderColor: COLORS.lightBorder,
              })}
            >
              <MaterialIcons name="close" size={20} color={COLORS.lightText} />
            </Pressable>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: COLORS.lightText, fontWeight: '900', fontSize: 16 }} numberOfLines={1}>
                {selectedTitle}
              </Text>
              <Text style={{ color: COLORS.lightMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                {formatConversationDate(selectedConversation?.endedAt || selectedConversation?.updatedAt)}
              </Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={{
              padding: 16,
              paddingBottom: Math.max(insets.bottom, 18) + 16,
              gap: 12,
            }}
          >
            {selectedConversation?.messages.map((message) => {
              const isAssistant = message.role === 'assistant';
              const imageUri = message.imageUrl || message.imageUri;
              return (
                <View
                  key={message.id}
                  style={{
                    alignSelf: isAssistant ? 'flex-start' : 'flex-end',
                    maxWidth: '84%',
                    padding: imageUri ? 8 : 12,
                    borderRadius: 16,
                    backgroundColor: isAssistant ? 'white' : COLORS.action,
                    borderWidth: isAssistant ? 1 : 0,
                    borderColor: COLORS.lightBorder,
                  }}
                >
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={{ width: 220, height: 260, borderRadius: 12, backgroundColor: '#e2e8f0' }}
                      resizeMode="cover"
                    />
                  ) : null}
                  {message.text.trim() ? (
                    <Text
                      style={{
                        color: isAssistant ? COLORS.lightText : 'white',
                        lineHeight: 20,
                        marginTop: imageUri ? 8 : 0,
                      }}
                    >
                      {message.text}
                    </Text>
                  ) : null}
                </View>
              );
            })}

            {selectedConversation?.conversationFeedback ? (
              <View
                style={{
                  marginTop: 4,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: '#f0fdf4',
                  borderWidth: 1,
                  borderColor: '#bbf7d0',
                }}
              >
                <Text style={{ color: '#166534', fontWeight: '900' }}>Feedback</Text>
                {selectedConversation.conversationFeedback.summary ? (
                  <Text style={{ color: '#166534', lineHeight: 20, marginTop: 8 }}>
                    {selectedConversation.conversationFeedback.summary}
                  </Text>
                ) : null}
                {selectedConversation.conversationFeedback.improvements.map((item, index) => (
                  <Text key={`${item}-${index}`} style={{ color: '#166534', lineHeight: 20, marginTop: 6 }}>
                    - {item}
                  </Text>
                ))}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
