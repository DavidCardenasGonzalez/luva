import React from 'react';
import { AuthProvider } from './auth/AuthProvider';
import { CardProgressProvider } from './progress/CardProgressProvider';
import { StoryProgressProvider } from './progress/StoryProgressProvider';
import AppNavigator from './navigation/AppNavigator';
import { RevenueCatProvider } from './purchases/RevenueCatProvider';
import { CoinBalanceProvider } from './purchases/CoinBalanceProvider';
import { PhotoRequestCreditsProvider } from './purchases/PhotoRequestCreditsProvider';
import { AppVersionGateProvider } from './version/AppVersionGateProvider';
import { MetaAdsProvider } from './marketing/MetaAdsProvider';
import { MixpanelProvider } from './marketing/MixpanelProvider';
import { ShadowingPlayerProvider } from './shadowing/ShadowingPlayerProvider';
import { LanguageProvider } from './i18n/LanguageProvider';
import { MicrodramaProgressProvider } from './microdramas/MicrodramaProgressProvider';
import { ReviewProvider } from './review/ReviewProvider';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ReviewProvider>
        <RevenueCatProvider>
          <CoinBalanceProvider>
            <PhotoRequestCreditsProvider>
              <MetaAdsProvider>
                <MixpanelProvider>
                  <CardProgressProvider>
                    <StoryProgressProvider>
                      <AppVersionGateProvider>
                        <ShadowingPlayerProvider>
                          <MicrodramaProgressProvider>
                            <AppNavigator />
                          </MicrodramaProgressProvider>
                        </ShadowingPlayerProvider>
                      </AppVersionGateProvider>
                    </StoryProgressProvider>
                  </CardProgressProvider>
                </MixpanelProvider>
              </MetaAdsProvider>
            </PhotoRequestCreditsProvider>
          </CoinBalanceProvider>
        </RevenueCatProvider>
        </ReviewProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
