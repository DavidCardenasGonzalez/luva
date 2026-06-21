import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
} from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import DeckScreen from '../screens/DeckScreen';
import PracticeScreen from '../screens/PracticeScreen';
import LessonsScreen from '../screens/LessonsScreen';
import LessonDetailScreen from '../screens/LessonDetailScreen';
import LessonTestScreen from '../screens/LessonTestScreen';
import ShadowingScreen from '../screens/ShadowingScreen';
import FeedScreen from '../screens/FeedScreen';
import MyJourneyScreen from '../screens/MyJourneyScreen';
import FriendsScreen from '../screens/FriendsScreen';
import FriendChatScreen from '../screens/FriendChatScreen';
import FriendProfileScreen from '../screens/FriendProfileScreen';
import FriendConversationHistoryScreen from '../screens/FriendConversationHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthCallbackScreen from '../screens/AuthCallbackScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PaywallScreen from '../screens/PaywallScreen';
import EmailSignUpScreen from '../screens/EmailSignUpScreen';
import AccountAccessScreen from '../screens/AccountAccessScreen';
import OnboardingScreen from '../onboarding/OnboardingScreen';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { trackScreenViewed } from '../marketing/mixpanelEvents';
import { hasCompletedOnboarding } from '../onboarding/model/progress';

export type PaywallSource =
  | 'coin_chip'
  | 'deck_card_unlock'
  | 'friend_chat_message'
  | 'friend_chat_photo'
  | 'friend_chat_recording'
  | 'home_banner'
  | 'onboarding_lite_offer'
  | 'practice_card_unlock'
  | 'practice_recording'
  | 'promo_lite_offer'
  | 'settings_lite'
  | 'settings_subscription'
  | 'shadowing_chapter_unlock';

export type RootStackParamList = {
  Onboarding: { startAtStep?: number } | undefined;
  Home: undefined;
  Deck: undefined;
  Practice: {
    cardId?: string;
    storyId?: string;
    sceneIndex?: number;
    prompt?: string;
    label?: string;
    examples?: string[];
    options?: Record<'a' | 'b' | 'c', string>;
    answer?: 'a' | 'b' | 'c';
    explanation?: string;
  };
  Lessons: undefined;
  LessonDetail: { lessonId: string };
  LessonTest: { lessonId: string };
  Shadowing: { listId?: string; chapterId?: string; autoplay?: boolean; origin?: 'feed' } | undefined;
  Feed: { openReels?: boolean } | undefined;
  MyJourney: undefined;
  Friends: undefined;
  FriendChat: {
    friendId: string;
    postId?: string;
    postImageUrl?: string;
    postVideoUrl?: string;
    postCaption?: string;
    postContext?: string;
    postConversationNarration?: string;
    postInitialMessage?: string;
    initialDraft?: string;
  };
  FriendProfile: { friendId: string };
  FriendConversationHistory: { friendId: string; friendName?: string };
  Profile: undefined;
  AuthCallback: undefined;
  Settings: undefined;
  EmailSignUp: { prefillEmail?: string } | undefined;
  AccountAccess: { fromOnboarding?: boolean } | undefined;
  Paywall: {
    asModal?: boolean;
    source?: PaywallSource;
    variant?: 'pro' | 'lite';
    closeTarget?: 'Feed';
  } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const prefix = Linking.createURL('/');
function getNotificationUrl(response: Notifications.NotificationResponse | null | undefined) {
  const url = response?.notification.request.content.data?.url;
  return typeof url === 'string' ? url : undefined;
}

const linking = {
  prefixes: [prefix, 'myapp://'],
  config: {
    screens: {
      AuthCallback: 'callback',
    },
  },
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (url) {
      return url;
    }

    return getNotificationUrl(Notifications.getLastNotificationResponse());
  },
  subscribe(listener: (url: string) => void) {
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      listener(url);
    });
    const notificationSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = getNotificationUrl(response);
      if (url) {
        listener(url);
      }
    });

    return () => {
      linkingSubscription.remove();
      notificationSubscription.remove();
    };
  },
};

export default function AppNavigator() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const routeNameRef = useRef<string | undefined>(undefined);
  const [initialRouteName, setInitialRouteName] = useState<'Onboarding' | 'Feed'>();

  useEffect(() => {
    let mounted = true;

    hasCompletedOnboarding().then((completed) => {
      if (mounted) {
        setInitialRouteName(completed ? 'Feed' : 'Onboarding');
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleReady = useCallback(() => {
    const currentRoute = navigationRef.getCurrentRoute();
    const currentRouteName = currentRoute?.name;
    routeNameRef.current = currentRouteName;

    if (currentRouteName) {
      void trackScreenViewed({ screenName: currentRouteName });
    }
  }, [navigationRef]);

  const handleStateChange = useCallback(() => {
    const previousRouteName = routeNameRef.current;
    const currentRoute = navigationRef.getCurrentRoute();
    const currentRouteName = currentRoute?.name;

    if (currentRouteName && currentRouteName !== previousRouteName) {
      void trackScreenViewed({
        screenName: currentRouteName,
        previousScreenName: previousRouteName,
      });
    }

    routeNameRef.current = currentRouteName;
  }, [navigationRef]);

  if (!initialRouteName) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#07111f' }}>
        <ActivityIndicator color="#22d3ee" />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      theme={DefaultTheme}
      onReady={handleReady}
      onStateChange={handleStateChange}
    >
      <Stack.Navigator initialRouteName={initialRouteName}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Deck" component={DeckScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Practice" component={PracticeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Lessons" component={LessonsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LessonDetail" component={LessonDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LessonTest" component={LessonTestScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Shadowing" component={ShadowingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Feed" component={FeedScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MyJourney" component={MyJourneyScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Friends" component={FriendsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FriendChat" component={FriendChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FriendProfile" component={FriendProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FriendConversationHistory" component={FriendConversationHistoryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="AuthCallback" component={AuthCallbackScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EmailSignUp" component={EmailSignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AccountAccess" component={AccountAccessScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Paywall" component={PaywallScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
