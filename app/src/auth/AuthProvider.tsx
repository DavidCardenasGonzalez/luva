import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { api } from '../api/api';
import {
  resetMixpanelUserIdentity,
  setMixpanelUserIdentity,
  trackMixpanelEvent,
} from '../marketing/mixpanelEvents';

type AuthProviderName = 'google' | 'apple' | 'email';
type AuthEventName = 'login_completed' | 'signup_completed';

type AuthProGrant = {
  isActive: boolean;
  updatedAt?: string;
  expiresAt?: string;
  productId?: string;
  entitlementId?: string;
  appUserId?: string;
};

type AuthProAccess = {
  isActive: boolean;
  source?: 'subscription' | 'code' | 'multiple';
  updatedAt?: string;
  subscription?: AuthProGrant;
  code?: AuthProGrant;
};

type AuthUser = {
  email: string;
  cognitoSub?: string;
  displayName?: string;
  givenName?: string;
  familyName?: string;
  pictureUrl?: string;
  lastAuthProvider: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  isPro?: boolean;
  proAccess?: AuthProAccess;
};

type PromoCodeRedemptionResult = {
  code: string;
  isValid: boolean;
  premiumDays: number;
  expiresAt?: string;
};

type CurrentUserUpdatePayload = {
  displayName?: string;
  pictureUrl?: string;
  authProvider?: AuthProviderName;
  promoCode?: string;
  subscriptionAccess?: {
    isActive?: boolean;
    expiresAt?: string | null;
    productId?: string;
    entitlementId?: string;
    appUserId?: string;
  };
};

type EmailSignUpResult = {
  destination?: string;
  deliveryMedium?: string;
  requiresConfirmation: boolean;
};

type AuthContextValue = {
  isConfigured: boolean;
  isEmailAuthConfigured: boolean;
  isSignedIn: boolean;
  isLoading: boolean;
  error?: string;
  accessToken?: string;
  idToken?: string;
  user?: AuthUser;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<EmailSignUpResult>;
  confirmEmailSignUp: (email: string, code: string, password: string) => Promise<void>;
  resendEmailSignUpCode: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateCurrentUser: (payload?: CurrentUserUpdatePayload) => Promise<CurrentUserSyncResult>;
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
  promoCode?: PromoCodeRedemptionResult;
};

type CurrentUserSyncResult = {
  user?: AuthUser;
  promoCode?: PromoCodeRedemptionResult;
};

type CognitoAuthenticationResult = {
  AccessToken?: string;
  ExpiresIn?: number;
  IdToken?: string;
  RefreshToken?: string;
  TokenType?: string;
};

type CognitoInitiateAuthResponse = {
  AuthenticationResult?: CognitoAuthenticationResult;
  ChallengeName?: string;
};

type CognitoCodeDeliveryDetails = {
  AttributeName?: string;
  DeliveryMedium?: string;
  Destination?: string;
};

type CognitoSignUpResponse = {
  CodeDeliveryDetails?: CognitoCodeDeliveryDetails;
  UserConfirmed?: boolean;
};

