export const ADMIN_ROLE = 'admin';

export type CognitoClaims = Record<string, string | undefined>;

export type AdminIdentity = {
  email?: string;
  displayName?: string;
  roles: string[];
  lastAuthProvider: string;
};

export function getClaims(event: any): CognitoClaims {
  const rawClaims =
    event?.requestContext?.authorizer?.claims ||
    event?.requestContext?.authorizer?.jwt?.claims ||
    {};
  const claims: CognitoClaims = {};

  for (const [key, value] of Object.entries(rawClaims)) {
    if (value == null) continue;
    claims[key] = typeof value === 'string' ? value : String(value);
  }

  return claims;
}

export function normalizeEmail(value?: string): string | undefined {
  const email = (value || '').trim().toLowerCase();
  return email || undefined;
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = (value || '').trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return undefined;
}

function normalizeRole(value: string) {
  return value.trim().toLowerCase();
}

function parseClaimList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      return parseClaimList(JSON.parse(trimmed));
    } catch {
      return [trimmed];
    }
  }

  if (trimmed.includes(',')) {
    return trimmed.split(',');
  }

  return [trimmed];
}

function normalizeProvider(value?: string): string | undefined {
  const normalized = (value || '').trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === 'google') return 'google';
  if (normalized === 'apple' || normalized === 'signinwithapple') return 'apple';
  if (normalized === 'correo' || normalized === 'email' || normalized === 'cognito') return 'email';
  return normalized;
}

function deriveProviderFromClaims(claims: CognitoClaims): string {
  const identities = claims.identities;
  if (identities) {
    try {
      const providers = JSON.parse(identities) as Array<{ providerName?: string }>;
      const providerName = providers[0]?.providerName;
      const normalized = normalizeProvider(providerName);
      if (normalized) {
        return normalized;
      }
    } catch {
      // Ignore malformed identity provider hints from Cognito.
    }
  }

  return 'email';
}

export function extractRolesFromClaims(claims: CognitoClaims): string[] {
  const roles = new Set<string>();
  const values = [
    ...parseClaimList(claims['cognito:groups']),
    ...parseClaimList(claims.groups),
    ...parseClaimList(claims.group),
    ...parseClaimList(claims['custom:roles']),
    ...parseClaimList(claims['custom:role']),
    ...parseClaimList(claims.roles),
    ...parseClaimList(claims.role),
  ];

  for (const value of values) {
    const normalized = normalizeRole(value);
    if (normalized) {
      roles.add(normalized);
    }
  }

  return Array.from(roles);
}

export function hasAdminAccess(claims: CognitoClaims): boolean {
  return extractRolesFromClaims(claims).includes(ADMIN_ROLE);
}

export function getAdminIdentity(claims: CognitoClaims): AdminIdentity {
  const givenName = firstNonEmpty(claims.given_name, claims.givenName);
  const familyName = firstNonEmpty(claims.family_name, claims.familyName);
  const combinedName = [givenName, familyName].filter(Boolean).join(' ').trim() || undefined;

  return {
    email: normalizeEmail(claims.email || claims['cognito:username']),
    displayName: firstNonEmpty(claims.name, combinedName),
    roles: extractRolesFromClaims(claims),
    lastAuthProvider: deriveProviderFromClaims(claims),
  };
}

