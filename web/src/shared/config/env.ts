function readEnvValue(value?: string) {
  const trimmed = (value || '').trim()
  return trimmed || undefined
}

export const env = {
  apiBaseUrl: readEnvValue(import.meta.env.VITE_API_BASE_URL),
  cognitoDomain: readEnvValue(import.meta.env.VITE_COGNITO_DOMAIN),
  cognitoClientId: readEnvValue(import.meta.env.VITE_COGNITO_CLIENT_ID),
  cognitoRegion: readEnvValue(import.meta.env.VITE_COGNITO_REGION),
  redirectUri: readEnvValue(import.meta.env.VITE_REDIRECT_URI),
}
