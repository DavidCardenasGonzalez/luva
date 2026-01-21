import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import DeckScreen from '../screens/DeckScreen';
import PracticeScreen from '../screens/PracticeScreen';
import StoriesScreen from '../screens/StoriesScreen';
import StoryMissionsScreen from '../screens/StoryMissionsScreen';
import StorySceneScreen from '../screens/StorySceneScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthCallbackScreen from '../screens/AuthCallbackScreen';
import SettingsScreen from '../screens/SettingsScreen';
import * as Linking from 'expo-linking';

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
  StoryMissions: { storyId: string };
  StoryScene: { storyId: string; sceneIndex: number };
  Profile: undefined;
  AuthCallback: undefined;
  Settings: undefined;
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
  return (
    <NavigationContainer linking={linking} theme={DefaultTheme}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Deck" component={DeckScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Practice" component={PracticeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Stories" component={StoriesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="StoryMissions" component={StoryMissionsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="StoryScene" component={StorySceneScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="AuthCallback" component={AuthCallbackScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
