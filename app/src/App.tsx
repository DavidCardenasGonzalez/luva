import React from 'react';
import { AuthProvider } from './auth/AuthProvider';
import { CardProgressProvider } from './progress/CardProgressProvider';
import { StoryProgressProvider } from './progress/StoryProgressProvider';
import AppNavigator from './navigation/AppNavigator';
import { RevenueCatProvider } from './purchases/RevenueCatProvider';

export default function App() {
  return (
    <RevenueCatProvider>
      <AuthProvider>
        <CardProgressProvider>
          <StoryProgressProvider>
            <AppNavigator />
          </StoryProgressProvider>
        </CardProgressProvider>
      </AuthProvider>
    </RevenueCatProvider>
  );
}
