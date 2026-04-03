function readEnvValue(value?: string) {
  const trimmed = (value || '').trim()
  return trimmed || undefined
}

export const env = {
  cognitoDomain: readEnvValue(import.meta.env.VITE_COGNITO_DOMAIN),
  cognitoClientId: readEnvValue(import.meta.env.VITE_COGNITO_CLIENT_ID),
  redirectUri: readEnvValue(import.meta.env.VITE_REDIRECT_URI),
}
