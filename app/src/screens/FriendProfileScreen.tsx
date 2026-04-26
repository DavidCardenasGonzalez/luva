import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageSourcePropType,
  Modal,
  NativeTouchEvent,
  PanResponder,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import AccountProgressCard from '../components/AccountProgressCard';
import { useAuth } from '../auth/AuthProvider';
import { CharacterProfilePost, useFriendProfile } from '../hooks/useFriendProfile';
import { getChatAvatar } from '../chatimages/chatAvatarMap';

type Props = NativeStackScreenProps<RootStackParamList, 'FriendProfile'>;

const COLORS = {
  background: '#0b1224',
  surface: '#0f172a',
  border: '#1f2937',
  text: '#e2e8f0',
  muted: '#94a3b8',
  accent: '#22d3ee',
  action: '#2563eb',
};

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={{ alignItems: 'center', minWidth: 70 }}>
      <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '900' }}>{value}</Text>
      <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '700', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function getTouchDistance(touches: NativeTouchEvent[]) {
  if (touches.length < 2) {
    return 0;
  }

  const [first, second] = touches;
  const dx = first.pageX - second.pageX;
  const dy = first.pageY - second.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

function clampScale(value: number) {
  return Math.max(1, Math.min(6, value));
}

function ZoomableImage({
  uri,
  fullScreen = false,
  resizeMode = 'cover',
}: {
  uri: string;
  fullScreen?: boolean;
  resizeMode?: 'cover' | 'contain';
}) {
  const [scale, setScale] = useState(1);
  const baseScaleRef = useRef(1);
  const startDistanceRef = useRef(0);

  useEffect(() => {
    setScale(1);
    baseScaleRef.current = 1;
    startDistanceRef.current = 0;
  }, [uri]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (event) => event.nativeEvent.touches.length > 1,
        onMoveShouldSetPanResponder: (event) => event.nativeEvent.touches.length > 1,
        onPanResponderGrant: (event) => {
          startDistanceRef.current = getTouchDistance(event.nativeEvent.touches);
          baseScaleRef.current = scale;
        },
        onPanResponderMove: (event) => {
          const distance = getTouchDistance(event.nativeEvent.touches);
          if (!distance || !startDistanceRef.current) {
            return;
          }

          setScale(clampScale(baseScaleRef.current * (distance / startDistanceRef.current)));
        },
        onPanResponderRelease: () => {
          baseScaleRef.current = scale;
          startDistanceRef.current = 0;
        },
        onPanResponderTerminate: () => {
          baseScaleRef.current = scale;
          startDistanceRef.current = 0;
        },
      }),
    [scale]
  );

  return (
    <View
      {...panResponder.panHandlers}
      style={{
        width: '100%',
        ...(fullScreen ? { flex: 1 } : { aspectRatio: 1 }),
        overflow: 'hidden',
        backgroundColor: '#020617',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%', transform: [{ scale }] }}
        resizeMode={resizeMode}
      />
      {scale > 1 && (
        <Pressable
          onPress={() => {
            setScale(1);
            baseScaleRef.current = 1;
            startDistanceRef.current = 0;
          }}
          style={({ pressed }) => ({
            position: 'absolute',
            left: 12,
            top: 12,
            width: 38,
            height: 38,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? 'rgba(15, 23, 42, 0.94)' : 'rgba(15, 23, 42, 0.78)',
            borderWidth: 1,
            borderColor: 'rgba(226, 232, 240, 0.18)',
          })}
        >
          <MaterialIcons name="zoom-out-map" size={18} color={COLORS.text} />
        </Pressable>
      )}
    </View>
  );
}

export default function FriendProfileScreen({ navigation, route }: Props) {
  const friendId = route.params?.friendId;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isSignedIn } = useAuth();
  const { friend, posts, loading, loaded, error, reload } = useFriendProfile(friendId);
  const [selectedPost, setSelectedPost] = useState<CharacterProfilePost | null>(null);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  const avatarSource = useMemo<ImageSourcePropType | undefined>(() => {
    if (!friend) return undefined;
    return friend.avatarImageUrl?.trim()
      ? { uri: friend.avatarImageUrl }
      : getChatAvatar(friend.missionId);
  }, [friend]);
  const avatarInitial = (friend?.characterName.trim().charAt(0) || '?').toUpperCase();
  const avatarUri = typeof avatarSource === 'object' && avatarSource && 'uri' in avatarSource
    ? avatarSource.uri
    : undefined;
  const tileGap = 3;
  const horizontalPadding = 20;
  const tileSize = Math.floor((width - horizontalPadding * 2 - tileGap * 2) / 3);

  const handleCreateAccount = useCallback((prefillEmail?: string) => {
    navigation.navigate('EmailSignUp', { prefillEmail });
  }, [navigation]);

  if (!isSignedIn) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: COLORS.background, padding: 20 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
            marginBottom: 16,
          })}
        >
          <MaterialIcons name="arrow-back" size={20} color={COLORS.text} />
        </Pressable>
        <AccountProgressCard mode="signed-out" onCreateAccount={handleCreateAccount} />
      </SafeAreaView>
    );
  }

  if ((!loaded || loading) && !friend) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={{ color: COLORS.muted, marginTop: 10 }}>Cargando perfil...</Text>
      </View>
    );
  }

  if (error || !friend) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center', backgroundColor: COLORS.background }}>
        <Text style={{ color: '#fecdd3', textAlign: 'center', fontWeight: '800' }}>
          {error || 'No encontramos este perfil.'}
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            marginTop: 16,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: pressed ? '#1d4ed8' : COLORS.action,
          })}
        >
          <Text style={{ color: 'white', fontWeight: '900' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
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
        <Text style={{ color: COLORS.text, fontWeight: '900', fontSize: 18, marginLeft: 12, flex: 1 }} numberOfLines={1}>
          {friend.characterName}
        </Text>
        <Pressable
          onPress={() => navigation.navigate('FriendChat', { friendId: friend.friendId })}
          hitSlop={10}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? '#1d4ed8' : COLORS.action,
          })}
        >
          <MaterialIcons name="chat-bubble-outline" size={18} color="white" />
        </Pressable>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.postId}
        numColumns={3}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 18) + 20 }}
        ListHeaderComponent={
          <View>
            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable
                  onPress={() => {
                    if (avatarUri) {
                      setAvatarModalVisible(true);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver foto de perfil de ${friend.characterName}`}
                  disabled={!avatarUri}
                  style={({ pressed }) => ({
                    width: 92,
                    height: 92,
                    borderRadius: 999,
                    overflow: 'hidden',
                    backgroundColor: '#0b172b',
                    borderWidth: 2,
                    borderColor: 'rgba(34, 211, 238, 0.35)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.82 : 1,
                  })}
                >
                  {avatarSource ? (
                    <Image source={avatarSource} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: '900' }}>{avatarInitial}</Text>
                  )}
                </Pressable>

                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-around', marginLeft: 18 }}>
                  <StatBlock label="posts" value={posts.length} />
                  <StatBlock label="story" value={friend.sceneIndex + 1} />
                  <StatBlock label="chat" value="on" />
                </View>
              </View>

              <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: '900', marginTop: 16 }} numberOfLines={1}>
                {friend.characterName}
              </Text>
              <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '800', marginTop: 4 }} numberOfLines={1}>
                {friend.storyTitle}
              </Text>
              <Text style={{ color: COLORS.muted, lineHeight: 20, marginTop: 8 }}>
                {friend.sceneSummary || friend.missionTitle}
              </Text>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <Pressable
                  onPress={() => navigation.navigate('FriendChat', { friendId: friend.friendId })}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: pressed ? '#1d4ed8' : COLORS.action,
                  })}
                >
                  <Text style={{ color: 'white', fontWeight: '900' }}>Conversar</Text>
                </Pressable>
                <Pressable
                  onPress={() => void reload()}
                  disabled={loading}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    backgroundColor: pressed ? '#111827' : COLORS.surface,
                    opacity: loading ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: COLORS.text, fontWeight: '900' }}>{loading ? 'Cargando...' : 'Recargar'}</Text>
                </Pressable>
              </View>
            </View>

            <View
              style={{
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: COLORS.border,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <MaterialIcons name="grid-on" size={20} color={COLORS.accent} />
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => setSelectedPost(item)}
            style={({ pressed }) => ({
              width: tileSize,
              height: tileSize,
              marginRight: index % 3 === 2 ? 0 : tileGap,
              marginBottom: tileGap,
              opacity: pressed ? 0.82 : 1,
              backgroundColor: COLORS.surface,
            })}
          >
            <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ padding: 24, alignItems: 'center' }}>
            <MaterialIcons name="photo-library" size={34} color={COLORS.muted} />
            <Text style={{ color: COLORS.text, fontWeight: '900', marginTop: 12 }}>Sin posts todavía</Text>
            <Text style={{ color: COLORS.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
              Cuando subas imagenes desde el admin, apareceran aqui como un perfil.
            </Text>
          </View>
        }
      />

      <Modal
        visible={!!selectedPost}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPost(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.92)', justifyContent: 'center', padding: 18 }}>
          {selectedPost && (
            <View style={{ flex: 1, margin: -18 }}>
              <ZoomableImage uri={selectedPost.imageUrl} fullScreen resizeMode="contain" />
              <View
                pointerEvents="box-none"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  paddingHorizontal: 18,
                  paddingTop: 18,
                  paddingBottom: Math.max(insets.bottom, 18),
                  backgroundColor: 'rgba(2, 6, 23, 0.78)',
                }}
              >
                <Text style={{ color: COLORS.text, fontWeight: '900' }}>{friend.characterName}</Text>
                <Text style={{ color: COLORS.muted, lineHeight: 20, marginTop: 8 }}>{selectedPost.caption}</Text>
              </View>
            </View>
          )}
          <Pressable
            onPress={() => setSelectedPost(null)}
            style={({ pressed }) => ({
              position: 'absolute',
              top: Math.max(insets.top, 16),
              right: 16,
              width: 46,
              height: 46,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? '#111827' : COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
            })}
          >
            <MaterialIcons name="close" size={22} color={COLORS.text} />
          </Pressable>
        </View>
      </Modal>

      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.94)' }}>
          {avatarUri ? (
            <ZoomableImage uri={avatarUri} fullScreen resizeMode="contain" />
          ) : null}
          <Text
            style={{
              position: 'absolute',
              left: 18,
              right: 18,
              bottom: Math.max(insets.bottom, 18),
              color: COLORS.text,
              fontWeight: '900',
              textAlign: 'center',
            }}
          >
            {friend.characterName}
          </Text>
          <Pressable
            onPress={() => setAvatarModalVisible(false)}
            style={({ pressed }) => ({
              position: 'absolute',
              top: Math.max(insets.top, 16),
              right: 16,
              width: 46,
              height: 46,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? '#111827' : COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
            })}
          >
            <MaterialIcons name="close" size={22} color={COLORS.text} />
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
