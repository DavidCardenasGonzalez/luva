import React, { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useAuth } from "../auth/AuthProvider";
import {
  initializeMixpanelSdk,
  setMixpanelUserIdentity,
  trackAppOpen,
  trackInitialAppOpen,
} from "./mixpanelEvents";

export function MixpanelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, user } = useAuth();

  useEffect(() => {
    void initializeMixpanelSdk();
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const identity = user
      ? {
          email: user.email,
          cognitoSub: user.cognitoSub,
          displayName: user.displayName,
          givenName: user.givenName,
          familyName: user.familyName,
          isPro: user.isPro,
        }
      : undefined;

    void (async () => {
      await setMixpanelUserIdentity(identity);
      await trackInitialAppOpen();
    })();
  }, [isLoading, user]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    let appState: AppStateStatus = AppState.currentState;
    const subscription = AppState.addEventListener("change", (nextState) => {
      const wasInBackground =
        appState === "background" || appState === "inactive";

      if (wasInBackground && nextState === "active") {
        void trackAppOpen({ open_type: "foreground" });
      }

      appState = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [isLoading]);

  return <>{children}</>;
}