type CognitoErrorResponse = {
  __type?: string;
  code?: string;
  message?: string;
  Message?: string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const extra = Constants.expoConfig?.extra || {};
const RAW_DOMAIN: string | undefined = extra.COGNITO_DOMAIN;
const DOMAIN = normalizeHostedUiDomain(RAW_DOMAIN);
const CLIENT_ID: string = extra.COGNITO_CLIENT_ID;
const COGNITO_REGION: string | undefined =
  typeof extra.COGNITO_REGION === 'string' && extra.COGNITO_REGION.trim()
    ? extra.COGNITO_REGION.trim()
    : deriveRegionFromHostedUiDomain(DOMAIN);
const COGNITO_IDP_ENDPOINT = COGNITO_REGION
  ? `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`
  : undefined;
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

function deriveRegionFromHostedUiDomain(domain?: string): string | undefined {
  if (!domain) return undefined;
  try {
    const hostname = new URL(domain).hostname;
    const match = hostname.match(/\.auth\.([a-z0-9-]+)\.amazoncognito\.com$/i);
    return match?.[1];
  } catch {
    return undefined;
  }
}

function normalizeEmailAddress(value: string) {
  return value.trim().toLowerCase();
}

function extractCognitoErrorCode(payload?: CognitoErrorResponse): string | undefined {
  const raw = payload?.__type || payload?.code;
  if (!raw) return undefined;
  return raw.split('#').pop()?.trim();
}

function getCognitoErrorMessage(payload?: CognitoErrorResponse, fallback?: string): string {
  const code = extractCognitoErrorCode(payload);
  switch (code) {
    case 'CodeMismatchException':
      return 'El código es incorrecto.';
    case 'ExpiredCodeException':
      return 'El código expiró. Solicita uno nuevo.';
    case 'InvalidParameterException':
      return 'Revisa los datos e inténtalo de nuevo.';
    case 'InvalidPasswordException':
      return 'La contraseña no cumple con los requisitos mínimos de Cognito.';
    case 'LimitExceededException':
    case 'TooManyRequestsException':
    case 'TooManyFailedAttemptsException':
      return 'Hiciste demasiados intentos. Espera un momento e inténtalo otra vez.';
    case 'NotAuthorizedException':
    case 'UserNotFoundException':
      return 'Correo o contraseña incorrectos.';
    case 'PasswordResetRequiredException':
      return 'Tu cuenta requiere restablecer la contraseña antes de continuar.';
    case 'ResourceNotFoundException':
      return 'La configuración de Cognito no es válida para este app.';
    case 'UserLambdaValidationException':
      return fallback || payload?.message || payload?.Message || 'No pudimos validar tu cuenta.';
    case 'UserNotConfirmedException':
      return 'Tu cuenta todavía no está confirmada. Usa el código que llegó a tu correo.';
    case 'UsernameExistsException':
      return 'Ya existe una cuenta con ese correo.';
    default:
      return fallback || payload?.message || payload?.Message || 'No pudimos completar la operación en Cognito.';
  }
}

async function callCognito<T>(action: string, body: Record<string, unknown>): Promise<T> {
  if (!COGNITO_IDP_ENDPOINT || !CLIENT_ID) {
    throw new Error('Falta configurar COGNITO_CLIENT_ID y la región de Cognito en el app.');
  }

  const response = await fetch(COGNITO_IDP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({})) as T & CognitoErrorResponse;
  if (!response.ok) {
    throw new Error(getCognitoErrorMessage(payload));
  }
  return payload as T;
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

async function syncCurrentUser(
  authToken: string,
  payload?: CurrentUserUpdatePayload
): Promise<CurrentUserSyncResult> {
  api.setToken(authToken);
  try {
    const response = await api.post<CurrentUserResponse>('/users/me', payload);
    if (!response?.user?.email) {
      return {
        ...(response?.promoCode ? { promoCode: response.promoCode } : {}),
      };
    }
    await storeUser(response.user);
    return {
      user: response.user,
      ...(response.promoCode ? { promoCode: response.promoCode } : {}),
    };
  } catch (err: any) {
    console.warn('user.sync.failed', err?.message || err);
    return {};
  }
}

async function trackCompletedAuthEvent(
  eventName: AuthEventName,
  provider: AuthProviderName,
  user?: AuthUser,
  properties?: Record<string, string | number | boolean | undefined>
) {
  await setMixpanelUserIdentity(user);
  await trackMixpanelEvent(eventName, {
    event_category: 'auth',
    auth_provider: provider,
    ...properties,
  });
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

  const isHostedUiConfigured = Boolean(DOMAIN && CLIENT_ID && REDIRECT_URI);
  const isEmailAuthConfigured = Boolean(DOMAIN && CLIENT_ID && COGNITO_IDP_ENDPOINT);
  const isConfigured = isHostedUiConfigured;
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

  const completeAuthenticatedSession = useCallback(
    async (result: CognitoAuthenticationResult, provider: AuthProviderName) => {
      const nextAccessToken = result.AccessToken;
      const nextIdToken = result.IdToken;
      const nextRefreshToken = result.RefreshToken;
      const nextBearer = nextIdToken || nextAccessToken;

      if (!nextAccessToken || !nextBearer) {
        throw new Error('Cognito no devolvió tokens válidos.');
      }

      await applySession({
        accessToken: nextAccessToken,
        idToken: nextIdToken,
        refreshToken: nextRefreshToken,
        expiresAt: getSessionExpiresAt(result.ExpiresIn),
        user: undefined,
      });

      const syncResult = await syncCurrentUser(nextBearer, { authProvider: provider });
      await applySession({
        accessToken: accessTokenRef.current,
        idToken: idTokenRef.current,
        refreshToken: refreshTokenRef.current,
        expiresAt: sessionExpiresAtRef.current,
        user: syncResult.user,
      });
    },
    [applySession]
  );

  const performEmailPasswordSignIn = useCallback(
    async (email: string, password: string) => {
      if (!isEmailAuthConfigured) {
        throw new Error('Falta configurar COGNITO_DOMAIN, COGNITO_CLIENT_ID o COGNITO_REGION en el app.');
      }

      const normalizedEmail = normalizeEmailAddress(email);
      const payload = await callCognito<CognitoInitiateAuthResponse>('InitiateAuth', {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: {
          USERNAME: normalizedEmail,
          PASSWORD: password,
        },
      });

      if (payload.ChallengeName) {
        throw new Error('Esta cuenta requiere una verificación adicional que el app todavía no soporta.');
      }

      if (!payload.AuthenticationResult) {
        throw new Error('Cognito no devolvió tokens válidos.');
      }

      await completeAuthenticatedSession(payload.AuthenticationResult, 'email');
    },
    [completeAuthenticatedSession, isEmailAuthConfigured]
  );

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

        if (storedBearer) {
          const syncResult = await syncCurrentUser(storedBearer);
          if (!cancelled && syncResult.user) {
            await applySession(
              {
                accessToken: accessTokenRef.current,
                idToken: idTokenRef.current,
                refreshToken: refreshTokenRef.current,
                expiresAt: sessionExpiresAtRef.current,
                user: syncResult.user,
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
    if (!isHostedUiConfigured) {
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
      await completeAuthenticatedSession({
        AccessToken: data.access_token,
        IdToken: data.id_token,
        RefreshToken: data.refresh_token,
        ExpiresIn: data.expires_in,
      }, provider);
      await trackCompletedAuthEvent('login_completed', provider, userRef.current);
    } catch (err: any) {
      setError(err?.message || 'No pudimos completar el inicio de sesión.');
    } finally {
      setIsBusy(false);
      setIsHydrating(false);
    }
  }, [completeAuthenticatedSession, isHostedUiConfigured]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const normalizedEmail = normalizeEmailAddress(email);
      if (!normalizedEmail) {
        setError('Ingresa tu correo.');
        return;
      }
      if (!password.trim()) {
        setError('Ingresa tu contraseña.');
        return;
      }

      setIsBusy(true);
      setError(undefined);

      try {
        await performEmailPasswordSignIn(normalizedEmail, password);
        await trackCompletedAuthEvent('login_completed', 'email', userRef.current);
      } catch (err: any) {
        setError(err?.message || 'No pudimos iniciar sesión con correo.');
      } finally {
        setIsBusy(false);
        setIsHydrating(false);
      }
    },
    [performEmailPasswordSignIn]
  );

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmail(email, password);
  }, [signInWithEmail]);

  const signInWithGoogle = useCallback(async () => {
    await signInWithProvider('google');
  }, [signInWithProvider]);

  const signInWithApple = useCallback(async () => {
    await signInWithProvider('apple');
  }, [signInWithProvider]);

  const signUpWithEmail = useCallback(
    async (email: string, password: string): Promise<EmailSignUpResult> => {
      const normalizedEmail = normalizeEmailAddress(email);
      if (!normalizedEmail) {
        const message = 'Ingresa un correo válido.';
        setError(message);
        throw new Error(message);
      }
      if (!password.trim()) {
        const message = 'Ingresa una contraseña.';
        setError(message);
        throw new Error(message);
      }
      if (!isEmailAuthConfigured) {
        const message = 'Falta configurar COGNITO_DOMAIN, COGNITO_CLIENT_ID o COGNITO_REGION en el app.';
        setError(message);
        throw new Error(message);
      }

      setIsBusy(true);
      setError(undefined);

      try {
        const payload = await callCognito<CognitoSignUpResponse>('SignUp', {
          ClientId: CLIENT_ID,
          Username: normalizedEmail,
          Password: password,
          UserAttributes: [
            { Name: 'email', Value: normalizedEmail },
          ],
        });

        if (payload.UserConfirmed) {
          await performEmailPasswordSignIn(normalizedEmail, password);
          await trackCompletedAuthEvent('signup_completed', 'email', userRef.current, {
            required_confirmation: false,
          });
          return { requiresConfirmation: false };
        }

        return {
          destination: payload.CodeDeliveryDetails?.Destination,
          deliveryMedium: payload.CodeDeliveryDetails?.DeliveryMedium,
          requiresConfirmation: true,
        };
      } catch (err: any) {
        const message = err?.message || 'No pudimos crear tu cuenta.';
        setError(message);
        throw new Error(message);
      } finally {
        setIsBusy(false);
        setIsHydrating(false);
      }
    },
    [isEmailAuthConfigured, performEmailPasswordSignIn]
  );

  const confirmEmailSignUp = useCallback(
    async (email: string, code: string, password: string) => {
      const normalizedEmail = normalizeEmailAddress(email);
      const trimmedCode = code.trim();
      if (!normalizedEmail) {
        const message = 'Ingresa un correo válido.';
        setError(message);
        throw new Error(message);
      }
      if (!trimmedCode) {
        const message = 'Ingresa el código que llegó a tu correo.';
        setError(message);
        throw new Error(message);
      }
      if (!password.trim()) {
        const message = 'Ingresa tu contraseña para terminar el acceso.';
        setError(message);
        throw new Error(message);
      }

      setIsBusy(true);
      setError(undefined);

      try {
        await callCognito('ConfirmSignUp', {
          ClientId: CLIENT_ID,
          Username: normalizedEmail,
          ConfirmationCode: trimmedCode,
        });
        await performEmailPasswordSignIn(normalizedEmail, password);
        await trackCompletedAuthEvent('signup_completed', 'email', userRef.current, {
          required_confirmation: true,
        });
      } catch (err: any) {
        const message = err?.message || 'No pudimos confirmar tu cuenta.';
        setError(message);
        throw new Error(message);
      } finally {
        setIsBusy(false);
        setIsHydrating(false);
      }
    },
    [performEmailPasswordSignIn]
  );

  const resendEmailSignUpCode = useCallback(
    async (email: string) => {
      const normalizedEmail = normalizeEmailAddress(email);
      if (!normalizedEmail) {
        const message = 'Ingresa un correo válido.';
        setError(message);
        throw new Error(message);
      }

      setIsBusy(true);
      setError(undefined);

      try {
        await callCognito('ResendConfirmationCode', {
          ClientId: CLIENT_ID,
          Username: normalizedEmail,
        });
      } catch (err: any) {
        const message = err?.message || 'No pudimos reenviar el código.';
        setError(message);
        throw new Error(message);
      } finally {
        setIsBusy(false);
      }
    },
    []
  );

  const updateCurrentUser = useCallback(
    async (payload?: CurrentUserUpdatePayload): Promise<CurrentUserSyncResult> => {
      const currentBearer = await ensureValidSession();
      if (!currentBearer) {
        return {};
      }

      const syncResult = await syncCurrentUser(currentBearer, payload);
      if (syncResult.user) {
        await applySession({
          accessToken: accessTokenRef.current,
          idToken: idTokenRef.current,
          refreshToken: refreshTokenRef.current,
          expiresAt: sessionExpiresAtRef.current,
          user: syncResult.user,
        });
      }

      return syncResult;
    },
    [applySession, ensureValidSession]
  );

  const signOut = useCallback(async () => {
    setIsBusy(true);
    setError(undefined);

    try {
      const provider = userRef.current?.lastAuthProvider?.trim().toLowerCase();
      const shouldOpenHostedLogout = Boolean(
        DOMAIN &&
        CLIENT_ID &&
        provider &&
        provider !== 'email'
      );
      if (shouldOpenHostedLogout) {
        const logoutUrl = `${DOMAIN}/logout?client_id=${encodeURIComponent(CLIENT_ID)}&logout_uri=${encodeURIComponent(REDIRECT_URI)}`;
        try {
          await WebBrowser.openAuthSessionAsync(logoutUrl, REDIRECT_URI);
        } catch (err) {
          console.warn('auth.logout.failed', err);
        }
      }
    } finally {
      await clearSession();
      await resetMixpanelUserIdentity();
      setIsBusy(false);
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({
      isConfigured,
      isEmailAuthConfigured,
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
      signUpWithEmail,
      confirmEmailSignUp,
      resendEmailSignUpCode,
      signOut,
      updateCurrentUser,
    }),
    [
      accessToken,
      authToken,
      confirmEmailSignUp,
      error,
      idToken,
      isEmailAuthConfigured,
      isBusy,
      isConfigured,
      isHydrating,
      resendEmailSignUpCode,
      signIn,
      signInWithApple,
      signInWithEmail,
      signInWithGoogle,
      signUpWithEmail,
      signOut,
      updateCurrentUser,
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
