import React from 'react';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './auth/AuthProvider';
import { CardProgressProvider } from './progress/CardProgressProvider';
import { StoryProgressProvider } from './progress/StoryProgressProvider';

export default function App() {
  return (
    <AuthProvider>
      <CardProgressProvider>
        <StoryProgressProvider>
          <AppNavigator />
        </StoryProgressProvider>
      </CardProgressProvider>
    </AuthProvider>
  );
}
