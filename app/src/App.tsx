import React from 'react';
import { AuthProvider } from './auth/AuthProvider';
import { CardProgressProvider } from './progress/CardProgressProvider';
import { StoryProgressProvider } from './progress/StoryProgressProvider';
import AppNavigator from './navigation/AppNavigator';
import { RevenueCatProvider } from './purchases/RevenueCatProvider';
import { CoinBalanceProvider } from './purchases/CoinBalanceProvider';
import { AppVersionGateProvider } from './version/AppVersionGateProvider';
import { MetaAdsProvider } from './marketing/MetaAdsProvider';

export default function App() {
  return (
    <AuthProvider>
      <RevenueCatProvider>
        <CoinBalanceProvider>
          <MetaAdsProvider>
            <CardProgressProvider>
              <StoryProgressProvider>
                <AppVersionGateProvider>
                  <AppNavigator />
                </AppVersionGateProvider>
              </StoryProgressProvider>
            </CardProgressProvider>
          </MetaAdsProvider>
        </CoinBalanceProvider>
      </RevenueCatProvider>
    </AuthProvider>
  );
}
