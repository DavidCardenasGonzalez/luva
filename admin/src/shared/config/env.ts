function readEnvValue(value?: string) {
  const trimmed = (value || '').trim()
  return trimmed || undefined
}

export const env = {
  adminApiBaseUrl: readEnvValue(import.meta.env.VITE_ADMIN_API_BASE_URL),
  cognitoDomain: readEnvValue(import.meta.env.VITE_COGNITO_DOMAIN),
  cognitoClientId: readEnvValue(import.meta.env.VITE_COGNITO_CLIENT_ID),
  redirectUri: readEnvValue(import.meta.env.VITE_REDIRECT_URI),
}
