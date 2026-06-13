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
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import { RootStackParamList } from '../navigation/AppNavigator';
import { CharacterProfilePost, FriendProfileImage, useFriendProfile } from '../hooks/useFriendProfile';
import { getChatAvatar } from '../chatimages/chatAvatarMap';
import { trackMixpanelFriendEvent } from '../marketing/mixpanelEvents';
import { AffinityBar } from '../components/AffinityBar';
import { addLocalFriendAffinityPoints } from '../friends/localFriends';

type Props = NativeStackScreenProps<RootStackParamList, 'FriendProfile'>;
type ProfileTab = 'posts' | 'photos';

const COLORS = {
  background: '#0b1224',
  surface: '#0f172a',
  border: '#1f2937',
  text: '#e2e8f0',
  muted: '#94a3b8',
  accent: '#22d3ee',
  action: '#2563eb',
};

const DEV_AFFINITY_POINTS_BONUS = 50;

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

function ProfileFeedPost({
  item,
  avatarSource,
  avatarInitial,
  playbackEnabled,
  onReply,
}: {
  item: CharacterProfilePost;
  avatarSource?: ImageSourcePropType;
  avatarInitial: string;
  playbackEnabled: boolean;
  onReply: (post: CharacterProfilePost) => void;
}) {
  const videoUrl = item.videoUrl?.trim();
  const imageUrl = item.imageUrl?.trim();
  const videoRef = useRef<Video | null>(null);
  const [isVideoReadyForDisplay, setIsVideoReadyForDisplay] = useState(false);
  const videoSource = useMemo(() => {
    return videoUrl ? { uri: videoUrl } : undefined;
  }, [videoUrl]);

  useEffect(() => {
    setIsVideoReadyForDisplay(false);
  }, [videoUrl]);

  useEffect(() => {
    if (playbackEnabled || !videoUrl) return;

    setIsVideoReadyForDisplay(false);
    void videoRef.current?.unloadAsync().catch(() => {
      // Best effort cleanup when this post leaves focus.
    });
  }, [playbackEnabled, videoUrl]);

  useEffect(() => {
    return () => {
      void videoRef.current?.unloadAsync().catch(() => {
        // Best effort cleanup on unmount.
      });
    };
  }, []);

  const shouldMountVideo = playbackEnabled && !!videoSource;

  return (
    <View style={{ paddingHorizontal: 14, paddingVertical: 6 }}>
      <View
        style={{
          overflow: 'hidden',
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 14,
        }}
      >
        <View style={{ aspectRatio: videoUrl ? 9 / 11 : 1, backgroundColor: '#020617' }}>
          {imageUrl ? (
            <Image
              source={{ uri: item.thumbnailUrl || imageUrl }}
              style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
              resizeMode="cover"
            />
          ) : null}

          {shouldMountVideo ? (
            <Video
              key={`${item.postId}:${videoUrl}`}
              ref={videoRef}
              source={videoSource}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                opacity: isVideoReadyForDisplay ? 1 : 0,
              }}
              resizeMode={ResizeMode.COVER}
              shouldPlay={playbackEnabled}
              useNativeControls
              posterSource={{ uri: item.thumbnailUrl || item.imageUrl }}
              usePoster
              onLoadStart={() => setIsVideoReadyForDisplay(false)}
              onLoad={() => setIsVideoReadyForDisplay(true)}
              onReadyForDisplay={() => setIsVideoReadyForDisplay(true)}
              onError={(videoError) => {
                setIsVideoReadyForDisplay(false);
                console.warn('[FriendProfile] No se pudo cargar el video del post', videoError);
              }}
            />
          ) : null}

          {videoUrl && !shouldMountVideo ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(2, 6, 23, 0.18)',
              }}
            >
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(2, 6, 23, 0.72)',
                }}
              >
                <MaterialIcons name="play-arrow" size={34} color="white" />
              </View>
            </View>
          ) : null}
        </View>

        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0b172b',
                borderWidth: 1,
                borderColor: 'rgba(34, 211, 238, 0.26)',
              }}
            >
              {avatarSource ? (
                <Image source={avatarSource} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Text style={{ color: COLORS.text, fontWeight: '900' }}>{avatarInitial}</Text>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ color: COLORS.text, fontWeight: '900' }} numberOfLines={1}>
                {item.characterName}
              </Text>
            </View>
          </View>

          <Text style={{ color: COLORS.muted, lineHeight: 20, marginTop: 12 }}>{item.caption}</Text>

          <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable
              onPress={() => onReply(item)}
              accessibilityRole="button"
              accessibilityLabel={`Responder al post de ${item.characterName}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 11,
                borderRadius: 999,
                backgroundColor: pressed ? '#1d4ed8' : COLORS.action,
              })}
            >
              <MaterialIcons name="reply" size={18} color="white" />
              <Text style={{ color: 'white', fontWeight: '900', marginLeft: 8 }}>Responder</Text>
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
              <MaterialIcons name="chat-bubble-outline" size={17} color={COLORS.muted} />
              <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '800', marginLeft: 5 }}>
                {item.messageCount}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function FriendProfileScreen({ navigation, route }: Props) {
  const friendId = route.params?.friendId;
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const { friend, posts, images, loading, loaded, error, reload } = useFriendProfile(friendId);
  const [selectedPost, setSelectedPost] = useState<CharacterProfilePost | null>(null);
  const [selectedImage, setSelectedImage] = useState<FriendProfileImage | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [focusedPostId, setFocusedPostId] = useState<string | undefined>();
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [devAffinityLoading, setDevAffinityLoading] = useState(false);
  const [devAffinityMessage, setDevAffinityMessage] = useState<string | undefined>();
  const focusedFeedListRef = useRef<FlatList<CharacterProfilePost> | null>(null);
  const trackedProfileFocusKeyRef = useRef<string | undefined>(undefined);
  const selectedPostIndex = useMemo(() => {
    if (!selectedPost) return -1;
    return posts.findIndex((post) => post.postId === selectedPost.postId);
  }, [posts, selectedPost]);
  const focusedPosts = useMemo(() => {
    if (!selectedPost || selectedPostIndex < 0) return posts;
    return [...posts.slice(selectedPostIndex), ...posts.slice(0, selectedPostIndex)];
  }, [posts, selectedPost, selectedPostIndex]);
  const profileGridItems = activeTab === 'posts' ? posts : images;
  const handleFocusedViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ item?: CharacterProfilePost }> }) => {
      const post = viewableItems.find((viewableItem) => !!viewableItem.item)?.item;
      if (post) {
        setFocusedPostId(post.postId);
      }
    }
  ).current;
  const focusedViewabilityConfig = useRef({ itemVisiblePercentThreshold: 55 }).current;

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  useEffect(() => {
    if (!isFocused) {
      trackedProfileFocusKeyRef.current = undefined;
      return;
    }
    if (!friend || trackedProfileFocusKeyRef.current === friend.friendId) return;
    trackedProfileFocusKeyRef.current = friend.friendId;
    void trackMixpanelFriendEvent('friend_profile_viewed', {
      friend_id: friend.friendId,
      character_id: friend.friendId,
      character_name: friend.characterName,
      post_count: posts.length,
    });
  }, [friend, isFocused, posts.length]);

  const avatarSource = useMemo<ImageSourcePropType | undefined>(() => {
    if (!friend) return undefined;
    const avatarUrl = (friend.avatarImageMdUrl || friend.avatarImageUrl)?.trim();
    return avatarUrl
      ? { uri: avatarUrl }
      : getChatAvatar(friend.friendId);
  }, [friend]);
  const avatarXsSource = useMemo<ImageSourcePropType | undefined>(() => {
    if (!friend) return undefined;
    const avatarUrl = (friend.avatarImageXsUrl || friend.avatarImageUrl)?.trim();
    return avatarUrl
      ? { uri: avatarUrl }
      : getChatAvatar(friend.friendId);
  }, [friend]);
  const avatarInitial = (friend?.characterName.trim().charAt(0) || '?').toUpperCase();
  const avatarUri = typeof avatarSource === 'object' && avatarSource && 'uri' in avatarSource
    ? avatarSource.uri
    : undefined;
  const tileGap = 3;
  const tileSize = Math.floor((width - tileGap * 2) / 3);
  const handleReplyToPost = useCallback(
    (post: CharacterProfilePost) => {
      if (!friend) return;
      void trackMixpanelFriendEvent('friend_chat_opened', {
        friend_id: friend.friendId,
        character_id: friend.friendId,
        character_name: friend.characterName,
        post_id: post.postId,
        source: 'friend_profile_post',
      });
      setSelectedPost(null);
      setFocusedPostId(undefined);
      navigation.navigate('FriendChat', {
        friendId: friend.friendId,
        postId: post.postId,
        postImageUrl: post.imageUrl,
        postVideoUrl: post.videoUrl,
        postCaption: post.caption,
        postContext: post.context || post.caption,
      });
    },
    [friend, navigation]
  );
  const handleAddDevAffinityPoints = useCallback(async () => {
    if (!friend || devAffinityLoading) return;
    setDevAffinityLoading(true);
    setDevAffinityMessage(undefined);
    try {
      const nextFriend = await addLocalFriendAffinityPoints(friend, DEV_AFFINITY_POINTS_BONUS);
      setDevAffinityMessage(`+${DEV_AFFINITY_POINTS_BONUS} afinidad (${nextFriend.affinityPoints ?? 0} total)`);
      await reload();
    } catch (err: any) {
      setDevAffinityMessage(err?.message || 'No se pudo sumar afinidad.');
    } finally {
      setDevAffinityLoading(false);
    }
  }, [devAffinityLoading, friend, reload]);

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

  if (selectedPost && posts.length > 0) {
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
            onPress={() => {
              setSelectedPost(null);
              setFocusedPostId(undefined);
            }}
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
            <MaterialIcons name="grid-on" size={20} color={COLORS.text} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: COLORS.text, fontWeight: '900', fontSize: 18 }} numberOfLines={1}>
              {friend.characterName}
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
              Posts
            </Text>
          </View>
          <Pressable
            onPress={() => {
              void trackMixpanelFriendEvent('friend_chat_opened', {
                friend_id: friend.friendId,
                character_name: friend.characterName,
                character_id: friend.friendId,
                source: 'friend_profile_feed_header',
              });
              setSelectedPost(null);
              setFocusedPostId(undefined);
              navigation.navigate('FriendChat', { friendId: friend.friendId });
            }}
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
          key={`friend-profile-focused-feed:${selectedPost.postId}`}
          ref={focusedFeedListRef}
          data={focusedPosts}
          keyExtractor={(item) => item.postId}
          initialNumToRender={6}
          onViewableItemsChanged={handleFocusedViewableItemsChanged}
          viewabilityConfig={focusedViewabilityConfig}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 18) }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProfileFeedPost
              item={item}
              avatarSource={avatarXsSource}
              avatarInitial={avatarInitial}
              playbackEnabled={(focusedPostId || selectedPost.postId) === item.postId}
              onReply={handleReplyToPost}
            />
          )}
        />
      </SafeAreaView>
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
          onPress={() => {
            void trackMixpanelFriendEvent('friend_chat_opened', {
              friend_id: friend.friendId,
              character_name: friend.characterName,
              character_id: friend.friendId,
              source: 'friend_profile_header',
            });
            navigation.navigate('FriendChat', { friendId: friend.friendId });
          }}
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
        key={`friend-profile-grid:${activeTab}`}
        data={profileGridItems as Array<CharacterProfilePost | FriendProfileImage>}
        keyExtractor={(item) =>
          activeTab === 'posts'
            ? (item as CharacterProfilePost).postId
            : (item as FriendProfileImage).imageId
        }
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
                  <StatBlock label="fotos" value={images.length} />
                  <StatBlock label="mensajes" value={friend.messageCount ?? 0} />
                </View>
              </View>

              <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: '900', marginTop: 16 }} numberOfLines={1}>
                {friend.characterName}
              </Text>

              {friend.characterBio ? (
                <Text style={{ color: COLORS.muted, fontSize: 14, lineHeight: 20, marginTop: 8 }}>
                  {friend.characterBio}
                </Text>
              ) : null}

              <View
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: COLORS.surface,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <AffinityBar points={friend.affinityPoints} variant="dark" />
              </View>

              {__DEV__ ? (
                <View style={{ marginTop: 10 }}>
                  <Pressable
                    onPress={handleAddDevAffinityPoints}
                    disabled={devAffinityLoading}
                    accessibilityRole="button"
                    accessibilityLabel={`Sumar ${DEV_AFFINITY_POINTS_BONUS} puntos de afinidad en desarrollo`}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(34, 211, 238, 0.36)',
                      backgroundColor: pressed ? '#164e63' : '#0e7490',
                      opacity: devAffinityLoading ? 0.65 : 1,
                    })}
                  >
                    {devAffinityLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <MaterialIcons name="science" size={18} color="white" />
                    )}
                    <Text style={{ color: 'white', fontWeight: '900', marginLeft: 8 }}>
                      Dev: +{DEV_AFFINITY_POINTS_BONUS} afinidad
                    </Text>
                  </Pressable>
                  {devAffinityMessage ? (
                    <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '700', marginTop: 6 }}>
                      {devAffinityMessage}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <Pressable
                  onPress={() => {
                    void trackMixpanelFriendEvent('friend_chat_opened', {
                      friend_id: friend.friendId,
                      character_name: friend.characterName,
                      character_id: friend.friendId,
                      source: 'friend_profile_cta',
                    });
                    navigation.navigate('FriendChat', { friendId: friend.friendId });
                  }}
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
                  onPress={() => {
                    void trackMixpanelFriendEvent('friend_conversation_history_opened', {
                      friend_id: friend.friendId,
                      character_name: friend.characterName,
                      character_id: friend.friendId,
                      source: 'friend_profile_cta',
                    });
                    navigation.navigate('FriendConversationHistory', {
                      friendId: friend.friendId,
                      friendName: friend.characterName,
                    });
                  }}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    backgroundColor: pressed ? '#111827' : COLORS.surface,
                  })}
                >
                  <Text style={{ color: COLORS.text, fontWeight: '900' }}>Recuerdos</Text>
                </Pressable>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: COLORS.border,
                alignItems: 'stretch',
              }}
            >
              <Pressable
                onPress={() => setActiveTab('posts')}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  backgroundColor: pressed ? '#111827' : 'transparent',
                  borderBottomWidth: activeTab === 'posts' ? 2 : 0,
                  borderBottomColor: COLORS.accent,
                })}
              >
                <MaterialIcons name="grid-on" size={20} color={activeTab === 'posts' ? COLORS.accent : COLORS.muted} />
              </Pressable>
              <Pressable
                onPress={() => setActiveTab('photos')}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  backgroundColor: pressed ? '#111827' : 'transparent',
                  borderBottomWidth: activeTab === 'photos' ? 2 : 0,
                  borderBottomColor: COLORS.accent,
                })}
              >
                <MaterialIcons name="photo-camera" size={20} color={activeTab === 'photos' ? COLORS.accent : COLORS.muted} />
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          activeTab === 'posts' ? (
            <Pressable
              onPress={() => {
                const post = item as CharacterProfilePost;
                void trackMixpanelFriendEvent('friend_profile_post_opened', {
                  friend_id: friend.friendId,
                  character_name: friend.characterName,
                  post_id: post.postId,
                });
                setFocusedPostId(post.postId);
                setSelectedPost(post);
              }}
              style={({ pressed }) => ({
                width: tileSize,
                height: tileSize,
                marginRight: index % 3 === 2 ? 0 : tileGap,
                marginBottom: tileGap,
                opacity: pressed ? 0.82 : 1,
                backgroundColor: COLORS.surface,
              })}
            >
              <Image
                source={{ uri: (item as CharacterProfilePost).thumbnailUrl || (item as CharacterProfilePost).imageUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
              {(item as CharacterProfilePost).videoUrl ? (
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    right: 8,
                    bottom: 8,
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(2, 6, 23, 0.68)',
                  }}
                >
                  <MaterialIcons name="play-arrow" size={20} color="white" />
                </View>
              ) : null}
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                const image = item as FriendProfileImage;
                void trackMixpanelFriendEvent('friend_profile_photo_opened', {
                  friend_id: friend.friendId,
                  character_name: friend.characterName,
                  image_id: image.imageId,
                });
                setSelectedImage(image);
              }}
              style={({ pressed }) => ({
                width: tileSize,
                height: tileSize,
                marginRight: index % 3 === 2 ? 0 : tileGap,
                marginBottom: tileGap,
                opacity: pressed ? 0.82 : 1,
                backgroundColor: COLORS.surface,
              })}
            >
              <Image
                source={{ uri: (item as FriendProfileImage).imageUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </Pressable>
          )
        )}
        ListEmptyComponent={
          <View style={{ padding: 24, alignItems: 'center' }}>
            <MaterialIcons
              name={activeTab === 'posts' ? 'photo-library' : 'photo-camera'}
              size={34}
              color={COLORS.muted}
            />
            <Text style={{ color: COLORS.text, fontWeight: '900', marginTop: 12 }}>
              {activeTab === 'posts' ? 'Sin posts todavía' : 'Sin fotos todavía'}
            </Text>
          </View>
        }
      />

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

      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.94)' }}>
          {selectedImage ? (
            <ZoomableImage uri={selectedImage.imageUrl} fullScreen resizeMode="contain" />
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
            numberOfLines={2}
          >
            {selectedImage?.prompt || friend.characterName}
          </Text>
          <Pressable
            onPress={() => setSelectedImage(null)}
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
