import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { api } from '../api/api';

type AuthContextValue = {
  isSignedIn: boolean;
  accessToken?: string;
  idToken?: string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const extra = Constants.expoConfig?.extra || {};
const DOMAIN: string = extra.COGNITO_DOMAIN;
const CLIENT_ID: string = extra.COGNITO_CLIENT_ID;
const REDIRECT_URI: string = extra.REDIRECT_URI || 'myapp://callback';

WebBrowser.maybeCompleteAuthSession();

async function storeToken(key: string, value: string) {
  await SecureStore.setItemAsync(key, value);
}
async function getToken(key: string) {
  return SecureStore.getItemAsync(key);
}
async function deleteToken(key: string) {
  await SecureStore.deleteItemAsync(key);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const [idToken, setIdToken] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      const at = await getToken('luva_access');
      const idt = await getToken('luva_id');
      if (at) {
        setAccessToken(at);
        api.setToken(at);
      }
      if (idt) setIdToken(idt);
    })();
  }, []);

  const signIn = useCallback(async () => {
    const state = Math.random().toString(36).slice(2);
    const url = `${DOMAIN}/oauth2/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&response_type=code&scope=${encodeURIComponent('openid email profile')}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`;
    const result = await WebBrowser.openAuthSessionAsync(url, REDIRECT_URI);
    if (result.type === 'success' && result.url) {
      const parsed = Linking.parse(result.url);
      const code = (parsed.queryParams?.code as string) || '';
      if (!code) throw new Error('Missing authorization code');
      const tokenUrl = `${DOMAIN}/oauth2/token`;
      const form = new URLSearchParams();
      form.append('grant_type', 'authorization_code');
      form.append('client_id', CLIENT_ID);
      form.append('code', code);
      form.append('redirect_uri', REDIRECT_URI);
      const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
      if (!res.ok) throw new Error('Token exchange failed');
      const data = await res.json();
      const at = data.access_token as string;
      const idt = data.id_token as string;
      if (!at) throw new Error('No access_token');
      await storeToken('luva_access', at);
      await storeToken('luva_id', idt || '');
      setAccessToken(at);
      setIdToken(idt);
      api.setToken(at);
    } else {
      throw new Error('Auth cancelled');
    }
  }, []);

  const signOut = useCallback(async () => {
    await deleteToken('luva_access');
    await deleteToken('luva_id');
    setAccessToken(undefined);
    setIdToken(undefined);
    api.setToken(undefined);
  }, []);

  const value = useMemo(() => ({ isSignedIn: !!accessToken, accessToken, idToken, signIn, signOut }), [accessToken, idToken, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

