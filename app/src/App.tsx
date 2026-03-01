import React from 'react';
import { AuthProvider } from './auth/AuthProvider';
import { CardProgressProvider } from './progress/CardProgressProvider';
import { StoryProgressProvider } from './progress/StoryProgressProvider';
import AppNavigator from './navigation/AppNavigator';
import { RevenueCatProvider } from './purchases/RevenueCatProvider';
import { CoinBalanceProvider } from './purchases/CoinBalanceProvider';
import { AppVersionGateProvider } from './version/AppVersionGateProvider';

export default function App() {
  return (
    <RevenueCatProvider>
      <CoinBalanceProvider>
        <AuthProvider>
          <CardProgressProvider>
            <StoryProgressProvider>
              <AppVersionGateProvider>
                <AppNavigator />
              </AppVersionGateProvider>
            </StoryProgressProvider>
          </CardProgressProvider>
        </AuthProvider>
      </CoinBalanceProvider>
    </RevenueCatProvider>
  );
}
