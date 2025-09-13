import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import DeckScreen from './screens/DeckScreen';
import PracticeScreen from './screens/PracticeScreen';
import StoriesScreen from './screens/StoriesScreen';
import ProfileScreen from './screens/ProfileScreen';

// Minimal pseudo-navigation for stub (swap manually)
export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '600' }}>Luva</Text>
      </View>
      <HomeScreen />
    </SafeAreaView>
  );
}

