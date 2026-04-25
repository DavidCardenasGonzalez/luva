import React, { useCallback, useRef } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import DeckScreen from '../screens/DeckScreen';
import PracticeScreen from '../screens/PracticeScreen';
import StoriesScreen from '../screens/StoriesScreen';
import FeedScreen from '../screens/FeedScreen';
import FriendsScreen from '../screens/FriendsScreen';
import FriendChatScreen from '../screens/FriendChatScreen';
import StoryMissionsScreen from '../screens/StoryMissionsScreen';
import StorySceneScreen from '../screens/StorySceneScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthCallbackScreen from '../screens/AuthCallbackScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PaywallScreen from '../screens/PaywallScreen';
import EmailSignUpScreen from '../screens/EmailSignUpScreen';
import * as Linking from 'expo-linking';
import { trackScreenViewed } from '../marketing/mixpanelEvents';

export type PaywallSource =
  | 'coin_chip'
  | 'deck_card_unlock'
  | 'home_banner'
  | 'practice_card_unlock'
  | 'practice_recording'
  | 'settings_subscription'
  | 'story_mission_unlock'
  | 'story_scene_mission_unlock'
  | 'story_scene_recording';

export type RootStackParamList = {
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
  Stories: undefined;
  Feed: undefined;
  Friends: undefined;
  FriendChat: { friendId: string };
  StoryMissions: { storyId: string };
  StoryScene: { storyId: string; sceneIndex: number };
  Profile: undefined;
  AuthCallback: undefined;
  Settings: undefined;
  EmailSignUp: { prefillEmail?: string } | undefined;
  Paywall: { asModal?: boolean; source?: PaywallSource } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const prefix = Linking.createURL('/');
const linking = {
  prefixes: [prefix, 'myapp://'],
  config: {
    screens: {
      AuthCallback: 'callback',
    },
  },
};

export default function AppNavigator() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const routeNameRef = useRef<string | undefined>(undefined);

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

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      theme={DefaultTheme}
      onReady={handleReady}
      onStateChange={handleStateChange}
    >
      <Stack.Navigator initialRouteName="Feed">
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Deck" component={DeckScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Practice" component={PracticeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Stories" component={StoriesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Feed" component={FeedScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Friends" component={FriendsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FriendChat" component={FriendChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="StoryMissions" component={StoryMissionsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="StoryScene" component={StorySceneScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="AuthCallback" component={AuthCallbackScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EmailSignUp" component={EmailSignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Paywall" component={PaywallScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
