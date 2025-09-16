import React from 'react';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './auth/AuthProvider';
import { CardProgressProvider } from './progress/CardProgressProvider';

export default function App() {
  return (
    <AuthProvider>
      <CardProgressProvider>
        <AppNavigator />
      </CardProgressProvider>
    </AuthProvider>
  );
}
