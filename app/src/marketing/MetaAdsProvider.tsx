import React, { useEffect } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  initializeMetaSdk,
  setMetaUserIdentity,
} from "./metaAppEvents";

export function MetaAdsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  useEffect(() => {
    void initializeMetaSdk();
  }, []);

  useEffect(() => {
    void setMetaUserIdentity(
      user
        ? {
            email: user.email,
            givenName: user.givenName,
            familyName: user.familyName,
          }
        : undefined
    );
  }, [user]);

  return <>{children}</>;
}
