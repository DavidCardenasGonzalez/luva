import React from 'react';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './auth/AuthProvider';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
