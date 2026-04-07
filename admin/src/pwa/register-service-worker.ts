import { registerSW } from 'virtual:pwa-register'

export function registerAdminServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  registerSW({
    immediate: true,
    onRegisterError(error) {
      console.error('admin.pwa.register.error', error)
    },
  })
}
