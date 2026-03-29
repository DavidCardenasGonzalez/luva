import { appStoreUrl, playStoreUrl } from '@/features/marketing/content/site-content'

export async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const input = document.createElement('textarea')
  input.value = value
  input.setAttribute('readonly', '')
  input.style.position = 'absolute'
  input.style.left = '-9999px'
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
}

export function getSmartRedirectTarget() {
  if (typeof navigator === 'undefined') {
    return null
  }

  const userAgent = navigator.userAgent || ''
  const platform = navigator.platform || ''
  const maxTouchPoints = navigator.maxTouchPoints || 0
  const isAndroid = /android/i.test(userAgent)
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)

  if (isAndroid) {
    return {
      label: 'Android',
      href: playStoreUrl,
    }
  }

  if (isIOS) {
    return {
      label: 'iPhone o iPad',
      href: appStoreUrl,
    }
  }

  return null
}

export function getInAppBrowserName() {
  if (typeof navigator === 'undefined') {
    return null
  }

  const userAgent = navigator.userAgent || ''

  if (/tiktok/i.test(userAgent)) {
    return 'TikTok'
  }

  if (/instagram/i.test(userAgent)) {
    return 'Instagram'
  }

  if (/FBAN|FBAV/i.test(userAgent)) {
    return 'Facebook'
  }

  return null
}
