import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  expires_in?: number;
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
const SESSION_EXPIRES_AT_KEY = 'luva_session_expires_at';
const USER_KEY = 'luva_user';
const SESSION_EXPIRY_SKEW_MS = 30_000;

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

async function storeNumber(key: string, value?: number) {
  await storeValue(key, typeof value === 'number' && Number.isFinite(value) ? String(value) : undefined);
}

async function getStoredNumber(key: string): Promise<number | undefined> {
  const raw = await getValue(key);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
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

async function refreshTokens(refreshToken: string): Promise<TokenExchangeResponse> {
  if (!DOMAIN) {
    throw new Error('COGNITO_DOMAIN no está configurado.');
  }
  const tokenUrl = `${DOMAIN}/oauth2/token`;
  const form = new URLSearchParams();
  form.append('grant_type', 'refresh_token');
  form.append('client_id', CLIENT_ID);
  form.append('refresh_token', refreshToken);

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const payload = await res.json() as TokenExchangeResponse;
  if (!res.ok || payload.error) {
    throw new Error(payload.error_description || payload.error || 'Refresh token failed');
  }
  return payload;
}

function getSessionExpiresAt(expiresInSeconds?: number): number | undefined {
  if (typeof expiresInSeconds !== 'number' || !Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
    return undefined;
  }
  return Date.now() + expiresInSeconds * 1000;
}

function isSessionExpired(expiresAt?: number): boolean {
  if (!expiresAt) return false;
  return expiresAt <= Date.now() + SESSION_EXPIRY_SKEW_MS;
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
  const sessionExpiresAtRef = useRef<number | undefined>(undefined);
  const accessTokenRef = useRef<string | undefined>(undefined);
  const idTokenRef = useRef<string | undefined>(undefined);
  const refreshTokenRef = useRef<string | undefined>(undefined);
  const userRef = useRef<AuthUser | undefined>(undefined);
  const refreshPromiseRef = useRef<Promise<string | undefined> | undefined>(undefined);

  const isConfigured = Boolean(DOMAIN && CLIENT_ID && REDIRECT_URI);
  const authToken = idToken || accessToken;

  const applySession = useCallback(
    async (
      next: {
        accessToken?: string;
        idToken?: string;
        refreshToken?: string;
        expiresAt?: number;
        user?: AuthUser;
      },
      options?: { persist?: boolean }
    ) => {
      const persist = options?.persist ?? true;

      accessTokenRef.current = next.accessToken;
      idTokenRef.current = next.idToken;
      refreshTokenRef.current = next.refreshToken;
      userRef.current = next.user;
      sessionExpiresAtRef.current = next.expiresAt;

      setAccessToken(next.accessToken);
      setIdToken(next.idToken);
      setUser(next.user);
      api.setToken(next.idToken || next.accessToken);

      if (!persist) {
        return;
      }

      await Promise.all([
        storeValue(ACCESS_TOKEN_KEY, next.accessToken),
        storeValue(ID_TOKEN_KEY, next.idToken),
        storeValue(REFRESH_TOKEN_KEY, next.refreshToken),
        storeNumber(SESSION_EXPIRES_AT_KEY, next.expiresAt),
        storeUser(next.user),
      ]);
    },
    []
  );

  const clearSession = useCallback(
    async (options?: { persist?: boolean }) => {
      const persist = options?.persist ?? true;

      accessTokenRef.current = undefined;
      idTokenRef.current = undefined;
      refreshTokenRef.current = undefined;
      userRef.current = undefined;
      sessionExpiresAtRef.current = undefined;
      refreshPromiseRef.current = undefined;

      setAccessToken(undefined);
      setIdToken(undefined);
      setUser(undefined);
      api.setToken(undefined);

      if (!persist) {
        return;
      }

      await Promise.all([
        deleteValue(ACCESS_TOKEN_KEY),
        deleteValue(ID_TOKEN_KEY),
        deleteValue(REFRESH_TOKEN_KEY),
        deleteValue(SESSION_EXPIRES_AT_KEY),
        deleteValue(USER_KEY),
      ]);
    },
    []
  );

  const refreshSession = useCallback(async (): Promise<string | undefined> => {
    const currentRefreshToken = refreshTokenRef.current;
    if (!currentRefreshToken) {
      const currentBearer = idTokenRef.current || accessTokenRef.current;
      if (currentBearer && isSessionExpired(sessionExpiresAtRef.current)) {
        await clearSession();
      }
      return currentBearer;
    }

    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    refreshPromiseRef.current = (async () => {
      try {
        const payload = await refreshTokens(currentRefreshToken);
        const nextAccessToken = payload.access_token;
        const nextIdToken = payload.id_token;
        const nextRefreshToken = payload.refresh_token || currentRefreshToken;
        const nextBearer = nextIdToken || nextAccessToken;

        if (!nextAccessToken || !nextBearer) {
          throw new Error('Cognito no devolvió tokens válidos al refrescar la sesión.');
        }

        await applySession({
          accessToken: nextAccessToken,
          idToken: nextIdToken,
          refreshToken: nextRefreshToken,
          expiresAt: getSessionExpiresAt(payload.expires_in),
          user: userRef.current,
        });

        return nextBearer;
      } catch (err: any) {
        console.warn('auth.refresh.failed', err?.message || err);
        setError('Tu sesión expiró. Inicia sesión de nuevo.');
        await clearSession();
        return undefined;
      } finally {
        refreshPromiseRef.current = undefined;
      }
    })();

    return refreshPromiseRef.current;
  }, [applySession, clearSession]);

  const ensureValidSession = useCallback(async (): Promise<string | undefined> => {
    const currentBearer = idTokenRef.current || accessTokenRef.current;
    const currentExpiresAt = sessionExpiresAtRef.current;

    if (currentBearer && (!currentExpiresAt || !isSessionExpired(currentExpiresAt))) {
      api.setToken(currentBearer);
      return currentBearer;
    }

    if (!currentBearer && refreshTokenRef.current) {
      return refreshSession();
    }

    if (refreshTokenRef.current) {
      return refreshSession();
    }

    if (currentBearer && currentExpiresAt && isSessionExpired(currentExpiresAt)) {
      await clearSession();
      return undefined;
    }

    api.setToken(currentBearer);
    return currentBearer;
  }, [clearSession, refreshSession]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedAccessToken, storedIdToken, storedRefreshToken, storedExpiresAt, storedUser] = await Promise.all([
          getValue(ACCESS_TOKEN_KEY),
          getValue(ID_TOKEN_KEY),
          getValue(REFRESH_TOKEN_KEY),
          getStoredNumber(SESSION_EXPIRES_AT_KEY),
          getStoredUser(),
        ]);

        if (cancelled) return;

        await applySession(
          {
            accessToken: storedAccessToken || undefined,
            idToken: storedIdToken || undefined,
            refreshToken: storedRefreshToken || undefined,
            expiresAt: storedExpiresAt,
            user: storedUser,
          },
          { persist: false }
        );

        const shouldRefresh =
          Boolean(storedRefreshToken) &&
          (
            !storedExpiresAt ||
            !storedAccessToken ||
            isSessionExpired(storedExpiresAt)
          );

        const storedBearer = shouldRefresh
          ? await refreshSession()
          : storedIdToken || storedAccessToken || undefined;

        if (!storedUser && storedBearer) {
          const syncedUser = await syncCurrentUser(storedBearer);
          if (!cancelled && syncedUser) {
            await applySession(
              {
                accessToken: accessTokenRef.current,
                idToken: idTokenRef.current,
                refreshToken: refreshTokenRef.current,
                expiresAt: sessionExpiresAtRef.current,
                user: syncedUser,
              }
            );
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
  }, [applySession, refreshSession]);

  useEffect(() => {
    api.setTokenResolver({
      getToken: ensureValidSession,
      refreshToken: refreshSession,
    });

    return () => {
      api.setTokenResolver(undefined);
    };
  }, [ensureValidSession, refreshSession]);

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

      await applySession({
        accessToken: nextAccessToken,
        idToken: nextIdToken,
        refreshToken: nextRefreshToken,
        expiresAt: getSessionExpiresAt(data.expires_in),
        user: undefined,
      });

      const syncedUser = await syncCurrentUser(nextBearer, provider);
      await applySession({
        accessToken: accessTokenRef.current,
        idToken: idTokenRef.current,
        refreshToken: refreshTokenRef.current,
        expiresAt: sessionExpiresAtRef.current,
        user: syncedUser,
      });
    } catch (err: any) {
      setError(err?.message || 'No pudimos completar el inicio de sesión.');
    } finally {
      setIsBusy(false);
      setIsHydrating(false);
    }
  }, [applySession, isConfigured]);

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
      await clearSession();
      setIsBusy(false);
    }
  }, [clearSession]);

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
