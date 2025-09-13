import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import DeckScreen from '../screens/DeckScreen';
import CardDetailScreen from '../screens/CardDetailScreen';
import PracticeScreen from '../screens/PracticeScreen';
import StoriesScreen from '../screens/StoriesScreen';
import StorySceneScreen from '../screens/StorySceneScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthCallbackScreen from '../screens/AuthCallbackScreen';
import * as Linking from 'expo-linking';

export type RootStackParamList = {
  Home: undefined;
  Deck: undefined;
  CardDetail: { id: string; label: string; example: string; options: Record<'a'|'b'|'c', string>; answer: 'a'|'b'|'c'; explanation: string };
  Practice: { cardId?: string; storyId?: string; sceneIndex?: number; prompt?: string; label?: string; example?: string; options?: Record<'a'|'b'|'c', string>; answer?: 'a'|'b'|'c'; explanation?: string };
  Stories: undefined;
  StoryScene: { storyId: string; sceneIndex: number };
  Profile: undefined;
  AuthCallback: undefined;
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
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Deck" component={DeckScreen} />
        <Stack.Screen name="CardDetail" component={CardDetailScreen} />
        <Stack.Screen name="Practice" component={PracticeScreen} />
        <Stack.Screen name="Stories" component={StoriesScreen} />
        <Stack.Screen name="StoryScene" component={StorySceneScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="AuthCallback" component={AuthCallbackScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
