import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { api } from '../api/api';

type AuthProviderName = 'google' | 'apple' | 'email';

type AuthUser = {
  email: string;
  displayName?: string;
  givenName?: string;
  familyName?: string;
  pictureUrl?: string;
  lastAuthProvider: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
};

type AuthContextValue = {
  isConfigured: boolean;
  isSignedIn: boolean;
  isLoading: boolean;
  error?: string;
  accessToken?: string;
  idToken?: string;
  user?: AuthUser;
  signIn: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: () => Promise<void>;
  signOut: () => Promise<void>;
};

type TokenExchangeResponse = {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

type CurrentUserResponse = {
  user?: AuthUser;
  created?: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const extra = Constants.expoConfig?.extra || {};
const RAW_DOMAIN: string | undefined = extra.COGNITO_DOMAIN;
const DOMAIN = normalizeHostedUiDomain(RAW_DOMAIN);
const CLIENT_ID: string = extra.COGNITO_CLIENT_ID;
const REDIRECT_URI: string = extra.REDIRECT_URI || 'myapp://callback';
const ACCESS_TOKEN_KEY = 'luva_access';
const ID_TOKEN_KEY = 'luva_id';
const REFRESH_TOKEN_KEY = 'luva_refresh';
const USER_KEY = 'luva_user';

const IDENTITY_PROVIDER_MAP: Record<AuthProviderName, string | undefined> = {
  google: 'Google',
  apple: 'SignInWithApple',
  email: 'COGNITO',
};

WebBrowser.maybeCompleteAuthSession();

function normalizeHostedUiDomain(value?: string): string | undefined {
  const trimmed = (value || '').trim().replace(/\/+$/, '');
  if (!trimmed) return undefined;
  if (trimmed.includes('cognito-idp.')) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/^http:\/\//i, 'https://');
  return `https://${trimmed}`;
}

async function storeValue(key: string, value?: string) {
  if (!value) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getValue(key: string) {
  return SecureStore.getItemAsync(key);
}

async function deleteValue(key: string) {
  await SecureStore.deleteItemAsync(key);
}

async function storeUser(user?: AuthUser) {
  if (!user) {
    await deleteValue(USER_KEY);
    return;
  }
  await storeValue(USER_KEY, JSON.stringify(user));
}

async function getStoredUser(): Promise<AuthUser | undefined> {
  const raw = await getValue(USER_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return undefined;
  }
}

function buildAuthorizeUrl(provider: AuthProviderName, state: string) {
  if (!DOMAIN) {
    throw new Error('COGNITO_DOMAIN debe apuntar al Hosted UI de Cognito, no al endpoint cognito-idp.');
  }
  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('response_type', 'code');
  params.append('scope', 'openid email profile');
  params.append('redirect_uri', REDIRECT_URI);
  params.append('state', state);
  const identityProvider = IDENTITY_PROVIDER_MAP[provider];
  if (identityProvider) {
    params.append('identity_provider', identityProvider);
  }
  return `${DOMAIN}/oauth2/authorize?${params.toString()}`;
}

async function exchangeCodeForTokens(code: string): Promise<TokenExchangeResponse> {
  if (!DOMAIN) {
    throw new Error('COGNITO_DOMAIN no está configurado.');
  }
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
  const payload = await res.json() as TokenExchangeResponse;
  if (!res.ok || payload.error) {
    throw new Error(payload.error_description || payload.error || 'Token exchange failed');
  }
  return payload;
}

async function syncCurrentUser(authToken: string, authProvider?: AuthProviderName): Promise<AuthUser | undefined> {
  api.setToken(authToken);
  try {
    const response = await api.post<CurrentUserResponse>('/users/me', authProvider ? { authProvider } : undefined);
    if (!response?.user?.email) {
      return undefined;
    }
    await storeUser(response.user);
    return response.user;
  } catch (err: any) {
    console.warn('user.sync.failed', err?.message || err);
    return undefined;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const [idToken, setIdToken] = useState<string | undefined>();
  const [user, setUser] = useState<AuthUser | undefined>();
  const [isHydrating, setIsHydrating] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const isConfigured = Boolean(DOMAIN && CLIENT_ID && REDIRECT_URI);
  const authToken = idToken || accessToken;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedAccessToken, storedIdToken, storedUser] = await Promise.all([
          getValue(ACCESS_TOKEN_KEY),
          getValue(ID_TOKEN_KEY),
          getStoredUser(),
        ]);

        if (cancelled) return;

        setAccessToken(storedAccessToken || undefined);
        setIdToken(storedIdToken || undefined);
        setUser(storedUser);
        api.setToken(storedIdToken || storedAccessToken || undefined);

        const storedBearer = storedIdToken || storedAccessToken;
        if (!storedUser && storedBearer) {
          const syncedUser = await syncCurrentUser(storedBearer);
          if (!cancelled && syncedUser) {
            setUser(syncedUser);
          }
        }
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signInWithProvider = useCallback(async (provider: AuthProviderName) => {
    if (!isConfigured) {
      setError('Falta configurar COGNITO_DOMAIN, COGNITO_CLIENT_ID o REDIRECT_URI en el app.');
      return;
    }

    setIsBusy(true);
    setError(undefined);

    try {
      const state = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      const authorizeUrl = buildAuthorizeUrl(provider, state);
      const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, REDIRECT_URI);

      if (result.type !== 'success' || !result.url) {
        return;
      }

      const parsed = Linking.parse(result.url);
      const returnedError = parsed.queryParams?.error;
      const returnedDescription = parsed.queryParams?.error_description;
      if (typeof returnedError === 'string' && returnedError) {
        setError(
          typeof returnedDescription === 'string' && returnedDescription
            ? returnedDescription
            : returnedError
        );
        return;
      }

      const returnedState =
        typeof parsed.queryParams?.state === 'string' ? parsed.queryParams.state : undefined;
      if (returnedState !== state) {
        setError('La respuesta de autenticación no coincide con la solicitud original.');
        return;
      }

      const code = typeof parsed.queryParams?.code === 'string' ? parsed.queryParams.code : '';
      if (!code) {
        setError('Cognito no devolvió un código de autorización.');
        return;
      }

      const data = await exchangeCodeForTokens(code);
      const nextAccessToken = data.access_token;
      const nextIdToken = data.id_token;
      const nextRefreshToken = data.refresh_token;
      const nextBearer = nextIdToken || nextAccessToken;

      if (!nextAccessToken || !nextBearer) {
        setError('Cognito no devolvió tokens válidos.');
        return;
      }

      await Promise.all([
        storeValue(ACCESS_TOKEN_KEY, nextAccessToken),
        storeValue(ID_TOKEN_KEY, nextIdToken),
        storeValue(REFRESH_TOKEN_KEY, nextRefreshToken),
      ]);

      setAccessToken(nextAccessToken);
      setIdToken(nextIdToken);
      api.setToken(nextBearer);

      const syncedUser = await syncCurrentUser(nextBearer, provider);
      setUser(syncedUser);
    } catch (err: any) {
      setError(err?.message || 'No pudimos completar el inicio de sesión.');
    } finally {
      setIsBusy(false);
      setIsHydrating(false);
    }
  }, [isConfigured]);

  const signIn = useCallback(async () => {
    await signInWithProvider('email');
  }, [signInWithProvider]);

  const signInWithGoogle = useCallback(async () => {
    await signInWithProvider('google');
  }, [signInWithProvider]);

  const signInWithApple = useCallback(async () => {
    await signInWithProvider('apple');
  }, [signInWithProvider]);

  const signInWithEmail = useCallback(async () => {
    await signInWithProvider('email');
  }, [signInWithProvider]);

  const signOut = useCallback(async () => {
    setIsBusy(true);
    setError(undefined);

    try {
      if (DOMAIN && CLIENT_ID) {
        const logoutUrl = `${DOMAIN}/logout?client_id=${encodeURIComponent(CLIENT_ID)}&logout_uri=${encodeURIComponent(REDIRECT_URI)}`;
        try {
          await WebBrowser.openAuthSessionAsync(logoutUrl, REDIRECT_URI);
        } catch (err) {
          console.warn('auth.logout.failed', err);
        }
      }
    } finally {
      await Promise.all([
        deleteValue(ACCESS_TOKEN_KEY),
        deleteValue(ID_TOKEN_KEY),
        deleteValue(REFRESH_TOKEN_KEY),
        deleteValue(USER_KEY),
      ]);
      setAccessToken(undefined);
      setIdToken(undefined);
      setUser(undefined);
      api.setToken(undefined);
      setIsBusy(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      isConfigured,
      isSignedIn: Boolean(authToken),
      isLoading: isHydrating || isBusy,
      error,
      accessToken,
      idToken,
      user,
      signIn,
      signInWithGoogle,
      signInWithApple,
      signInWithEmail,
      signOut,
    }),
    [
      accessToken,
      authToken,
      error,
      idToken,
      isBusy,
      isConfigured,
      isHydrating,
      signIn,
      signInWithApple,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
